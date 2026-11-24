import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WORLD_ZOOS, ZooSanctuary } from '../data/zoosData';

interface WorldZoosGlobe3DProps {
  lang: 'en' | 'ar';
  selectedZooId: string;
  onSelectZoo: (zooId: string) => void;
  onBookZoo: (zoo: ZooSanctuary) => void;
}

const GLOBE_RADIUS = 2.35;
const _camGoal = new THREE.Vector3();
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

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

// High-resolution procedural archival cartography canvas texture (zero external image files)
function createArchivalWorldTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Warm archival ocean parchment gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#DFD3BC');
  oceanGrad.addColorStop(0.5, '#EAE0CC');
  oceanGrad.addColorStop(1, '#DFD3BC');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Graticule latitude / longitude hairlines
  ctx.strokeStyle = 'rgba(67, 40, 42, 0.14)';
  ctx.lineWidth = 1;
  for (let lng = -180; lng <= 180; lng += 15) {
    const x = ((lng + 180) / 360) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Equator & Tropics subtle rust lines
  ctx.strokeStyle = 'rgba(168, 100, 56, 0.35)';
  ctx.setLineDash([8, 6]);
  [0, 23.5, -23.5].forEach((lat) => {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Helper to project [lng, lat] polygons cleanly
  const drawLand = (coords: [number, number][]) => {
    ctx.beginPath();
    coords.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = '#5E3D3F';
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#A86438';
    ctx.stroke();
  };

  // Stylized cartographic continents (accurate macro-silhouettes)
  // North America
  drawLand([
    [-168, 66], [-142, 70], [-95, 70], [-65, 62], [-56, 48], [-74, 40],
    [-81, 25], [-90, 21], [-83, 10], [-78, 8], [-93, 15], [-106, 20],
    [-117, 32], [-124, 42], [-134, 57], [-152, 60],
  ]);
  // Greenland
  drawLand([
    [-52, 60], [-42, 60], [-20, 74], [-28, 82], [-58, 78], [-55, 68],
  ]);
  // South America
  drawLand([
    [-78, 9], [-62, 10], [-50, 0], [-35, -8], [-40, -22], [-54, -34],
    [-66, -54], [-74, -52], [-72, -32], [-80, -5],
  ]);
  // Europe
  drawLand([
    [-10, 37], [3, 43], [14, 41], [24, 38], [32, 46], [42, 54],
    [30, 68], [16, 70], [6, 61], [8, 54], [-2, 49], [-9, 43],
  ]);
  // UK & Ireland
  drawLand([[-6, 50], [2, 51], [-1, 58], [-6, 57]]);
  // Africa
  drawLand([
    [-17, 15], [-12, 28], [-6, 36], [10, 37], [32, 31], [43, 12],
    [51, 11], [41, -3], [35, -24], [20, -35], [14, -22], [9, -2],
    [2, 5], [-10, 5],
  ]);
  // Madagascar
  drawLand([[44, -25], [49, -13], [50, -17], [46, -25]]);
  // Asia
  drawLand([
    [34, 36], [42, 42], [58, 52], [68, 70], [108, 74], [145, 70],
    [172, 64], [142, 52], [130, 42], [122, 31], [116, 22], [105, 10],
    [100, 14], [96, 18], [88, 22], [78, 8], [72, 20], [60, 25],
    [50, 29], [44, 14], [36, 28],
  ]);
  // Malay Peninsula & Sumatra / Indonesia
  drawLand([[100, 10], [104, 1], [102, 1], [99, 6]]);
  drawLand([[95, 5], [106, -6], [116, -8], [112, -6], [98, 2]]);
  drawLand([[110, 1], [118, 5], [117, -3], [111, -3]]);
  // Japan
  drawLand([[131, 32], [141, 36], [145, 44], [140, 41], [135, 35]]);
  // Australia
  drawLand([
    [114, -22], [130, -12], [142, -11], [153, -27], [150, -37],
    [138, -35], [128, -32], [115, -34],
  ]);
  // New Zealand
  drawLand([[167, -46], [174, -36], [178, -38], [170, -46]]);

  // Subtle paper texture dots
  ctx.fillStyle = 'rgba(67, 40, 42, 0.045)';
  for (let i = 0; i < 3500; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const WorldZoosGlobe3D: React.FC<WorldZoosGlobe3DProps> = ({
  lang,
  selectedZooId,
  onSelectZoo,
  onBookZoo,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [autoSpin, setAutoSpin] = useState(true);
  const [hoveredZooName, setHoveredZooName] = useState<string | null>(null);
  const [webglError, setWebglError] = useState(false);

  const selectedZoo =
    WORLD_ZOOS.find((z) => z.id === selectedZooId) || WORLD_ZOOS[5];

  const stateRef = useRef({
    selectedZooId,
    autoSpin: true,
    flyToActive: false,
    targetLat: selectedZoo.lat,
    targetLng: selectedZoo.lng,
  });

  useEffect(() => {
    const z = WORLD_ZOOS.find((item) => item.id === selectedZooId) || WORLD_ZOOS[0];
    stateRef.current.selectedZooId = z.id;
    stateRef.current.targetLat = z.lat;
    stateRef.current.targetLng = z.lng;
    stateRef.current.flyToActive = true;
  }, [selectedZooId]);

  useEffect(() => {
    stateRef.current.autoSpin = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xece3d1);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      60
    );
    const initialDir = latLngToVec3(selectedZoo.lat, selectedZoo.lng, 6.2);
    camera.position.copy(initialDir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 8.8;
    controls.addEventListener('start', () => {
      stateRef.current.flyToActive = false;
      setAutoSpin(false);
    });

    // Warm/cool studio lighting
    scene.add(new THREE.HemisphereLight(0xfff7e6, 0x6f4a3c, 1.15));
    const dirLight = new THREE.DirectionalLight(0xfff0d1, 1.85);
    dirLight.position.set(6, 5, 7);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xa86438, 0.9);
    rimLight.position.set(-7, -3, -5);
    scene.add(rimLight);

    // Master Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Archival Cartographic Sphere
    const worldTex = createArchivalWorldTexture();
    worldTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const globeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48),
      new THREE.MeshPhysicalMaterial({
        map: worldTex,
        roughness: 0.68,
        metalness: 0.06,
        clearcoat: 0.14,
        clearcoatRoughness: 0.5,
      })
    );
    globeGroup.add(globeMesh);

    // 2. Subtle Orbital Brass Meridian Ring (Museum Armillary Accent)
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xa86438,
      metalness: 0.82,
      roughness: 0.28,
    });

    const outerMeridian = new THREE.Mesh(
      new THREE.TorusGeometry(GLOBE_RADIUS + 0.34, 0.015, 12, 120),
      brassMat
    );
    outerMeridian.rotation.x = Math.PI * 0.42;
    outerMeridian.rotation.y = 0.32;
    scene.add(outerMeridian);

    const innerEquatorial = new THREE.Mesh(
      new THREE.TorusGeometry(GLOBE_RADIUS + 0.19, 0.008, 8, 120),
      new THREE.MeshBasicMaterial({
        color: 0x43282a,
        transparent: true,
        opacity: 0.22,
      })
    );
    innerEquatorial.rotation.x = Math.PI / 2;
    globeGroup.add(innerEquatorial);

    // 3. Curved 3D Conservation Corridor Arcs connecting Tana Sanctuary Kenya to all World Zoos
    const tanaZoo = WORLD_ZOOS.find((z) => z.id === 'tana-sanctuary')!;
    const tanaVec = latLngToVec3(tanaZoo.lat, tanaZoo.lng, GLOBE_RADIUS + 0.02);

    const arcTravelers: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; offset: number }[] = [];

    WORLD_ZOOS.filter((z) => z.id !== 'tana-sanctuary').forEach((zoo, idx) => {
      const destVec = latLngToVec3(zoo.lat, zoo.lng, GLOBE_RADIUS + 0.02);
      const mid = _vA
        .copy(tanaVec)
        .add(destVec)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(GLOBE_RADIUS + 0.72 + (idx % 2) * 0.22);

      const curve = new THREE.QuadraticBezierCurve3(tanaVec.clone(), mid.clone(), destVec.clone());
      const arcGeo = new THREE.TubeGeometry(curve, 44, 0.011, 8, false);
      const arcMesh = new THREE.Mesh(
        arcGeo,
        new THREE.MeshStandardMaterial({
          color: 0xa86438,
          roughness: 0.35,
          metalness: 0.6,
          transparent: true,
          opacity: 0.62,
        })
      );
      globeGroup.add(arcMesh);

      // Animated traveling brass node along conservation arc
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xf7ecd6,
          emissive: 0xa86438,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        })
      );
      globeGroup.add(bead);
      arcTravelers.push({ mesh: bead, curve, offset: idx * 0.19 });
    });

    // 4. Interactive 3D Sanctuary Beacon Pins (Composite 3-part Group per zoo)
    const pinHitTargets: THREE.Mesh[] = [];
    const pinVisuals: Map<string, { crown: THREE.Mesh; halo: THREE.Mesh }> = new Map();

    WORLD_ZOOS.forEach((zoo) => {
      const surfacePos = latLngToVec3(zoo.lat, zoo.lng, GLOBE_RADIUS);
      const normal = surfacePos.clone().normalize();

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(surfacePos);
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Base ring flush on globe
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.085, 0.012, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xa86438, transparent: true, opacity: 0.75 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.012;
      pinGroup.add(halo);

      // Brass stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.022, 0.22, 10),
        brassMat
      );
      stem.position.y = 0.11;
      pinGroup.add(stem);

      // Crown diamond beacon
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xa86438,
        emissive: 0x6b2f12,
        emissiveIntensity: 0.4,
        roughness: 0.22,
        metalness: 0.65,
      });
      const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.078, 1), crownMat);
      crown.position.y = 0.24;
      pinGroup.add(crown);

      // Invisible generous hit proxy on Layer 1 for effortless click & hover
      const hitProxy = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitProxy.position.y = 0.18;
      hitProxy.userData.zooId = zoo.id;
      hitProxy.userData.zooName = zoo.name;
      hitProxy.layers.enable(1);
      pinGroup.add(hitProxy);

      pinHitTargets.push(hitProxy);
      pinVisuals.set(zoo.id, { crown, halo });
      globeGroup.add(pinGroup);
    });

    // Raycasting for Click & Throttled Hover
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let lastMove = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastMove < 50) return;
      lastMove = now;
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pinHitTargets, false);
      if (hits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        setHoveredZooName(hits[0].object.userData.zooName as string);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredZooName(null);
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pinHitTargets, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.zooId as string;
        onSelectZoo(hitId);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

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

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

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

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // Subtle armillary ring drift
      outerMeridian.rotation.z = elapsed * 0.05;

      // Move conservation arc travelers
      arcTravelers.forEach((tr) => {
        const t = (elapsed * 0.22 + tr.offset) % 1;
        tr.curve.getPoint(t, _vB);
        tr.mesh.position.copy(_vB);
      });

      // Highlight selected zoo pin
      pinVisuals.forEach(({ crown, halo }, id) => {
        const active = id === st.selectedZooId;
        const targetSc = active ? 1.55 : 0.92;
        crown.scale.setScalar(THREE.MathUtils.damp(crown.scale.x, targetSc, 8, delta));
        crown.rotation.y = elapsed * (active ? 1.8 : 0.8);
        const haloSc = active ? 1.35 + Math.sin(elapsed * 3) * 0.16 : 1;
        halo.scale.setScalar(haloSc);
        const mat = crown.material as THREE.MeshStandardMaterial;
        mat.color.setHex(active ? 0x43282a : 0xa86438);
        mat.emissiveIntensity = active ? 0.85 : 0.35;
      });

      // Camera smooth fly-to selected sanctuary or gentle orbit
      if (st.flyToActive) {
        const dist = camera.position.length();
        const goal = latLngToVec3(st.targetLat, st.targetLng, Math.min(Math.max(dist, 5.4), 6.2));
        _camGoal.copy(goal);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 3.8, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 3.8, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 3.8, delta);
        camera.position.setLength(
          THREE.MathUtils.damp(camera.position.length(), 5.8, 3.8, delta)
        );
        if (camera.position.distanceTo(_camGoal) < 0.08) {
          st.flyToActive = false;
        }
      } else if (st.autoSpin && !isSoftwareGl) {
        const angle = delta * 0.12;
        const x = camera.position.x;
        const z = camera.position.z;
        camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
        camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
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
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      worldTex.dispose();
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

  return (
    <section
      id="world-map"
      aria-label="Interactive 3D World Zoos & Sanctuaries Atlas"
      className="relative w-full bg-[#ECE3D1] border-t border-[#43282A]/16 py-20 md:py-24 px-5 md:px-10"
    >
      <div className="max-w-[1280px] mx-auto">
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div>
            <p className="editorial-label text-[#A86438] mb-3">
              {lang === 'ar' ? 'أطلس العالم ثلاثي الأبعاد' : 'CHAPTER 05 · 3D GLOBAL SANCTUARY ATLAS'}
            </p>
            <h2
              className="font-display text-[#43282A] m-0"
              style={{ fontSize: 'clamp(32px, 4vw, 60px)', lineHeight: 0.98 }}
            >
              {lang === 'ar' ? 'أشهر حدائق الحيوان والمحميات العالمية' : 'WORLD ZOOS & SANCTUARIES'}
            </h2>
          </div>
          <p className="text-[13.5px] leading-[1.7] text-[#43282A]/72 max-w-[44ch] m-0">
            {lang === 'ar'
              ? 'تصفّح الكرة الأرضية ثلاثية الأبعاد واضغط على أي علامة للانتقال فوراً إلى الحديقة ومعاينة برنامج الأفيال وحجز تذكرتك.'
              : 'Rotate the archival 3D globe or pick a sanctuary below to glide across global conservation corridors and book curated admission passes.'}
          </p>
        </div>

        {/* Clean 2-column stretch balance: 3D Globe Left (7fr), Selected Sanctuary Editorial Folio Right (5fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 3D Globe Viewport */}
          <div className="lg:col-span-7 relative min-h-[460px] lg:min-h-[580px] border border-[#43282A]/16 bg-[#ECE3D1] overflow-hidden">
            {webglError ? (
              <div className="w-full h-full flex items-center justify-center p-8 text-center">
                <p className="text-sm text-[#43282A]/70">
                  Interactive 3D Globe requires WebGL. Choose any sanctuary from the buttons below.
                </p>
              </div>
            ) : (
              <div ref={mountRef} className="w-full h-full" />
            )}

            {/* Hover label top-left */}
            {hoveredZooName && (
              <div className="absolute top-4 left-4 bg-[#43282A] text-[#ECE3D1] px-3 py-1.5 editorial-label pointer-events-none">
                {hoveredZooName}
              </div>
            )}

            {/* Compact bottom sanctuary switcher inside globe viewport */}
            <div className="absolute bottom-3 left-3 right-3 bg-[#ECE3D1]/95 border border-[#43282A]/16 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {WORLD_ZOOS.map((zoo) => (
                  <button
                    key={zoo.id}
                    type="button"
                    onClick={() => onSelectZoo(zoo.id)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedZoo.id === zoo.id
                        ? 'bg-[#43282A] text-[#ECE3D1]'
                        : 'text-[#43282A]/75 hover:bg-[#43282A]/10'
                    }`}
                  >
                    {lang === 'ar' ? zoo.cityAr.split('،')[0] : zoo.city.split(',')[0]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAutoSpin((s) => !s)}
                className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#A86438] hover:text-[#43282A] px-2 py-1 cursor-pointer whitespace-nowrap"
              >
                {autoSpin
                  ? lang === 'ar'
                    ? 'إيقاف الدوران'
                    : 'Pause Spin'
                  : lang === 'ar'
                  ? 'تدوير تلقائي'
                  : 'Auto Spin'}
              </button>
            </div>
          </div>

          {/* Right Archival Folio for Selected World Zoo */}
          <div
            className="lg:col-span-5 flex flex-col justify-between border border-[#43282A]/16 bg-[#E6DCC8]/55 p-6 md:p-8"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#DDD1BA] mb-6">
                <img
                  src={selectedZoo.image}
                  alt={`${selectedZoo.name} in ${selectedZoo.city}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#A86438]">
                <span>{lang === 'ar' ? selectedZoo.continentAr : selectedZoo.continent}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{selectedZoo.coordinatesLabel}</span>
              </div>

              <h3
                className="font-display text-[#43282A] mt-2 mb-3"
                style={{ fontSize: 'clamp(26px, 2.6vw, 38px)', lineHeight: 1.04 }}
              >
                {lang === 'ar' ? selectedZoo.nameAr : selectedZoo.name}
              </h3>

              <p className="text-[13.5px] leading-[1.7] text-[#43282A]/75 mb-6">
                {lang === 'ar' ? selectedZoo.summaryAr : selectedZoo.summary}
              </p>

              {/* Hairline Archival Spec List */}
              <div className="border-t border-[#43282A]/16 text-[13px]">
                <div className="flex justify-between py-2.5 border-b border-[#43282A]/14">
                  <span className="text-[#43282A]/68">
                    {lang === 'ar' ? 'تاريخ التأسيس' : 'Established'}
                  </span>
                  <span className="text-[#43282A] font-medium tabular-nums">
                    {selectedZoo.founded}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-[#43282A]/14">
                  <span className="text-[#43282A]/68">
                    {lang === 'ar' ? 'تنوع الأنواع' : 'Collection'}
                  </span>
                  <span className="text-[#43282A] font-medium tabular-nums">
                    {selectedZoo.speciesCount} · {selectedZoo.acreage}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-[#43282A]/14">
                  <span className="text-[#43282A]/68">
                    {lang === 'ar' ? 'ساعات الزيارة' : 'Daily Hours'}
                  </span>
                  <span className="text-[#43282A] font-medium tabular-nums">
                    {selectedZoo.hours}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-[#43282A]/14">
                  <span className="text-[#43282A]/68">
                    {lang === 'ar' ? 'سعر التذكرة' : 'Explorer Pass'}
                  </span>
                  <span className="text-[#A86438] font-semibold tabular-nums">
                    From ${selectedZoo.basePriceUsd} USD
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[12.5px] leading-[1.6] text-[#43282A]/72">
                <strong className="text-[#43282A] font-semibold">
                  {lang === 'ar' ? 'برنامج الأفيال: ' : 'Elephant Program: '}
                </strong>
                {lang === 'ar' ? selectedZoo.elephantProgramAr : selectedZoo.elephantProgram}
              </p>
            </div>

            <div className="mt-7 pt-5 border-t border-[#43282A]/16 flex items-center justify-between gap-4">
              <div className="text-[12px] text-[#43282A]/68">
                {lang === 'ar' ? selectedZoo.cityAr : selectedZoo.city}
              </div>
              <button
                type="button"
                onClick={() => onBookZoo(selectedZoo)}
                className="px-6 py-3 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                {lang === 'ar' ? 'احجز التذكرة الآن' : 'RESERVE ENTRY PASS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
