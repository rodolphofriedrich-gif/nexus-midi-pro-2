import { WorkletSynthesizer } from 'spessasynth_lib';
import workletUrl from 'spessasynth_lib/dist/spessasynth_processor.min.js?url';
import type { SynthBackend, SynthEngine } from '../synthTypes';
import { FxChain } from './fxChain';
import { markLatencyStage, type AudioContextDiagnostics } from '../latencyDiagnostics';

/**
 * Superfície do WorkletSynthesizer que o app usa. Declarada aqui para que mudanças de tipagem
 * entre versões menores da biblioteca não quebrem o build — e para tolerar métodos ausentes.
 */
interface SpessaSynthLike {
  connect(node: AudioNode): unknown;
  noteOn(channel: number, note: number, velocity: number): void;
  noteOff(channel: number, note: number): void;
  controllerChange(channel: number, controller: number, value: number): void;
  programChange(channel: number, program: number): void;
  /** Marca o canal como percussão (ou melódico). */
  setDrums?(channel: number, isDrum: boolean): void;
  pitchWheel?(channel: number, value14: number): void;
  channelPressure?(channel: number, pressure: number): void;
  polyPressure?(channel: number, note: number, pressure: number): void;
  stopAll?(force?: boolean): void;
  destroy?(): void;
  isReady?: Promise<unknown>;
  soundBankManager: {
    addSoundBank(buffer: ArrayBuffer, id: string, bankOffset?: number): unknown;
    deleteSoundBank?(id: string): unknown;
    /** Reordena os bancos (o primeiro da lista tem a maior prioridade). */
    rearrangeSoundBanks?(ids: string[]): unknown;
  };
}

const DEFAULT_DRUM_CHANNEL = 9; // canal 10 (GM) começa como percussão

class SpessaEngine implements SynthEngine {
  /** Canais atualmente em modo percussão (kits de bateria). */
  private readonly drumChannels = new Set<number>([DEFAULT_DRUM_CHANNEL]);

  constructor(private readonly synth: SpessaSynthLike) {}

  noteOn(channel: number, note: number, velocity: number): void {
    markLatencyStage('spessa.worklet.noteOn.call', channel + 1);
    this.synth.noteOn(channel, note, velocity);
    markLatencyStage('spessa.worklet.noteOn.return', channel + 1);
  }
  noteOff(channel: number, note: number): void {
    this.synth.noteOff(channel, note);
  }
  controlChange(channel: number, controller: number, value: number): void {
    this.synth.controllerChange(channel, controller, value);
  }
  programChange(channel: number, program: number, bank = 0): void {
    if (bank >= 128) {
      // Kit de bateria: o canal vira percussão e o programa escolhe o kit.
      this.synth.setDrums?.(channel, true);
      this.drumChannels.add(channel);
    } else {
      if (this.drumChannels.has(channel) && channel !== DEFAULT_DRUM_CHANNEL) {
        this.synth.setDrums?.(channel, false);
        this.drumChannels.delete(channel);
      }
      // Seleção de banco (CC 0 / CC 32) antes do program change. Em percussão não se aplica.
      if (!this.drumChannels.has(channel)) {
        this.synth.controllerChange(channel, 0, Math.min(bank, 127));
        this.synth.controllerChange(channel, 32, 0);
      }
    }
    this.synth.programChange(channel, program);
  }
  pitchBend(channel: number, value14: number): void {
    this.synth.pitchWheel?.(channel, value14);
  }
  channelPressure(channel: number, pressure: number): void {
    this.synth.channelPressure?.(channel, pressure);
  }
  polyPressure(channel: number, note: number, pressure: number): void {
    this.synth.polyPressure?.(channel, note, pressure);
  }
  allSoundOff(): void {
    // Tríade de emergência em todos os 16 canais ANTES do stopAll.
    // Cobre vozes presas no worklet (bug do Android WebView ao receber
    // rajadas de noteOn/noteOff durante arrasto rápido no teclado).
    for (let ch = 0; ch < 16; ch++) {
      this.synth.controllerChange(ch, 64, 0);   // Sustain off
      this.synth.controllerChange(ch, 120, 0);  // All Sound Off
      this.synth.controllerChange(ch, 123, 0);  // All Notes Off
    }
    this.synth.stopAll?.(true);
  }

