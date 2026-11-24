// Procedural Web Audio API Savanna Field Recording Synthesizer
// Zero external audio files — generates warm acacia wind, distant infrasonic elephant rumble, and soft savanna ambience.

export class SavannaSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private nodes: AudioNode[] = [];
  private timers: number[] = [];
  private analyser: AnalyserNode | null = null;

  public start(): AnalyserNode | null {
    if (this.isPlaying) return this.analyser;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    this.ctx = new AudioCtx();
    const ctx = this.ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 1.8);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 128;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // 1. Warm Savanna Wind (filtered pink-ish noise with slow LFO)
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(340, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.4, ctx.currentTime);

    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.frequency.setValueAtTime(0.11, ctx.currentTime);
    windLfoGain.gain.setValueAtTime(150, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.65, ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);

    windSource.start();
    windLfo.start();
    this.nodes.push(windSource, windFilter, windLfo, windLfoGain, windGain);

    // 2. Deep Loxodonta Infrasonic Warm Drone (42Hz + 63Hz harmonic bed)
    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = 'sine';
    rumbleOsc.frequency.setValueAtTime(48, ctx.currentTime);

    const rumbleLfo = ctx.createOscillator();
    const rumbleLfoGain = ctx.createGain();
    rumbleLfo.frequency.setValueAtTime(0.18, ctx.currentTime);
    rumbleLfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.14, ctx.currentTime);

    rumbleLfo.connect(rumbleLfoGain);
    rumbleLfoGain.connect(rumbleGain.gain);
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);

    rumbleOsc.start();
    rumbleLfo.start();
    this.nodes.push(rumbleOsc, rumbleLfo, rumbleLfoGain, rumbleGain);

    // 3. Occasional distant savanna bird harmonic call
    const scheduleBird = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 1650 + Math.random() * 500;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.36);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.045, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.45);

      const nextMs = 3500 + Math.random() * 5500;
      const t = window.setTimeout(scheduleBird, nextMs);
      this.timers.push(t);
    };

    const initialBirdTimer = window.setTimeout(scheduleBird, 1400);
    this.timers.push(initialBirdTimer);

    this.isPlaying = true;
    return this.analyser;
  }

  public stop(): void {
    this.isPlaying = false;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      } catch {
        // Ignore if context already closing
      }
      const oldCtx = this.ctx;
      window.setTimeout(() => {
        oldCtx.close().catch(() => {});
      }, 400);
    }
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.nodes = [];
  }
}
