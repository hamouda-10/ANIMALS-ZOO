import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ANATOMY_HOTSPOTS } from '../data/zoosData';

interface Elephant3DStageProps {
  lang: 'en' | 'ar';
  onBookSanctuary: () => void;
}

type FinishMode = 'bronze' | 'terracotta' | 'ivory' | 'blueprint';
type CameraPreset = 'orbit' | 'profile' | 'tusks' | 'aerial';

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  orbit: { pos: [6.4, 3.6, 6.8], target: [0, 1.55, 0] },
  profile: { pos: [0.4, 2.05, 7.6], target: [0.1, 1.65, 0] },
  tusks: { pos: [4.1, 2.35, 3.4], target: [1.65, 1.75, 0.1] },
  aerial: { pos: [4.6, 7.2, 5.2], target: [0, 1.1, 0] },
};

// Module-scope reusable vectors to guarantee zero GC in the animation loop
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _dummy = new THREE.Object3D();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createProceduralGrainTexture(
  baseHex: string,
  accentHex: string,
  isColor: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Organic fine hide / bronze / stone striations
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 4 + Math.random() * 22;
    const h = 1 + Math.random() * 2.5;
    ctx.fillStyle = i % 3 === 0 ? accentHex : 'rgba(255,250,240,0.06)';
    ctx.globalAlpha = 0.08 + Math.random() * 0.14;
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(42, 22, 20, 0.52)');
  grad.addColorStop(0.55, 'rgba(42, 22, 20, 0.2)');
  grad.addColorStop(1, 'rgba(42, 22, 20, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Elephant3DStage: React.FC<Elephant3DStageProps> = ({
  lang,
  onBookSanctuary,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [finish, setFinish] = useState<FinishMode>('bronze');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [explodeLevel, setExplodeLevel] = useState<number>(0);
  const [animateStride, setAnimateStride] = useState<boolean>(true);
  const [activeHotspotId, setActiveHotspotId] = useState<string>('tusks');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  // Refs synced to Three.js loop without recreating canvas
  const stateRef = useRef({
    finish: 'bronze' as FinishMode,
    explode: 0,
    stride: true,
    cameraPreset: 'orbit' as CameraPreset,
    transitionActive: false,
    activeHotspot: 'tusks',
  });

  useEffect(() => {
    stateRef.current.finish = finish;
  }, [finish]);

  useEffect(() => {
    stateRef.current.explode = explodeLevel;
  }, [explodeLevel]);

  useEffect(() => {
    stateRef.current.stride = animateStride;
  }, [animateStride]);

  useEffect(() => {
    stateRef.current.cameraPreset = cameraPreset;
    stateRef.current.transitionActive = true;
  }, [cameraPreset]);

  useEffect(() => {
    stateRef.current.activeHotspot = activeHotspotId;
  }, [activeHotspotId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    // Scene & Studio Environment
    const scene = new THREE.Scene();
    const bgHex = 0xe6dcc8;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.036);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      38,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      80
    );
    camera.position.set(6.4, 3.6, 6.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.55, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.8;
    controls.maxDistance = 13.5;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minPolarAngle = 0.2;
    controls.enablePan = false;
    controls.addEventListener('start', () => {
      stateRef.current.transitionActive = false;
    });

    // Warm/Cool 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xf6efe1, 0x6e4b3a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.3);
    keyLight.position.set(6.5, 9.5, 5.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 24;
      const d = 5.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd98c57, 1.15);
    rimLight.position.set(-7, 4.5, -5.5);
    scene.add(rimLight);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const bodyGrainTex = createProceduralGrainTexture('#5C3A36', '#2B1617', true);
    bodyGrainTex.anisotropy = maxAniso;
    const stoneGrainTex = createProceduralGrainTexture('#DDD1BA', '#B9A78B', true);
    stoneGrainTex.anisotropy = maxAniso;
    const bumpTex = createProceduralGrainTexture('#808080', '#484848', false);

    // Materials (varied roughness >= 0.25 between body, ivory tusks, and brass rings)
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x5d3b34,
      map: bodyGrainTex,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      metalness: 0.72,
      roughness: 0.34,
      clearcoat: 0.18,
      clearcoatRoughness: 0.45,
    });

    const ivoryMat = new THREE.MeshPhysicalMaterial({
      color: 0xf7eedb,
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
    });

    const brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xb67444,
      metalness: 0.88,
      roughness: 0.22,
    });

    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0xddd1ba,
      map: stoneGrainTex,
      roughness: 0.86,
      metalness: 0.05,
    });

    const darkEarthMat = new THREE.MeshStandardMaterial({
      color: 0x6b4b39,
      roughness: 0.92,
      metalness: 0.02,
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x676f49,
      roughness: 0.82,
      metalness: 0.04,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x43282a,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });

    // =====================================================
    // COMPOSITE 16-PART PROCEDURAL SCULPTURAL ELEPHANT GROUP
    // Grounded bottom-center at y = 0 on top of plinth
    // =====================================================
    const dioramaGroup = new THREE.Group();
    scene.add(dioramaGroup);

    // Tiered Topographic Savanna Plinth (grounded below y = 0)
    const plinthGroup = new THREE.Group();
    dioramaGroup.add(plinthGroup);

    const upperPlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(3.45, 3.62, 0.28, 48),
      plinthMat
    );
    upperPlinth.position.y = -0.14;
    upperPlinth.receiveShadow = true;
    plinthGroup.add(upperPlinth);

    const lowerPlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(4.05, 4.28, 0.26, 48),
      darkEarthMat
    );
    lowerPlinth.position.y = -0.43;
    lowerPlinth.receiveShadow = true;
    plinthGroup.add(lowerPlinth);

    // Subtle brass rim ring embedded on plinth
    const plinthBrassRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.52, 0.028, 12, 72),
      brassMat
    );
    plinthBrassRing.rotation.x = Math.PI / 2;
    plinthBrassRing.position.y = 0.015;
    plinthGroup.add(plinthBrassRing);

    // Contact shadow plane directly under elephant (+0.02 Y offset to prevent Z-fighting)
    const shadowTex = createContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.58,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0.1, 0.02, 0);
    dioramaGroup.add(contactShadow);

    // Architectural Explodable Survey Rings around the elephant
    const surveyRingsGroup = new THREE.Group();
    dioramaGroup.add(surveyRingsGroup);

    const ringSpecs = [
      { r: 2.85, y: 0.8, tilt: 0.08 },
      { r: 3.15, y: 1.75, tilt: -0.06 },
      { r: 2.55, y: 2.65, tilt: 0.12 },
    ];
    const surveyRings: THREE.Mesh[] = [];
    ringSpecs.forEach((spec) => {
      const rMesh = new THREE.Mesh(
        new THREE.TorusGeometry(spec.r, 0.014, 10, 96),
        brassMat
      );
      rMesh.rotation.x = Math.PI / 2 + spec.tilt;
      rMesh.position.y = spec.y;
      rMesh.userData.baseY = spec.y;
      surveyRings.push(rMesh);
      surveyRingsGroup.add(rMesh);
    });

    // Elephant Master Group
    const elephantGroup = new THREE.Group();
    dioramaGroup.add(elephantGroup);

    const bodyMeshes: THREE.Mesh[] = [];
    const registerBodyMesh = (geo: THREE.BufferGeometry, parent: THREE.Object3D) => {
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.castShadow = !isSoftwareGl;
      mesh.receiveShadow = !isSoftwareGl;
      parent.add(mesh);
      bodyMeshes.push(mesh);
      return mesh;
    };

    // 1. Torso & Ribcage (sculpted elongated barrel)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(-0.15, 1.88, 0);
    elephantGroup.add(torsoGroup);

    const mainBarrel = registerBodyMesh(new THREE.SphereGeometry(0.96, 28, 22), torsoGroup);
    mainBarrel.scale.set(1.38, 1.04, 0.88);

    // 2. Shoulder Hump (iconic Loxodonta high dorsal arch)
    const shoulder = registerBodyMesh(new THREE.SphereGeometry(0.76, 24, 20), torsoGroup);
    shoulder.position.set(0.72, 0.24, 0);
    shoulder.scale.set(1.0, 1.08, 0.86);

    // 3. Hindquarters / Pelvis slope
    const haunch = registerBodyMesh(new THREE.SphereGeometry(0.72, 22, 18), torsoGroup);
    haunch.position.set(-0.88, -0.08, 0);
    haunch.scale.set(1.05, 0.96, 0.84);

    // 4. Articulated Head Assembly
    const headGroup = new THREE.Group();
    headGroup.position.set(1.18, 2.28, 0);
    elephantGroup.add(headGroup);

    const cranium = registerBodyMesh(new THREE.SphereGeometry(0.62, 26, 22), headGroup);
    cranium.scale.set(1.04, 1.12, 0.92);

    const browRidge = registerBodyMesh(new THREE.SphereGeometry(0.42, 18, 16), headGroup);
    browRidge.position.set(0.32, 0.16, 0);
    browRidge.scale.set(0.9, 0.82, 0.98);

    const jaw = registerBodyMesh(new THREE.SphereGeometry(0.36, 16, 14), headGroup);
    jaw.position.set(0.24, -0.36, 0);
    jaw.scale.set(1.1, 0.72, 0.78);

    // Subtle dark obsidian eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x1c1211,
      roughness: 0.15,
      metalness: 0.2,
    });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), eyeMat);
      eye.position.set(0.38, 0.04, side * 0.45);
      headGroup.add(eye);
    });

    // 5. Wide African Scalloped Ears (ExtrudeGeometry with smooth bevels)
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0.35);
    earShape.bezierCurveTo(0.45, 0.72, 1.18, 0.52, 1.15, -0.05);
    earShape.bezierCurveTo(1.12, -0.52, 0.62, -0.96, 0.22, -0.82);
    earShape.bezierCurveTo(-0.08, -0.72, -0.1, -0.22, 0, 0.35);

    const earGeo = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    earGeo.center();

    const leftEarPivot = new THREE.Group();
    leftEarPivot.position.set(-0.08, 0.12, 0.46);
    headGroup.add(leftEarPivot);
    const leftEarMesh = registerBodyMesh(earGeo, leftEarPivot);
    leftEarMesh.position.set(-0.36, -0.08, 0.28);
    leftEarMesh.rotation.set(0.08, -0.58, -0.12);

    const rightEarPivot = new THREE.Group();
    rightEarPivot.position.set(-0.08, 0.12, -0.46);
    headGroup.add(rightEarPivot);
    const rightEarMesh = registerBodyMesh(earGeo, rightEarPivot);
    rightEarMesh.position.set(-0.36, -0.08, -0.28);
    rightEarMesh.rotation.set(-0.08, 0.58, -0.12);
    rightEarMesh.scale.z = -1;

    // 6. Articulated Sculpted Trunk (Curved tapered segments)
    const trunkPivot = new THREE.Group();
    trunkPivot.position.set(0.5, -0.1, 0);
    headGroup.add(trunkPivot);

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(0.32, -0.35, 0),
      new THREE.Vector3(0.42, -0.98, 0),
      new THREE.Vector3(0.35, -1.52, 0),
      new THREE.Vector3(0.56, -1.78, 0),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 28, 0.17, 14, false);
    // Taper radius along trunk length
    const tPos = trunkGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const y = tPos.getY(i);
      const t = THREE.MathUtils.clamp((0.12 - y) / 1.9, 0, 1);
      const center = trunkCurve.getPoint(t);
      const scale = THREE.MathUtils.lerp(1.22, 0.44, t);
      tPos.setXYZ(
        i,
        center.x + (tPos.getX(i) - center.x) * scale,
        center.y + (tPos.getY(i) - center.y) * scale,
        center.z + (tPos.getZ(i) - center.z) * scale
      );
    }
    trunkGeo.computeVertexNormals();
    registerBodyMesh(trunkGeo, trunkPivot);

    // 7. Twin Curved Ivory Tusks (TubeGeometry with tapered tips)
    const tusksGroup = new THREE.Group();
    tusksGroup.position.set(0.42, -0.24, 0);
    headGroup.add(tusksGroup);

    [-1, 1].forEach((side) => {
      const tuskCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.04, side * 0.24),
        new THREE.Vector3(0.48, -0.2, side * 0.34),
        new THREE.Vector3(1.06, -0.14, side * 0.39),
        new THREE.Vector3(1.58, 0.26, side * 0.32),
      ]);
      const tuskGeo = new THREE.TubeGeometry(tuskCurve, 24, 0.088, 12, false);
      const posAttr = tuskGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const t = THREE.MathUtils.clamp(x / 1.58, 0, 1);
        const pt = tuskCurve.getPoint(t);
        const s = THREE.MathUtils.lerp(1.0, 0.14, Math.pow(t, 0.85));
        posAttr.setXYZ(
          i,
          pt.x + (posAttr.getX(i) - pt.x) * s,
          pt.y + (posAttr.getY(i) - pt.y) * s,
          pt.z + (posAttr.getZ(i) - pt.z) * s
        );
      }
      tuskGeo.computeVertexNormals();
      const tuskMesh = new THREE.Mesh(tuskGeo, ivoryMat);
      tuskMesh.castShadow = !isSoftwareGl;
      tusksGroup.add(tuskMesh);
    });

    // 8. Four Pillar Legs (Upper thigh + lower shin + cushioned footpad grounded at y = 0)
    const legSpecs = [
      { id: 'fl', x: 0.62, z: 0.44, phase: 0 },
      { id: 'fr', x: 0.62, z: -0.44, phase: Math.PI },
      { id: 'bl', x: -0.82, z: 0.42, phase: Math.PI },
      { id: 'br', x: -0.82, z: -0.42, phase: 0 },
    ];
    const legPivots: { pivot: THREE.Group; phase: number }[] = [];

    legSpecs.forEach((spec) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(spec.x, 1.48, spec.z);
      elephantGroup.add(legPivot);

      const upperLeg = registerBodyMesh(
        new THREE.CylinderGeometry(0.28, 0.22, 0.84, 16),
        legPivot
      );
      upperLeg.position.y = -0.38;

      const knee = registerBodyMesh(new THREE.SphereGeometry(0.22, 14, 12), legPivot);
      knee.position.y = -0.78;

      const lowerLeg = registerBodyMesh(
        new THREE.CylinderGeometry(0.2, 0.23, 0.66, 16),
        legPivot
      );
      lowerLeg.position.y = -1.1;

      const footPad = registerBodyMesh(
        new THREE.CylinderGeometry(0.24, 0.26, 0.16, 16),
        legPivot
      );
      footPad.position.y = -1.4; // bottom lands flush at y = 0.00!

      // Subtle ivory toenails on front of each foot
      for (let n = -1; n <= 1; n++) {
        const nail = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.07, 0.065),
          ivoryMat
        );
        nail.position.set(0.22, -1.43, n * 0.085);
        legPivot.add(nail);
      }

      legPivots.push({ pivot: legPivot, phase: spec.phase });
    });

    // 9. Tail with tuft
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-1.54, 1.72, 0);
    elephantGroup.add(tailPivot);
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.18, -0.45, 0),
      new THREE.Vector3(-0.14, -0.95, 0),
    ]);
    registerBodyMesh(new THREE.TubeGeometry(tailCurve, 12, 0.045, 8, false), tailPivot);
    const tailTuft = registerBodyMesh(new THREE.ConeGeometry(0.09, 0.22, 10), tailPivot);
    tailTuft.position.set(-0.14, -1.04, 0);

    // Miniature Procedural Flat-Top Savanna Acacia Tree on Plinth Edge (5-part Group)
    const createAcaciaTree = (x: number, z: number, s: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(s);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.09, 1.25, 10),
        darkEarthMat
      );
      trunk.position.y = 0.62;
      trunk.rotation.z = 0.08;
      tree.add(trunk);

      const branch1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.05, 0.7, 8),
        darkEarthMat
      );
      branch1.position.set(-0.22, 1.18, 0.06);
      branch1.rotation.z = 0.65;
      tree.add(branch1);

      const branch2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.048, 0.65, 8),
        darkEarthMat
      );
      branch2.position.set(0.24, 1.16, -0.05);
      branch2.rotation.z = -0.62;
      tree.add(branch2);

      const canopyMain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.56, 0.18, 16),
        foliageMat
      );
      canopyMain.position.set(0, 1.48, 0);
      tree.add(canopyMain);

      const canopyTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.72, 0.14, 14),
        foliageMat
      );
      canopyTop.position.set(-0.12, 1.59, 0.05);
      tree.add(canopyTop);

      return tree;
    };

    dioramaGroup.add(createAcaciaTree(-2.35, -1.45, 0.92));
    dioramaGroup.add(createAcaciaTree(-1.85, 1.95, 0.68));

    // InstancedMesh Savanna Grass Tufts across plinth (90 instances, zero draw-call bloat)
    const grassCount = 90;
    const grassGeo = new THREE.ConeGeometry(0.035, 0.28, 5);
    grassGeo.translate(0, 0.14, 0);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0xb6955d,
      roughness: 0.88,
      metalness: 0.02,
    });
    const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    const tintColor = new THREE.Color();
    for (let i = 0; i < grassCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 1.65 + Math.random() * 1.55;
      _dummy.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      _dummy.rotation.set(
        (Math.random() - 0.5) * 0.28,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.28
      );
      const sc = 0.75 + Math.random() * 0.55;
      _dummy.scale.set(sc, sc * (0.85 + Math.random() * 0.45), sc);
      _dummy.updateMatrix();
      grassInst.setMatrixAt(i, _dummy.matrix);
      tintColor.setHSL(0.11 + (Math.random() - 0.5) * 0.04, 0.38, 0.48 + (Math.random() - 0.5) * 0.1);
      grassInst.setColorAt(i, tintColor);
    }
    grassInst.instanceMatrix.needsUpdate = true;
    if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
    grassInst.computeBoundingSphere();
    dioramaGroup.add(grassInst);

    // Floating Golden Savanna Dust Motes (InstancedMesh)
    const moteCount = 48;
    const moteGeo = new THREE.OctahedronGeometry(0.026, 0);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xc27b44,
      transparent: true,
      opacity: 0.46,
    });
    const motesInst = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
    motesInst.frustumCulled = false;
    const moteSeeds = Array.from({ length: moteCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 1.8 + Math.random() * 2.5,
      y: 0.4 + Math.random() * 3.1,
      speed: 0.14 + Math.random() * 0.22,
      bob: Math.random() * Math.PI * 2,
    }));
    dioramaGroup.add(motesInst);

    // Interactive Raycastable 3D Anatomy Hotspots (Layer 1)
    const hotspotData: { id: string; pos: [number, number, number] }[] = [
      { id: 'tusks', pos: [2.55, 2.08, 0.48] },
      { id: 'ears', pos: [0.82, 2.58, 0.96] },
      { id: 'trunk', pos: [2.12, 1.25, 0.18] },
      { id: 'feet', pos: [0.85, 0.22, 0.68] },
    ];
    const hotspotMeshes: THREE.Mesh[] = [];
    const hotspotBaseMat = new THREE.MeshStandardMaterial({
      color: 0xa86438,
      emissive: 0x5c2c12,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.6,
    });

    hotspotData.forEach((h) => {
      const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 1),
        hotspotBaseMat.clone()
      );
      beacon.position.set(h.pos[0], h.pos[1], h.pos[2]);
      beacon.userData.hotspotId = h.id;
      beacon.userData.basePos = new THREE.Vector3(...h.pos);
      beacon.layers.enable(1);
      dioramaGroup.add(beacon);
      hotspotMeshes.push(beacon);
    });

    // Blueprint wireframe clone synced to bodyMeshes
    const wireMeshes: THREE.Mesh[] = bodyMeshes.map((m) => {
      const w = new THREE.Mesh(m.geometry, wireMat);
      w.position.copy(m.position);
      w.rotation.copy(m.rotation);
      w.scale.copy(m.scale).multiplyScalar(1.012);
      w.visible = false;
      m.parent?.add(w);
      return w;
    });

    // Raycaster for clicking 3D anatomy beacons
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();

    const onPointerDown = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotspotMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.hotspotId as string;
        setActiveHotspotId(hitId);
        const found = ANATOMY_HOTSPOTS.find((item) => item.id === hitId);
        if (found) {
          setCameraPreset(found.cameraPreset);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize handling
    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(container);

    // Animation loop with Software WebGL afterDraw pacing
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let currentExplode = 0;
    let lastFinish: FinishMode | null = null;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 90);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const applyFinish = (mode: FinishMode) => {
      if (mode === 'bronze') {
        bodyMat.color.setHex(0x5d3b34);
        bodyMat.metalness = 0.72;
        bodyMat.roughness = 0.34;
        bodyMat.opacity = 1;
        bodyMat.transparent = false;
        wireMeshes.forEach((w) => (w.visible = false));
      } else if (mode === 'terracotta') {
        bodyMat.color.setHex(0xa86438);
        bodyMat.metalness = 0.08;
        bodyMat.roughness = 0.78;
        bodyMat.opacity = 1;
        bodyMat.transparent = false;
        wireMeshes.forEach((w) => (w.visible = false));
      } else if (mode === 'ivory') {
        bodyMat.color.setHex(0xeae0cc);
        bodyMat.metalness = 0.05;
        bodyMat.roughness = 0.42;
        bodyMat.opacity = 1;
        bodyMat.transparent = false;
        wireMeshes.forEach((w) => (w.visible = false));
      } else {
        bodyMat.color.setHex(0xdfd3be);
        bodyMat.metalness = 0.05;
        bodyMat.roughness = 0.85;
        bodyMat.opacity = 0.35;
        bodyMat.transparent = true;
        wireMeshes.forEach((w) => (w.visible = true));
      }
      bodyMat.needsUpdate = true;
    };

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      if (lastFinish !== st.finish) {
        applyFinish(st.finish);
        lastFinish = st.finish;
      }

      // Smoothly damp exploded view separation
      currentExplode = THREE.MathUtils.damp(currentExplode, st.explode, 5.5, delta);

      // Gentle alive elephant kinematics
      const motionAmp = st.stride ? 1 : 0.15;
      headGroup.rotation.z = Math.sin(elapsed * 0.9) * 0.035 * motionAmp;
      trunkPivot.rotation.z = Math.sin(elapsed * 1.15) * 0.14 * motionAmp;
      trunkPivot.rotation.y = Math.cos(elapsed * 0.7) * 0.07 * motionAmp;

      // Ear fanning
      const earWave = Math.sin(elapsed * 1.35) * 0.18 * motionAmp;
      leftEarPivot.rotation.y = earWave;
      rightEarPivot.rotation.y = -earWave;

      // Tail gentle sway
      tailPivot.rotation.x = Math.sin(elapsed * 1.8) * 0.12 * motionAmp;

      // Subtle slow walk stride when stride is active
      legPivots.forEach((lp) => {
        const angle = st.stride ? Math.sin(elapsed * 1.6 + lp.phase) * 0.1 : 0;
        lp.pivot.rotation.z = THREE.MathUtils.damp(lp.pivot.rotation.z, angle, 6, delta);
      });

      // Exploded study separation (rings expand, head/torso subtly lift, plinth separates)
      elephantGroup.position.y = currentExplode * 0.52;
      headGroup.position.x = 1.18 + currentExplode * 0.35;
      tusksGroup.position.x = 0.42 + currentExplode * 0.25;
      lowerPlinth.position.y = -0.43 - currentExplode * 0.38;

      surveyRings.forEach((ring, idx) => {
        const baseY = ring.userData.baseY as number;
        ring.position.y = baseY + (idx - 1) * currentExplode * 0.55;
        ring.rotation.z = elapsed * (0.14 + idx * 0.06) * (idx % 2 === 0 ? 1 : -1);
        const s = 1 + currentExplode * (0.16 + idx * 0.06);
        ring.scale.setScalar(s);
      });

      // Update hotspots & subtle rotation
      hotspotMeshes.forEach((bm, idx) => {
        const base = bm.userData.basePos as THREE.Vector3;
        const isActive = bm.userData.hotspotId === st.activeHotspot;
        bm.position.set(
          base.x + currentExplode * 0.32,
          base.y + currentExplode * 0.42 + Math.sin(elapsed * 2 + idx) * 0.04,
          base.z
        );
        bm.rotation.y = elapsed * 1.2;
        const targetScale = isActive ? 1.35 : 0.88;
        bm.scale.setScalar(THREE.MathUtils.damp(bm.scale.x, targetScale, 8, delta));
        const mat = bm.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isActive ? 0.95 : 0.25;
      });

      // Animate floating savanna dust motes
      for (let i = 0; i < moteCount; i++) {
        const m = moteSeeds[i];
        const a = m.angle + elapsed * m.speed * 0.35;
        _dummy.position.set(
          Math.cos(a) * m.radius,
          m.y + Math.sin(elapsed * 0.9 + m.bob) * 0.22,
          Math.sin(a) * m.radius
        );
        _dummy.rotation.set(elapsed * 0.5, elapsed * 0.7, 0);
        _dummy.scale.setScalar(0.8 + Math.sin(elapsed + m.bob) * 0.25);
        _dummy.updateMatrix();
        motesInst.setMatrixAt(i, _dummy.matrix);
      }
      motesInst.instanceMatrix.needsUpdate = true;

      // Smooth damped camera preset transitions
      if (st.transitionActive) {
        const preset = CAMERA_PRESETS[st.cameraPreset];
        _targetPos.set(...preset.pos);
        _targetLook.set(...preset.target);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, 4.5, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLook.x, 4.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLook.y, 4.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLook.z, 4.5, delta);

        if (camera.position.distanceTo(_targetPos) < 0.04) {
          st.transitionActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      bodyGrainTex.dispose();
      stoneGrainTex.dispose();
      bumpTex.dispose();
      shadowTex.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  const currentHotspot =
    ANATOMY_HOTSPOTS.find((h) => h.id === activeHotspotId) || ANATOMY_HOTSPOTS[0];

  return (
    <section
      id="anatomy-3d"
      aria-label="Interactive 3D Elephant Sculptural Study"
      className="relative w-full bg-[#E6DCC8] border-t border-[#43282A]/16 py-20 md:py-24 px-5 md:px-10"
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Clean Editorial Section Header */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div>
            <p className="editorial-label text-[#A86438] mb-3">
              {lang === 'ar' ? 'دراسة نحتية تفاعلية ثلاثية الأبعاد' : 'CHAPTER 04 · 3D SCULPTURAL STUDY'}
            </p>
            <h2
              className="font-display text-[#43282A] m-0"
              style={{ fontSize: 'clamp(32px, 4vw, 60px)', lineHeight: 0.98 }}
            >
              {lang === 'ar' ? 'تشريح الفيل الأفريقي ثلاثي الأبعاد' : 'ANATOMY IN THREE DIMENSIONS'}
            </h2>
          </div>
          <p className="text-[13.5px] leading-[1.7] text-[#43282A]/72 max-w-[44ch] m-0">
            {lang === 'ar'
              ? 'اسحب لتدوير المجسم ثلاثي الأبعاد بحرية، استكشف نقاط التشريح المضيئة، وجرّب تفكيك الطبقات المعمارية وخامات البرونز والطين والعاج.'
              : 'Orbit freely around our sculpted Loxodonta africana bronze diorama. Click the floating rust markers to examine biological traits or slide the study rings apart.'}
          </p>
        </div>

        {/* Full-bleed Unobstructed 3D Viewport with Unified Collapsible Bottom Dock */}
        <div className="relative w-full h-[74vh] min-h-[540px] max-h-[780px] rounded-sm overflow-hidden border border-[#43282A]/16 bg-[#E6DCC8]">
          {/* Isolated WebGL Canvas Mount Container */}
          {webglError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <p className="font-display text-2xl text-[#43282A]">3D Sculptural Viewport</p>
              <p className="text-sm text-[#43282A]/70 mt-2 max-w-md">
                WebGL is currently unavailable in this browser context. Explore the anatomy highlights below.
              </p>
            </div>
          ) : (
            <div
              ref={mountRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              aria-label="Interactive 3D African bush elephant sculpture"
            />
          )}

          {/* Minimal Top-Left Spec Bar (solid warm paper RGBA — never backdrop-filter over WebGL) */}
          <div
            className="absolute top-4 left-4 right-4 sm:right-auto max-w-[360px] pointer-events-auto bg-[#ECE3D1]/92 border border-[#43282A]/16 px-4 py-3.5"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="editorial-label text-[#A86438]">
                {lang === 'ar' ? currentHotspot.titleAr : currentHotspot.title}
              </span>
              <span className="text-[11px] text-[#43282A]/60 tabular-nums whitespace-nowrap">
                {currentHotspot.metric}
              </span>
            </div>
            <p className="text-[12.5px] leading-[1.6] text-[#43282A]/78 mt-2 mb-3">
              {lang === 'ar' ? currentHotspot.descriptionAr : currentHotspot.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#43282A]/12">
              {ANATOMY_HOTSPOTS.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => {
                    setActiveHotspotId(spot.id);
                    setCameraPreset(spot.cameraPreset);
                  }}
                  className={`text-[10.5px] uppercase tracking-[0.14em] font-semibold pb-0.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeHotspotId === spot.id
                      ? 'text-[#A86438] border-b border-[#A86438]'
                      : 'text-[#43282A]/55 hover:text-[#43282A]'
                  }`}
                >
                  {lang === 'ar' ? spot.titleAr.split(' ')[0] : spot.id}
                </button>
              ))}
            </div>
          </div>

          {/* Unified Collapsible Bottom Control Dock (Zero Mid-Screen Occlusion) */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(920px,calc(100%-24px))] flex flex-col items-center pointer-events-none transition-transform duration-300"
            style={{
              transform: dockCollapsed
                ? 'translate(-50%, calc(100% - 34px))'
                : 'translate(-50%, 0)',
            }}
          >
            <button
              type="button"
              onClick={() => setDockCollapsed((c) => !c)}
              className="pointer-events-auto bg-[#ECE3D1]/95 border border-b-0 border-[#43282A]/18 px-4 py-1.5 editorial-label text-[#43282A] hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
            >
              {dockCollapsed
                ? lang === 'ar'
                  ? '▴ إظهار أدوات التحكم 3D'
                  : '▴ Show 3D Controls'
                : lang === 'ar'
                ? '▾ إخفاء الأدوات'
                : '▾ Hide Controls'}
            </button>

            <div className="pointer-events-auto w-full bg-[#ECE3D1]/96 border border-[#43282A]/18 px-4 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 shadow-[0_14px_32px_rgba(43,24,25,0.12)]">
              {/* Exploded Study Slider */}
              <label className="flex items-center gap-3 min-w-[175px]">
                <span className="editorial-label text-[#43282A]/75 whitespace-nowrap">
                  {lang === 'ar' ? 'تفكيك' : 'Explode'}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodeLevel}
                  onChange={(e) => setExplodeLevel(parseFloat(e.target.value))}
                  aria-label="Exploded sculptural view"
                  className="w-24 accent-[#A86438] cursor-pointer"
                />
              </label>

              {/* Material Finish Switcher */}
              <div className="flex items-center gap-1.5">
                {(['bronze', 'terracotta', 'ivory', 'blueprint'] as FinishMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFinish(m)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      finish === m
                        ? 'bg-[#43282A] text-[#ECE3D1]'
                        : 'text-[#43282A]/70 hover:text-[#43282A] hover:bg-[#43282A]/8'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Camera Presets */}
              <div className="flex items-center gap-1.5">
                {(['orbit', 'profile', 'tusks', 'aerial'] as CameraPreset[]).map((cam) => (
                  <button
                    key={cam}
                    type="button"
                    onClick={() => setCameraPreset(cam)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      cameraPreset === cam
                        ? 'bg-[#A86438] text-[#ECE3D1]'
                        : 'text-[#43282A]/70 hover:text-[#43282A] hover:bg-[#43282A]/8'
                    }`}
                  >
                    {cam}
                  </button>
                ))}
              </div>

              {/* Stride Toggle & Direct Book Sanctuary */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAnimateStride((s) => !s)}
                  className="px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-semibold border border-[#43282A]/22 text-[#43282A] hover:border-[#A86438] hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {animateStride
                    ? lang === 'ar'
                      ? 'إيقاف الحركة'
                      : 'Pause Motion'
                    : lang === 'ar'
                    ? 'تشغيل الحركة'
                    : 'Play Motion'}
                </button>
                <button
                  type="button"
                  onClick={onBookSanctuary}
                  className="px-3.5 py-1.5 bg-[#A86438] text-[#ECE3D1] text-[10px] uppercase tracking-[0.16em] font-semibold hover:bg-[#8E522B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {lang === 'ar' ? 'احجز محمية تانا' : 'Visit Sanctuary'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
