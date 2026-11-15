export type SoundEvent = 'paper' | 'telephone' | 'collect' | 'thread' | 'door' | 'save' | 'stamp';
export interface AudioLevels { music: number; ambience: number; effects: number }
export interface SoundProfile { cutoff: number; noise: number; hum: number; transpose: number }

export const soundProfiles: Record<string, SoundProfile> = {
  CONSTRUCTION: { cutoff: 1700, noise: .26, hum: .015, transpose: 0 },
  POLICE: { cutoff: 420, noise: .055, hum: .065, transpose: 0 },
  WHITMORE_OFFICE: { cutoff: 650, noise: .035, hum: .025, transpose: 5 },
  MANSION: { cutoff: 220, noise: .015, hum: .008, transpose: -2 },
  GAS_STATION: { cutoff: 900, noise: .12, hum: .045, transpose: 0 },
  SECRET_APARTMENT: { cutoff: 350, noise: .04, hum: .012, transpose: -2 },
  NORA_PRIVATE: { cutoff: 260, noise: .022, hum: .01, transpose: 5 },
  PROSECUTOR: { cutoff: 380, noise: .025, hum: .025, transpose: 0 }
};

export function clampVolume(value: number): number { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }
export function midiFrequency(note: number): number { return 440 * 2 ** ((note - 69) / 12); }

const chords = [[48, 55, 58, 63], [45, 52, 55, 60], [50, 57, 60, 65], [43, 53, 58, 62]];
export interface ScoreNote { midi: number; delay: number; duration: number; strength: number; voice: 'keys' | 'bass' }
export function scoreBeat(index: number, transpose = 0): ScoreNote[] {
  const beat = ((index % 16) + 16) % 16;
  const chord = chords[Math.floor(beat / 4)];
  const within = beat % 4;
  if (within === 0) return [
    { midi: chord[0] - 12 + transpose, delay: 0, duration: .64, strength: .21, voice: 'bass' },
    ...chord.slice(1).map((midi, i) => ({ midi: midi + transpose, delay: .08 + i * .035, duration: 1.55, strength: .055, voice: 'keys' as const }))
  ];
  if (within === 2) return [{ midi: chord[1] - 12 + transpose, delay: 0, duration: .54, strength: .14, voice: 'bass' }];
  if (within === 3) return [{ midi: chord[2] + 12 + transpose, delay: .13, duration: .7, strength: .035, voice: 'keys' }];
  return [];
}

export function actionSound(actionId: string): SoundEvent {
  if (/COLLECT_/.test(actionId)) return 'collect';
  if (['A_BRENNAN_1', 'A_HAYES_FIRST', 'A_HAYES_SECOND', 'A_IRENE_CALL', 'A_NORA_SERIOUS'].includes(actionId)) return 'telephone';
  if (['A_WORK_OFFICE', 'A_HOME_STUDY', 'A_ELIZABETH_PRIVATE'].includes(actionId)) return 'door';
  return 'paper';
}