  async addSoundBank(id: string, buffer: ArrayBuffer, _name: string): Promise<void> {
    await this.synth.soundBankManager.addSoundBank(buffer, id);
  }

  async removeSoundBank(id: string): Promise<void> {
    try {
      await this.synth.soundBankManager.deleteSoundBank?.(id);
    } catch {
      /* o banco já pode ter sido removido */
    }
  }

  setSoundBankOrder(ids: string[]): void {
    if (ids.length > 1) this.synth.soundBankManager.rearrangeSoundBanks?.(ids);
  }

  dispose(): void {
    try {
      this.synth.destroy?.();
    } catch {
      /* ignora */
    }
  }
}

/** Cria o backend real: AudioContext + SpessaSynth + cadeia de efeitos. Carregado sob demanda. */
export async function createWebAudioBackend(): Promise<SynthBackend> {
  const Ctor: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  // Sem sampleRate fixo: usa a taxa nativa do aparelho, evitando reamostragem.
  const ctx = new Ctor({ latencyHint: 'interactive' });

  // ⚠️ Crítico: WorkletSynthesizer NÃO carrega bancos com o contexto suspenso.
  // No WebView do Android, `ctx.state` começa `suspended` e `resume()` só
  // resolve após um gesto do usuário. Antes de criar o worklet, aguardamos
  // esse gesto — senão `soundBankManager.addSoundBank()` (chamado pelo
  // `soundFontLibrary.restore()` no boot) falha silenciosamente e o SF2
  // aparece na biblioteca mas sem presets e sem tocar.
  if (ctx.state === 'suspended') {
    await new Promise<void>((resolve) => {
      const onGesture = () => {
        window.removeEventListener('pointerdown', onGesture);
        window.removeEventListener('keydown', onGesture);
        void ctx.resume().then(() => resolve()).catch(() => resolve());
      };
      window.addEventListener('pointerdown', onGesture, { once: true });
      window.addEventListener('keydown', onGesture, { once: true });
    });
  }

  await ctx.audioWorklet.addModule(workletUrl);

  const synth = new WorkletSynthesizer(ctx) as unknown as SpessaSynthLike;
  if (synth.isReady) await synth.isReady;

  const fx = new FxChain(ctx, ctx.destination);
  synth.connect(fx.input);

  const engine = new SpessaEngine(synth);
  return {
    engine,
    fx,
    setFxBypass: (enabled: boolean) => fx.setBypass(enabled),
    resume: async () => {
      if (ctx.state !== 'running') await ctx.resume().catch(() => undefined);
    },
    getAudioDiagnostics: (): AudioContextDiagnostics => {
      const audioContext = ctx as AudioContext & {
        outputLatency?: number;
        getOutputTimestamp?: () => { contextTime: number; performanceTime: number };
      };
      let outputTimestamp: AudioContextDiagnostics['outputTimestamp'] = null;
      try {
        const stamp = audioContext.getOutputTimestamp?.();
        const contextTime = Number(stamp?.contextTime);
        const performanceTime = Number(stamp?.performanceTime);
        if (Number.isFinite(contextTime) && Number.isFinite(performanceTime)) {
          outputTimestamp = { contextTime, performanceTime };
        }
      } catch {
        outputTimestamp = null;
      }
      return {
        state: ctx.state,
        sampleRate: ctx.sampleRate,
        currentTime: Number(ctx.currentTime.toFixed(4)),
        baseLatencyMs: Number.isFinite(audioContext.baseLatency) ? Number((audioContext.baseLatency * 1000).toFixed(2)) : null,
        outputLatencyMs: Number.isFinite(audioContext.outputLatency) ? Number((audioContext.outputLatency! * 1000).toFixed(2)) : null,
        outputTimestamp,
        workletAvailable: typeof ctx.audioWorklet !== 'undefined',
      };
    },
    dispose: () => {
      engine.dispose();
      fx.dispose();
      void ctx.close().catch(() => undefined);
    },
  };
}
