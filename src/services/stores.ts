/**
 * stores.ts — stores globais (persistidos + memória) do app.
 *
 * 🔗 Relacionamentos:
 * - `prefsStore`      → consumido por `App.tsx`, `useAppHandlers.ts`, `SettingsScreen.tsx`.
 * - `padsStore`       → consumido por `MidiPadGrid.tsx`.
 * - `toolsStore`      → consumido por `PerformancePanel.tsx`, `ArpPanel.tsx`, `MetronomePanel.tsx`.
 * - `runtimeStore`    → (memória) `ArpPanel.tsx`, `MetronomePanel.tsx`.
 * - `channelsStore` / `channelSettingsStore` → painéis do Mixer/CC.
 * - `mixerStore`             → `MidiControlsScreen.tsx` (faders do Mixer, POR CANAL).
 * - `synthSettingsStore` → alimenta `synthService.applyGlobalSettings/applyChannelSettings`.
 * - `learnStore`      → consumido por `LearnPanel.tsx`.
 *
 * 📝 Notas:
 * - `startOctave` e `padBank` passaram a ser persistidos (antes eram `useState` no App.tsx
 *   e voltavam pro padrão a cada reload). Faixas: octave 1–6, bank 0–3.
 * - `mixerStore` substituiu o estado global que ficava em `localStorage` (chave
 *   `nexusmidi_mixer_state`) dentro de `MidiControlsScreen.tsx`. Agora os faders
 *   são POR CANAL e a persistência é debounced pelo `createStore`. A chave antiga
 *   é migrada para o canal 1 no primeiro load.
 */
import { clampInt } from '../lib/midiMath';
import { createMemoryStorage, createStore } from '../lib/storeCore';
import type { ArpConfig } from '../lib/arpeggiator';
import { DEFAULT_ARP_CONFIG } from '../lib/arpeggiator';
import type { CcMapping } from '../lib/midiLearn';
import type { ChordId, ScaleId } from '../lib/scales';
import type { VelocityCurve } from '../lib/velocity';
import { CHANNEL_SETTING_KEYS, DEFAULT_CHANNEL_SETTINGS, DEFAULT_SYNTH_SETTINGS, type ChannelSettings, type SynthSettings } from './synthTypes';
import type { ChordType } from '../constants/chords';

export type Language = 'pt-BR' | 'en';
const CURVES: VelocityCurve[] = ['linear', 'soft', 'hard', 'fixed'];

// ---------------------------------------------------------------- preferências
export interface Prefs {
  paletteId: string;
  velocity: number;
  velocityCurve: VelocityCurve;
  channel: number;
  padsChannel: number;
  language: Language;
  theme: 'dark' | 'light' | 'system';
  sustain: boolean;
  wakeLock: boolean;
  /** Oitava inicial do teclado virtual (1–6). Persistido para o usuário não perder posição. */
  startOctave: number;
  /** Banco de pads ativo (0–3). Persistido pelo mesmo motivo. */
  padBank: number;
}

export const DEFAULT_PREFS: Prefs = {
  paletteId: 'custom-blue',
  velocity: 64,
  velocityCurve: 'linear',
  channel: 1,
  padsChannel: 10,
  language: 'pt-BR',
  theme: 'dark',
  sustain: false,
  wakeLock: true,
  startOctave: 3,
  padBank: 0,
};

export const prefsStore = createStore<Prefs>('nexusmidi.prefs', DEFAULT_PREFS, {
  legacy: (storage) => {
    const out: Partial<Prefs> = {};
    const palette = storage.getItem('midi_palette_id');
    const velocity = Number(storage.getItem('midi_velocity'));
    if (palette) out.paletteId = palette;
    if (Number.isFinite(velocity) && velocity > 0) out.velocity = velocity;
    return out;
  },
  sanitize: (p) => ({
    paletteId: typeof p.paletteId === 'string' ? p.paletteId : DEFAULT_PREFS.paletteId,
    velocity: clampInt(p.velocity, 1, 127),
    velocityCurve: CURVES.includes(p.velocityCurve) ? p.velocityCurve : 'linear',
    channel: clampInt(p.channel, 1, 16),
    padsChannel: clampInt(p.padsChannel, 1, 16),
    language: p.language === 'en' ? 'en' : 'pt-BR',
    theme: ['dark', 'light', 'system'].includes(p.theme) ? p.theme : 'dark',
    // NÃO RESTAURAR sustain: o sintetizador não sabe que o pedal está "ligado",
    // então na reabertura sempre começa desligado. O CC 64 real é enviado quando o usuário alterna.
    sustain: false,
    wakeLock: typeof p.wakeLock === 'boolean' ? p.wakeLock : true,
    startOctave: clampInt(p.startOctave, 1, 6),
    padBank: clampInt(p.padBank, 0, 3),
  }),
});

