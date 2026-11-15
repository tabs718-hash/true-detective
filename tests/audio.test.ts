import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Atmosphere } from '../src/ui/Audio';
import { clampVolume, scoreBeat, soundProfiles } from '../src/ui/sound-design';

class Parameter {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  setTargetAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
}
class AudioNodeStub {
  gain = new Parameter(); frequency = new Parameter(); type = ''; loop = false;
  buffer: unknown = null; onended: (() => void) | null = null;
  connected = false; disconnected = false;
  connect() { this.connected = true; }
  disconnect() { this.disconnected = true; }
  start() {}
  stop() {}
}
class AudioContextStub {
  currentTime = 0; sampleRate = 100; state = 'suspended'; destination = new AudioNodeStub();
  gains: AudioNodeStub[] = []; oscillators: AudioNodeStub[] = []; sources: AudioNodeStub[] = []; filters: AudioNodeStub[] = [];
  createGain() { const node = new AudioNodeStub(); this.gains.push(node); return node; }
  createOscillator() { const node = new AudioNodeStub(); this.oscillators.push(node); return node; }
  createBufferSource() { const node = new AudioNodeStub(); this.sources.push(node); return node; }
  createBiquadFilter() { const node = new AudioNodeStub(); this.filters.push(node); return node; }
  createBuffer(_channels: number, length: number) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
}
const levels = { music: .5, ambience: .35, effects: .7 };
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Звуковые ресурсы и управление', () => {
  test('до включения звука нет контекста или таймеров', () => {
    const factory = vi.fn(() => new AudioContextStub() as unknown as AudioContext);
    const sound = new Atmosphere(factory);
    sound.setLocation('POLICE'); sound.effect('telephone'); sound.setLevels(levels);
    expect(factory).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('повторное включение не создаёт второй контекст или музыкальный планировщик', async () => {
    const context = new AudioContextStub();
    const factory = vi.fn(() => context as unknown as AudioContext);
    const sound = new Atmosphere(factory);
    await sound.start(levels); await sound.start(levels);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(context.sources.filter(n => n.loop)).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
    await sound.stop(); expect(vi.getTimerCount()).toBe(0);
  });

  test('пауза останавливает планировщик и запрещает новые эффекты', async () => {
    const context = new AudioContextStub(); const sound = new Atmosphere(() => context as unknown as AudioContext);
    await sound.start(levels); await sound.stop();
    const before = context.sources.length + context.oscillators.length;
    sound.effect('collect'); vi.advanceTimersByTime(10000);
    expect(context.sources.length + context.oscillators.length).toBe(before);
    expect(context.state).toBe('suspended');
    expect(vi.getTimerCount()).toBe(0);
  });

  test('нули громкости выключают соответствующие звуковые каналы', async () => {
    const context = new AudioContextStub(); const sound = new Atmosphere(() => context as unknown as AudioContext);
    await sound.start({ music: 0, ambience: 0, effects: 0 });
    expect(context.gains.slice(0, 3).map(n => n.gain.value)).toEqual([0, 0, 0]);
    const before = context.oscillators.length + context.sources.length;
    sound.effect('telephone');
    expect(context.oscillators.length + context.sources.length).toBe(before);
    await sound.stop();
  });

  test('смена локации меняет окружение, не пересоздавая постоянные источники', async () => {
    const context = new AudioContextStub(); const sound = new Atmosphere(() => context as unknown as AudioContext);
    await sound.start(levels); const sources = context.sources.length;
    sound.setLocation('MANSION');
    expect(context.filters[0].frequency.value).toBe(soundProfiles.MANSION.cutoff);
    sound.setLocation('CONSTRUCTION');
    expect(context.filters[0].frequency.value).toBe(soundProfiles.CONSTRUCTION.cutoff);
    expect(context.sources).toHaveLength(sources);
    await sound.stop();
  });

  test('позднее завершение resume не включает звук после команды паузы', async () => {
    const context = new AudioContextStub(); let resume!: () => void;
    context.resume = () => new Promise<void>(resolve => { resume = () => { context.state = 'running'; resolve(); }; });
    const sound = new Atmosphere(() => context as unknown as AudioContext);
    const pending = sound.start(levels);
    await sound.stop(); resume(); await pending;
    expect(context.state).toBe('suspended');
    expect(vi.getTimerCount()).toBe(0);
  });

  test('закончившиеся эффекты отключают свои узлы', async () => {
    const context = new AudioContextStub(); const sound = new Atmosphere(() => context as unknown as AudioContext);
    await sound.start(levels); sound.effect('paper'); sound.effect('telephone');
    const shots = [...context.sources, ...context.oscillators].filter(node => node.onended);
    shots.forEach(node => node.onended?.());
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every(node => node.disconnected)).toBe(true);
    expect(context.sources.filter(node => node.loop).every(node => !node.disconnected)).toBe(true);
    await sound.stop();
  });

  test('партитура зациклена, а уровни не допускают бесконечных значений', () => {
    for (let i = 0; i < 16; i++) expect(scoreBeat(i)).toEqual(scoreBeat(i + 16));
    for (const value of [NaN, Infinity, -Infinity]) expect(clampVolume(value)).toBe(0);
    expect(clampVolume(-4)).toBe(0); expect(clampVolume(4)).toBe(1);
  });
});
