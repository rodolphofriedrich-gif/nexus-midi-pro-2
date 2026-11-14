import type { AudioContextDiagnostics } from './latencyDiagnostics';

/**
 * synthTypes — contratos entre SynthService e o backend de áudio (SpessaSynth).
 *
 * 🔗 Relacionamentos:
 * - Implementado por: `synthService.ts` (via `BackendFactory`/`SynthBackend`).
 * - Consumido por: `stores.ts` (`SynthSettings`, `ChannelSettings`, `GlobalSettings`,
 *   `CHANNEL_SETTING_KEYS`, `DEFAULT_*`).
 *
 * 📝 Notas:
 * - `ChannelSettings` agora é uma **interface** (não mais um `Pick` de `SynthSettings`),
 *   porque absorveu campos do mixer (`expression`, `pan`, `program`, `pitchBend`,
 *   `pressure`) que não existem como config global.
 * - `SynthSettings extends ChannelSettings` — é o "superset" que o painel do synth
 *   edita (global + por canal). `vibrato` foi renomeado para `modWheel` (mesmo CC1).
 */

export interface SynthEngine {
  noteOn(channel: number, note: number, velocity: number): void;
  noteOff(channel: number, note: number): void;
  controlChange(channel: number, controller: number, value: number): void;
  /** `bank`: 0–127 melódico; 128 = kit de bateria (o canal passa a tocar como percussão). */
  programChange(channel: number, program: number, bank?: number): void;
  pitchBend(channel: number, value14: number): void;
  channelPressure(channel: number, pressure: number): void;
  polyPressure(channel: number, note: number, pressure: number): void;
  allSoundOff(): void;
  /** Adiciona um banco de sons (vários podem ficar ativos ao mesmo tempo). */
  addSoundBank(id: string, buffer: ArrayBuffer, name: string): Promise<void>;
  removeSoundBank(id: string): Promise<void>;
  /** Define a prioridade dos bancos: o primeiro da lista vence quando há instrumentos repetidos. */
  setSoundBankOrder(ids: string[]): void;
  dispose(): void;
}

export interface FxControls {
  setDelay(timeMs: number, feedbackPercent: number, mixPercent: number): void;
  setEQ(lowDb: number, midDb: number, highDb: number): void;
  setCompressor(thresholdDb: number, ratio: number): void;
}

export interface SynthDiagnostics {
  voiceCount: number | null;
  voiceCap: number | null;
  interpolationType: string | null;
  effectsEnabled: boolean | null;
  eventsEnabled: boolean | null;
}

export interface SynthBackend {
  engine: SynthEngine;
  fx: FxControls;
  resume(): Promise<void>;
  getAudioDiagnostics?(): AudioContextDiagnostics;
  getSynthDiagnostics?(): SynthDiagnostics;
  /** Ativa/desativa o bypass temporário da cadeia de efeitos master. */
  setFxBypass?(enabled: boolean): void;
  dispose(): void;
}

export type BackendFactory = () => Promise<SynthBackend>;

/**
 * Estado POR CANAL (era a união de `ChannelSettings` + `MixerState`).
 * Mistura controles de síntese e de mixer; ambos são enviados como CC (ou
 * PC/PB/CP) para o canal.
 */
export interface ChannelSettings {
  // ---- síntese / mixer (CCs) ----
  volume: number;       // CC7
  reverb: number;       // CC91
  chorus: number;       // CC93
  cutoff: number;       // CC74
  resonance: number;    // CC71
  attack: number;       // CC73
  release: number;      // CC72
  modWheel: number;     // CC1  (era `vibrato`)
  expression: number;   // CC11
  pan: number;          // CC10 (64 = centro)
  transpose: number;    // não é CC, é interno do motor
  fineTune: number;     // RPN 1
  pitchBendRange: number; // RPN 0
  // ---- mixer: valores não-CC (enviados explicitamente pelo painel) ----
  program: number;      // PC, 1–128 (convenção da UI)
  pitchBend: number;    // PB, 0–16383
  pressure: number;     // CP, 0–127
}

/** Superset (global + por canal). O painel do sintetizador edita este tipo. */
export interface SynthSettings extends ChannelSettings {
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  compThreshold: number;
  maxPolyphony: number;
}

export const DEFAULT_SYNTH_SETTINGS: SynthSettings = {
  // global
  delayTime: 300,
  delayFeedback: 30,
  delayMix: 0,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  compThreshold: -24,
  maxPolyphony: 64,
  // canal
  volume: 85,
  reverb: 35,
  chorus: 0,
  cutoff: 127,
  resonance: 64,
  attack: 64,
  release: 64,
  modWheel: 0,
  expression: 127,
  pan: 64,
  transpose: 0,
  fineTune: 0,
  pitchBendRange: 2,
  program: 1,
  pitchBend: 8192,
  pressure: 0,
};

/** Parâmetros globais: só a cadeia de efeitos master e o limite de vozes. */
export type GlobalSettings = Pick<
  SynthSettings,
  'delayTime' | 'delayFeedback' | 'delayMix' | 'eqLow' | 'eqMid' | 'eqHigh' | 'compThreshold' | 'maxPolyphony'
>;

export const CHANNEL_SETTING_KEYS: ReadonlyArray<keyof ChannelSettings> = [
  'volume', 'reverb', 'chorus', 'cutoff', 'resonance', 'attack', 'release', 'modWheel',
  'expression', 'pan', 'transpose', 'fineTune', 'pitchBendRange',
  'program', 'pitchBend', 'pressure',
];

export const DEFAULT_CHANNEL_SETTINGS: ChannelSettings = {
  volume: DEFAULT_SYNTH_SETTINGS.volume,
  reverb: DEFAULT_SYNTH_SETTINGS.reverb,
  chorus: DEFAULT_SYNTH_SETTINGS.chorus,
  cutoff: DEFAULT_SYNTH_SETTINGS.cutoff,
  resonance: DEFAULT_SYNTH_SETTINGS.resonance,
  attack: DEFAULT_SYNTH_SETTINGS.attack,
  release: DEFAULT_SYNTH_SETTINGS.release,
  modWheel: DEFAULT_SYNTH_SETTINGS.modWheel,
  expression: DEFAULT_SYNTH_SETTINGS.expression,
  pan: DEFAULT_SYNTH_SETTINGS.pan,
  transpose: DEFAULT_SYNTH_SETTINGS.transpose,
  fineTune: DEFAULT_SYNTH_SETTINGS.fineTune,
  pitchBendRange: DEFAULT_SYNTH_SETTINGS.pitchBendRange,
  program: DEFAULT_SYNTH_SETTINGS.program,
  pitchBend: DEFAULT_SYNTH_SETTINGS.pitchBend,
  pressure: DEFAULT_SYNTH_SETTINGS.pressure,
};

export const isChannelSettingKey = (key: keyof SynthSettings): key is keyof ChannelSettings =>
  (CHANNEL_SETTING_KEYS as ReadonlyArray<string>).includes(key);