// ------------------------------------------------------------------- sintetizador
export const synthSettingsStore = createStore<SynthSettings>('nexus_synth_settings', DEFAULT_SYNTH_SETTINGS);

export interface ChannelState {
  assignments: Record<number, number>;
  banks: Record<number, number>;
  muted: Record<number, boolean>;
  solo: number | null;
}

const parseJson = <T>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const channelsStore = createStore<ChannelState>(
  'nexusmidi.channels',
  { assignments: {}, banks: {}, muted: {}, solo: null },
  {
    legacy: (storage) => ({
      assignments: parseJson<Record<number, number>>(storage.getItem('nexus_sf_channels'), {}),
      muted: parseJson<Record<number, boolean>>(storage.getItem('nexus_sf_mutes'), {}),
    }),
  },
);

export interface ChannelSettingsState {
  channels: Record<number, ChannelSettings>;
}

export const channelSettingsOf = (state: ChannelSettingsState, channel: number): ChannelSettings =>
  state.channels[channel] ?? DEFAULT_CHANNEL_SETTINGS;

export function updateChannelSettings(channel: number, patch: Partial<ChannelSettings>): void {
  channelSettingsStore.set((prev) => ({
    channels: { ...prev.channels, [channel]: { ...channelSettingsOf(prev, channel), ...patch } },
  }));
}

