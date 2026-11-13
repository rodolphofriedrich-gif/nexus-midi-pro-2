import './services/learnService';
import './services/performanceService';
import './services/metronomeService';
import { flushAllStores } from './lib/storeCore';
import { channelSettingsOf, channelSettingsStore, channelsStore, synthSettingsStore } from './services/stores';
import { performanceEngine } from './services/performanceService'; // Import necessário para o handler
import { soundFontLibrary } from './services/soundFontLibrary';
import { synthService } from './services/synthService';

let started = false;

/** Liga os serviços que precisam viver durante todo o app (e não apenas enquanto uma tela está aberta). */
export function startAppServices(): void {
  if (started) return;
  started = true;

  const volumeOf = (channel: number): number => channelSettingsOf(channelSettingsStore.get(), channel).volume;

  const applyMix = (): void => {
    const c = channelsStore.get();
    synthService.applyMix(volumeOf, c.muted, c.solo);
  };

  const applyAll = (): void => {
    const channels = channelsStore.get();
    synthService.setChannelPrograms(channels.assignments, channels.banks);
    synthService.applyGlobalSettings(synthSettingsStore.get());
    const perChannel = channelSettingsStore.get();
    for (let ch = 1; ch <= 16; ch++) synthService.applyChannelSettings(ch, channelSettingsOf(perChannel, ch));
    applyMix();
  };

  // Efeitos globais (delay, EQ, compressor, polifonia) → motor de áudio (só o que mudou).
  let previousSettings = synthSettingsStore.get();
  synthSettingsStore.subscribe(() => {
    const next = synthSettingsStore.get();
    synthService.applyGlobalSettings(next, previousSettings);
    previousSettings = next;
  });

  // Ajustes de cada canal: só o canal alterado é reenviado, e só o que mudou nele.
  let previousChannelSettings = channelSettingsStore.get();
  channelSettingsStore.subscribe(() => {
    const next = channelSettingsStore.get();
    const c = channelsStore.get();
    for (let ch = 1; ch <= 16; ch++) {
      const before = channelSettingsOf(previousChannelSettings, ch);
      const after = channelSettingsOf(next, ch);
      synthService.applyChannelSettings(ch, after, before);
      if (before.volume !== after.volume) synthService.applyChannelMix(ch, after.volume, c.muted, c.solo);
    }
    previousChannelSettings = next;
  });

  // Mute/solo
  let previousChannels = channelsStore.get();
  channelsStore.subscribe(() => {
    const next = channelsStore.get();
    if (next.muted !== previousChannels.muted || next.solo !== previousChannels.solo) applyMix();
    previousChannels = next;
  });

  // Todo SoundFont novo começa "limpo": reaplica programas, efeitos e mix.
  soundFontLibrary.setOnLoaded(applyAll);
  void soundFontLibrary.restore();

  // Ao ir para segundo plano (ou fechar), grava o que ainda estava aguardando o "debounce"
  // e força a parada de notas/arpejador.
  // No WebView do Android, `blur` frequentemente NÃO dispara; `visibilitychange` é a
  // última linha de defesa contra o "drone" de notas em background.
  const handleHidden = (): void => {
    performanceEngine.releaseAll();
    synthService.allNotesOff();
    flushAllStores();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handleHidden();
  });
  window.addEventListener('pagehide', handleHidden);

  // Navegadores só liberam áudio após um gesto do usuário.
  const unlock = (): void => void synthService.resume();
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
