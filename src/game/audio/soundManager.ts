// Web Audio API Sound Generator for 100% zero-404 authentic stadium acoustics
class StadiumAudio {
  private ctx: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private isMuted: boolean = false;
  private crowdNoiseNode: AudioBufferSourceNode | null = null;

  constructor() {
    // AudioContext lazily initialized on user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.startCrowdAmbience();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.setValueAtTime(muted ? 0 : 0.18, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private startCrowdAmbience() {
    if (!this.ctx || this.crowdGain) return;
    try {
      // Generate 4 seconds of looping pink noise for crowd rumble
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
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

      this.crowdNoiseNode = this.ctx.createBufferSource();
      this.crowdNoiseNode.buffer = buffer;
      this.crowdNoiseNode.loop = true;

      this.crowdFilter = this.ctx.createBiquadFilter();
      this.crowdFilter.type = 'lowpass';
      this.crowdFilter.frequency.setValueAtTime(500, this.ctx.currentTime);

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.setValueAtTime(this.isMuted ? 0 : 0.18, this.ctx.currentTime);

      this.crowdNoiseNode.connect(this.crowdFilter);
      this.crowdFilter.connect(this.crowdGain);
      this.crowdGain.connect(this.ctx.destination);
      this.crowdNoiseNode.start();
    } catch {
      // Audio not permitted yet
    }
  }

  public updateCrowdExcitement(level: number) { // 0.0 to 1.0 (approaching goal or high tension)
    if (!this.ctx || !this.crowdFilter || !this.crowdGain || this.isMuted) return;
    const clamped = Math.max(0, Math.min(1, level));
    const targetFreq = 400 + clamped * 1200;
    const targetGain = 0.15 + clamped * 0.25;
    this.crowdFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
    this.crowdGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
  }

  public playKick(power: number = 0.5) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const startFreq = 160 + power * 100;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    gain.gain.setValueAtTime(0.4 + power * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playWhistle(long: boolean = false) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const duration = long ? 0.7 : 0.28;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(2600, t);
    osc2.frequency.setValueAtTime(2850, t);

    // Vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(25, t);
    lfoGain.gain.setValueAtTime(40, t);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);
    lfo.start(t);
    lfo.stop(t + duration);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
    gain.gain.setValueAtTime(0.35, t + duration - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  public playGoalHorn() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Crowd massive roar
    if (this.crowdFilter && this.crowdGain) {
      this.crowdFilter.frequency.setValueAtTime(2200, t);
      this.crowdGain.gain.setValueAtTime(0.45, t);
      this.crowdGain.gain.exponentialRampToValueAtTime(0.2, t + 3.5);
    }

    // Horn chord (stadium celebration fanfare)
    const freqs = [220, 277.18, 329.63, 440];
    freqs.forEach(f => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.7);
    });
  }

  public playPostHit() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.35);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playTackle() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }
}

export const soundManager = new StadiumAudio();