function cleanChannelSettings(raw: unknown): ChannelSettings {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof ChannelSettings, unknown>>;
  const out: ChannelSettings = { ...DEFAULT_CHANNEL_SETTINGS };
  for (const key of CHANNEL_SETTING_KEYS) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

export const channelSettingsStore = createStore<ChannelSettingsState>(
  'nexusmidi.channelSettings',
  { channels: {} },
  {
    legacy: (storage) => ({
      channels: parseJson<Record<number, ChannelSettings>>(storage.getItem('nexusmidi_channel_settings'), {}),
    }),
    sanitize: (state) => {
      const channels: Record<number, ChannelSettings> = {};
      for (const [key, value] of Object.entries(state.channels ?? {})) {
        const channel = Number(key);
        if (Number.isInteger(channel) && channel >= 1 && channel <= 16) channels[channel] = cleanChannelSettings(value);
      }
      return { channels };
    },
  },
);


// ----------------------------------------------------------------- Mixer / CC
/**
 * Estado dos faders/knobs do painel Mixer/CC. Separado de `ChannelSettings`
 * porque os campos não se sobrepõem conceitualmente (aqui é controle de
 * performance + program; lá são parâmetros do sintetizador).
 */
export interface MixerState {
  modWheel: number;     // CC1,   0–127
  volume: number;       // CC7,   0–127
  expression: number;   // CC11,  0–127
  pan: number;          // CC10,  0–127 (64 = centro)
  program: number;      // PC,    1–128
  pitchBend: number;    // PB,    0–16383 (8192 = centro)
  pressure: number;     // CP,    0–127
  reverb: number;       // CC91,  0–127
  chorus: number;       // CC93,  0–127
  cutoff: number;       // CC74,  0–127
  resonance: number;    // CC71,  0–127
}

export const DEFAULT_MIXER: MixerState = {
  modWheel: 0,
  volume: 100,
  expression: 127,
  pan: 64,
  program: 1,
  pitchBend: 8192,
  pressure: 0,
  reverb: 40,
  chorus: 15,
  cutoff: 127,
  resonance: 64,
};

export interface MixerStateAll {
  byChannel: Record<number, MixerState>;
}

function cleanMixer(raw: unknown): MixerState {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof MixerState, unknown>>;
  const num = (v: unknown, lo: number, hi: number, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? clampInt(n, lo, hi) : fallback;
  };
  return {
    modWheel: num(src.modWheel, 0, 127, DEFAULT_MIXER.modWheel),
    volume: num(src.volume, 0, 127, DEFAULT_MIXER.volume),
    expression: num(src.expression, 0, 127, DEFAULT_MIXER.expression),
    pan: num(src.pan, 0, 127, DEFAULT_MIXER.pan),
    program: num(src.program, 1, 128, DEFAULT_MIXER.program),
    pitchBend: num(src.pitchBend, 0, 16383, DEFAULT_MIXER.pitchBend),
    pressure: num(src.pressure, 0, 127, DEFAULT_MIXER.pressure),
    reverb: num(src.reverb, 0, 127, DEFAULT_MIXER.reverb),
    chorus: num(src.chorus, 0, 127, DEFAULT_MIXER.chorus),
    cutoff: num(src.cutoff, 0, 127, DEFAULT_MIXER.cutoff),
    resonance: num(src.resonance, 0, 127, DEFAULT_MIXER.resonance),
  };
}

export const mixerStore = createStore<MixerStateAll>(
  'nexusmidi.mixer',
  { byChannel: {} },
  {
    // Migração one-shot do formato antigo (estado global em localStorage sob
    // `nexusmidi_mixer_state`). A primeira vez que o app abrir com esta versão,
    // o estado antigo vira o canal 1 e a chave velha é removida.
   legacy: (storage) => {
  const byChannel: Record<number, MixerState> = {};
  try {
    const old = storage.getItem('nexusmidi_mixer_state');
    if (old) {
      const parsed = JSON.parse(old);
      storage.removeItem('nexusmidi_mixer_state');
      byChannel[1] = cleanMixer(parsed);
    }
  } catch { /* ignora */ }
  return { byChannel };
},
    sanitize: (state) => {
      const byChannel: Record<number, MixerState> = {};
      for (const [key, value] of Object.entries(state.byChannel ?? {})) {
        const ch = Number(key);
        if (!Number.isInteger(ch) || ch < 1 || ch > 16) continue;
        byChannel[ch] = cleanMixer(value);
      }
      return { byChannel };
    },
  },
);

/** Retorna o estado de um canal, com fallback nos defaults. */
export const mixerForChannel = (state: MixerStateAll, channel: number): MixerState =>
  state.byChannel[channel] ?? DEFAULT_MIXER;

/** Atualiza um subconjunto do estado de um canal (merge raso). */
export function updateMixerForChannel(channel: number, patch: Partial<MixerState>): void {
  mixerStore.set((prev) => ({
    byChannel: {
      ...prev.byChannel,
      [channel]: { ...mixerForChannel(prev, channel), ...patch },
    },
  }));
}

/** Remove o estado de um canal (volta aos defaults). */
export function resetMixerForChannel(channel: number): void {
  mixerStore.set((prev) => {
    if (!(channel in prev.byChannel)) return prev;
    const next = { ...prev.byChannel };
    delete next[channel];
    return { byChannel: next };
  });
}

// ----------------------------------------------------------------------- ferramentas
export interface ToolsState {
  bpm: number;
  arp: Omit<ArpConfig, 'enabled' | 'bpm'>;
  chord: ChordId;
  chordInversion: number;
  scale: ScaleId;
  scaleRoot: number;
  metronomeVolume: number;
  beatsPerBar: number;
  fixedVelocity: number;
}

const ARP_DEFAULTS: ToolsState['arp'] = {
  pattern: DEFAULT_ARP_CONFIG.pattern,
  rate: DEFAULT_ARP_CONFIG.rate,
  octaves: DEFAULT_ARP_CONFIG.octaves,
  gate: DEFAULT_ARP_CONFIG.gate,
  latch: DEFAULT_ARP_CONFIG.latch,
};

export const DEFAULT_TOOLS: ToolsState = {
  bpm: 120,
  arp: ARP_DEFAULTS,
  chord: 'off',
  chordInversion: 0,
  scale: 'chromatic',
  scaleRoot: 0,
  metronomeVolume: 70,
  beatsPerBar: 4,
  fixedVelocity: 100,
};

export const toolsStore = createStore<ToolsState>('nexusmidi.tools', DEFAULT_TOOLS, {
  sanitize: (t) => ({
    ...t,
    bpm: clampInt(t.bpm, 20, 300),
    beatsPerBar: clampInt(t.beatsPerBar, 1, 12),
    metronomeVolume: clampInt(t.metronomeVolume, 0, 100),
    scaleRoot: clampInt(t.scaleRoot, 0, 11),
    chordInversion: clampInt(t.chordInversion, 0, 3),
    fixedVelocity: clampInt(t.fixedVelocity, 1, 127),
    arp: { ...DEFAULT_TOOLS.arp, ...t.arp },
  }),
});

export interface RuntimeState {
  arpEnabled: boolean;
  metronomeOn: boolean;
  clockOut: boolean;
}

export const runtimeStore = createStore<RuntimeState>(
  'nexusmidi.runtime',
  { arpEnabled: false, metronomeOn: false, clockOut: false },
  { storage: createMemoryStorage() },
);

export const learnStore = createStore<{ mappings: CcMapping[] }>('nexusmidi.learn', { mappings: [] });

// ----------------------------------------------------------------------- PADS
export interface PadData {
  note: number;
  label: string;
  color: string;
  velocity?: number;
  chordType?: ChordType;
  chordIntervals?: number[];
}

const DEFAULT_BANKS: PadData[][] = [
  [
    { note: 36, label: 'Bumbo', color: 'bg-blue-500', velocity: 100 },
    { note: 38, label: 'Caixa', color: 'bg-red-500', velocity: 100 },
    { note: 42, label: 'Chimbal F.', color: 'bg-yellow-500', velocity: 100 },
    { note: 46, label: 'Chimbal A.', color: 'bg-yellow-400', velocity: 100 },
    { note: 41, label: 'Tom Grave', color: 'bg-green-500', velocity: 100 },
    { note: 45, label: 'Tom Médio', color: 'bg-green-400', velocity: 100 },
    { note: 48, label: 'Tom Agudo', color: 'bg-green-300', velocity: 100 },
    { note: 50, label: 'Tom Alto', color: 'bg-teal-500', velocity: 100 },
    { note: 49, label: 'Prato Ataque', color: 'bg-cyan-500', velocity: 100 },
    { note: 51, label: 'Prato Cond.', color: 'bg-cyan-400', velocity: 100 },
    { note: 39, label: 'Palmas', color: 'bg-orange-500', velocity: 100 },
    { note: 56, label: 'Cabaça', color: 'bg-amber-500', velocity: 100 },
    { note: 54, label: 'Pandeiro', color: 'bg-pink-500', velocity: 100 },
    { note: 60, label: 'Bongo A.', color: 'bg-purple-500', velocity: 100 },
    { note: 61, label: 'Bongo G.', color: 'bg-purple-400', velocity: 100 },
    { note: 76, label: 'Bloco Mad.', color: 'bg-stone-500', velocity: 100 },
  ],
  [...Array(16)].map((_, i) => ({ note: 60 + i, label: `Nota ${60 + i}`, color: 'bg-slate-600', velocity: 100 })),
  [...Array(16)].map((_, i) => ({ note: 72 + i, label: `Nota ${72 + i}`, color: 'bg-slate-500', velocity: 100 })),
  [...Array(16)].map((_, i) => ({ note: 84 + i, label: `Nota ${84 + i}`, color: 'bg-slate-400', velocity: 100 })),
];

export interface PadsState {
  banks: PadData[][];
}

function cleanPad(raw: unknown, fallback: PadData): PadData {
  if (!raw || typeof raw !== 'object') return fallback;
  const p = raw as Partial<PadData>;
  const note = Number(p.note);
  const velocity = Number(p.velocity);
  return {
    note: Number.isFinite(note) ? clampInt(note, 0, 127) : fallback.note,
    label: typeof p.label === 'string' && p.label.length > 0 ? p.label : fallback.label,
    color: typeof p.color === 'string' && p.color.length > 0 ? p.color : fallback.color,
    velocity: Number.isFinite(velocity) ? clampInt(velocity, 1, 127) : 100,
    chordType: p.chordType,
    chordIntervals: Array.isArray(p.chordIntervals) ? p.chordIntervals : undefined,
  };
}

export const padsStore = createStore<PadsState>('nexusmidi.pads', { banks: DEFAULT_BANKS }, {
  legacy: (storage) => {
    const saved = storage.getItem('nexus_pads_data_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return { banks: parsed };
      } catch { /* ignora */ }
    }
    return { banks: DEFAULT_BANKS };
  },
  sanitize: (state) => {
    if (!Array.isArray(state.banks) || state.banks.length !== 4) return { banks: DEFAULT_BANKS };
    const banks: PadData[][] = [];
    for (let b = 0; b < 4; b++) {
      const rawBank = state.banks[b];
      if (!Array.isArray(rawBank) || rawBank.length !== 16) {
        banks.push(DEFAULT_BANKS[b]);
        continue;
      }
      const bank: PadData[] = [];
      for (let i = 0; i < 16; i++) {
        bank.push(cleanPad(rawBank[i], DEFAULT_BANKS[b][i]));
      }
      banks.push(bank);
    }
    return { banks };
  },
});
