import { registerPlugin } from '@capacitor/core';
import type { FxControls, SynthBackend, SynthEngine } from '../synthTypes';

interface NativeAudioPlugin {
  beginSoundFontUpload(options: { id: string }): Promise<void>;
  appendSoundFontChunk(options: { id: string; data: string }): Promise<void>;
  finishSoundFontUpload(options: { id: string }): Promise<{ soundFontId: number }>;
  cancelSoundFontUpload(options: { id: string }): Promise<void>;
  removeSoundBank(options: { id: string }): Promise<void>;
  noteOn(options: { channel: number; note: number; velocity: number }): Promise<void>;
  noteOff(options: { channel: number; note: number }): Promise<void>;
  controlChange(options: { channel: number; controller: number; value: number }): Promise<void>;
  programChange(options: { channel: number; program: number; bank: number }): Promise<void>;
  pitchBend(options: { channel: number; value: number }): Promise<void>;
  channelPressure(options: { channel: number; pressure: number }): Promise<void>;
  polyPressure(options: { channel: number; note: number; pressure: number }): Promise<void>;
  allSoundOff(): Promise<void>;
  resume(): Promise<void>;
}

const NativeAudio = registerPlugin<NativeAudioPlugin>('NativeAudio');
const CHUNK_BYTES = 1024 * 1024;

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const block = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += block) {
    const end = Math.min(offset + block, bytes.length);
    for (let i = offset; i < end; i++) binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

class NativeFluidSynthEngine implements SynthEngine {
  noteOn(channel: number, note: number, velocity: number): void {
    void NativeAudio.noteOn({ channel, note, velocity }).catch((error) => console.error('Native noteOn:', error));
  }
  noteOff(channel: number, note: number): void {
    void NativeAudio.noteOff({ channel, note }).catch((error) => console.error('Native noteOff:', error));
  }
  controlChange(channel: number, controller: number, value: number): void {
    void NativeAudio.controlChange({ channel, controller, value }).catch((error) => console.error('Native CC:', error));
  }
  programChange(channel: number, program: number, bank = 0): void {
    void NativeAudio.programChange({ channel, program, bank }).catch((error) => console.error('Native program change:', error));
  }
  pitchBend(channel: number, value14: number): void {
    void NativeAudio.pitchBend({ channel, value: value14 }).catch((error) => console.error('Native pitch bend:', error));
  }
  channelPressure(channel: number, pressure: number): void {
    void NativeAudio.channelPressure({ channel, pressure }).catch((error) => console.error('Native channel pressure:', error));
  }
  polyPressure(channel: number, note: number, pressure: number): void {
    void NativeAudio.polyPressure({ channel, note, pressure }).catch((error) => console.error('Native poly pressure:', error));
  }
  allSoundOff(): void {
    void NativeAudio.allSoundOff().catch((error) => console.error('Native all sound off:', error));
  }

  async addSoundBank(id: string, buffer: ArrayBuffer, _name: string): Promise<void> {
    const bytes = new Uint8Array(buffer);
    await NativeAudio.beginSoundFontUpload({ id });
    try {
      for (let offset = 0; offset < bytes.length; offset += CHUNK_BYTES) {
        const chunk = bytes.subarray(offset, Math.min(offset + CHUNK_BYTES, bytes.length));
        await NativeAudio.appendSoundFontChunk({ id, data: toBase64(chunk) });
      }
      await NativeAudio.finishSoundFontUpload({ id });
    } catch (error) {
      await NativeAudio.cancelSoundFontUpload({ id }).catch(() => undefined);
      throw error;
    }
  }

  async removeSoundBank(id: string): Promise<void> {
    await NativeAudio.removeSoundBank({ id });
  }

  // FluidSynth seleciona o banco/programa no canal; a prioridade de múltiplos
  // SoundFonts segue a ordem de carregamento até implementarmos um seletor por SFID.
  setSoundBankOrder(_ids: string[]): void {}

  dispose(): void {
    this.allSoundOff();
  }
}

const noFx: FxControls = {
  setDelay: () => undefined,
  setEQ: () => undefined,
  setCompressor: () => undefined,
};

export async function createNativeAudioBackend(): Promise<SynthBackend> {
  await NativeAudio.resume();
  return {
    engine: new NativeFluidSynthEngine(),
    fx: noFx,
    resume: async () => {
      await NativeAudio.resume();
    },
    dispose: () => {
      void NativeAudio.allSoundOff().catch(() => undefined);
    },
  };
}
