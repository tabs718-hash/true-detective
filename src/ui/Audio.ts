import { clampVolume, midiFrequency, scoreBeat, soundProfiles, type AudioLevels, type SoundEvent } from './sound-design';

// Audio time schedules sound only. It never advances investigation state.
export class Atmosphere {
  private context: AudioContext | null = null;
  private music: GainNode | null = null;
  private ambience: GainNode | null = null;
  private effects: GainNode | null = null;
  private noiseLevel: GainNode | null = null;
  private humLevel: GainNode | null = null;
  private roomFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private enabled = false;
  private generation = 0;
  private location = 'CONSTRUCTION';
  private beat = 0;
  private nextBeat = 0;
  private levels: AudioLevels = { music: .5, ambience: .35, effects: .7 };

  constructor(private createContext: () => AudioContext = () => new AudioContext()) {}

  private initialize() {
    if (this.context) return;
    const context = this.createContext();
    this.context = context;
    this.music = context.createGain();
    this.ambience = context.createGain();
    this.effects = context.createGain();
    for (const bus of [this.music, this.ambience, this.effects]) bus.connect(context.destination);

    const noise = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = noise.getChannelData(0);
    let seed = 718, previous = 0;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const white = (seed >>> 0) / 2147483648 - 1;
      previous = previous * .9 + white * .1;
      data[i] = previous;
    }
    this.noiseBuffer = noise;
    const source = context.createBufferSource();
    source.buffer = noise; source.loop = true;
    this.roomFilter = context.createBiquadFilter();
    this.roomFilter.type = 'lowpass';
    this.noiseLevel = context.createGain();
    source.connect(this.roomFilter); this.roomFilter.connect(this.noiseLevel); this.noiseLevel.connect(this.ambience);
    source.start();

    const hum = context.createOscillator(); hum.type = 'sine'; hum.frequency.value = 58;
    this.humLevel = context.createGain(); hum.connect(this.humLevel); this.humLevel.connect(this.ambience); hum.start();
    this.setLocation(this.location);
    this.setLevels(this.levels);
  }

  async start(levels: AudioLevels) {
    this.initialize();
    this.setLevels(levels);
    this.enabled = true;
    const generation = ++this.generation;
    const context = this.context!;
    try { await context.resume(); } catch (error) { this.enabled = false; throw error; }
    if (generation !== this.generation || !this.enabled) {
      if (!this.enabled && context.state === 'running') await context.suspend();
      return;
    }
    if (this.timer) return;
    this.nextBeat = context.currentTime + .06;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 150);
  }

  setLevels(levels: AudioLevels) {
    this.levels = { music: clampVolume(levels.music), ambience: clampVolume(levels.ambience), effects: clampVolume(levels.effects) };
    if (!this.context) return;
    const time = this.context.currentTime;
    this.music?.gain.setTargetAtTime(this.levels.music * .24, time, .08);
    this.ambience?.gain.setTargetAtTime(this.levels.ambience * .18, time, .08);
    this.effects?.gain.setTargetAtTime(this.levels.effects * .22, time, .03);
  }

  setLocation(location: string) {
    this.location = location;
    if (!this.context) return;
    const profile = soundProfiles[location] ?? soundProfiles.CONSTRUCTION;
    const now = this.context.currentTime;
    this.roomFilter?.frequency.setTargetAtTime(profile.cutoff, now, .35);
    this.noiseLevel?.gain.setTargetAtTime(profile.noise, now, .35);
    this.humLevel?.gain.setTargetAtTime(profile.hum, now, .35);
  }

  private schedule() {
    const context = this.context;
    if (!this.enabled || !context || !this.music) return;
    if (this.nextBeat < context.currentTime) this.nextBeat = context.currentTime + .04;
    while (this.nextBeat < context.currentTime + .3) {
      const transpose = (soundProfiles[this.location] ?? soundProfiles.CONSTRUCTION).transpose;
      if (this.levels.music > 0) for (const note of scoreBeat(this.beat, transpose)) {
        this.tone(midiFrequency(note.midi), this.nextBeat + note.delay, note.duration, note.strength, this.music, note.voice === 'bass' ? 'sine' : 'triangle');
      }
      this.beat++; this.nextBeat += 60 / 72;
    }
  }

  private tone(frequency: number, time: number, duration: number, strength: number, bus: AudioNode, shape: OscillatorType = 'sine') {
    const context = this.context!;
    const oscillator = context.createOscillator(); oscillator.type = shape; oscillator.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.linearRampToValueAtTime(strength, time + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain); gain.connect(bus);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(time); oscillator.stop(time + duration + .01);
  }

  private rustle(time: number, duration: number, frequency: number, strength: number) {
    const context = this.context!;
    const source = context.createBufferSource(); source.buffer = this.noiseBuffer;
    const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = frequency;
    const gain = context.createGain(); gain.gain.setValueAtTime(strength, time); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.effects!);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(time); source.stop(time + duration);
  }

  effect(event: SoundEvent) {
    if (!this.enabled || !this.context || !this.effects || this.levels.effects === 0) return;
    const time = this.context.currentTime + .005;
    if (event === 'paper') this.rustle(time, .24, 2200, .7);
    if (event === 'collect') { this.rustle(time, .16, 1400, .5); this.tone(170, time, .12, .25, this.effects); }
    if (event === 'thread') this.tone(166, time, .27, .3, this.effects, 'triangle');
    if (event === 'door') { this.rustle(time, .3, 180, .5); this.tone(83, time + .06, .28, .14, this.effects); }
    if (event === 'stamp' || event === 'save') { this.rustle(time, .09, 800, .7); this.tone(112, time, .11, .3, this.effects); }
    if (event === 'telephone') for (const offset of [0, .17]) for (const frequency of [840, 1260]) this.tone(frequency, time + offset, .14, .11, this.effects, 'sine');
  }

  async stop() {
    this.enabled = false;
    this.generation++;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.context?.state === 'running') await this.context.suspend();
  }
}
