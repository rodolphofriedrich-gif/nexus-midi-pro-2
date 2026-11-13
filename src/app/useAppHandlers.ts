/**
 * useAppHandlers — handlers de alto nível do App.
 *
 * 🔗 Relacionamentos:
 * - Consumido por: `App.tsx` (via `useAppHandlers(...)`, passando `prefs`,
 *   `showMessage`, `setShowExit`, `setIsRouterRefreshing`, `devices.refresh`
 *   e `firstConnectedDeviceId`).
 * - Consome: `midiManager` (midiService.ts), `performanceEngine`,
 *   `prefsStore` (services/stores.ts) e `NativeMidi` (nativeMidi.ts).
 * - `handleRefreshRouter` agora usa o `onError` de `refreshDevices` para
 *   mostrar toast quando o refresh do roteador falha (em vez de catch que
 *   nunca disparava, porque o manager devolvia cache silencioso).
 */
import { useCallback } from 'react';
import { tr } from '../i18n';
import { midiManager, VIRTUAL_ID } from '../services/midiService';
import { NativeMidi } from '../services/nativeMidi';
import { performanceEngine } from '../services/performanceService';
import { prefsStore, type Prefs } from '../services/stores';
import type { ToastType } from '../hooks/useToast';

type Notify = (text: string, type?: ToastType, durationMs?: number) => void;

interface UseAppHandlersArgs {
  prefs: Prefs;
  showMessage: Notify;
  setShowExit: (value: boolean) => void;
  setIsRouterRefreshing: (value: boolean) => void;
  /** Recebe `onError` opcional para reportar falha de refresh na UI. */
  refreshDevices: (onError?: (error: unknown) => void) => Promise<void>;
  firstConnectedDeviceId: string | undefined;
}

export function useAppHandlers({
  prefs: _prefs,
  showMessage,
  setShowExit,
  setIsRouterRefreshing,
  refreshDevices,
  firstConnectedDeviceId,
}: UseAppHandlersArgs) {
  const handleNoteOn = useCallback(
    (note: number, channel: number, velocity?: number, sourceId?: string) =>
      performanceEngine.noteOn(channel, note, velocity ?? prefsStore.get().velocity, sourceId),
    [],
  );

  const handleNoteOff = useCallback(
    (note: number, channel: number, sourceId?: string) =>
      performanceEngine.noteOff(channel, note, sourceId),
    [],
  );

  const handleDisabledPress = useCallback(() => {
    showMessage(tr('Conecte um destino MIDI ou carregue um SoundFont.'), 'warn', 2500);
  }, [showMessage]);

  const handleToggleSustain = useCallback(async () => {
    // Lê do store em vez de `prefs.sustain` para não recriar o callback a cada
    // mudança de preferências. O callback é passado para header e teclado.
    const next = !prefsStore.get().sustain;
    prefsStore.set({ sustain: next });
    try {
      const jobs: Promise<unknown>[] = [];
      for (let ch = 1; ch <= 16; ch++) {
        jobs.push(midiManager.sendControlChange(ch, 64, next ? 127 : 0));
      }
      await Promise.all(jobs);
      showMessage(next ? tr('Sustain Ligado') : tr('Sustain Desligado'), 'info', 1500);
    } catch (error) {
      showMessage(tr('Erro ao enviar Sustain: {message}', { message: error instanceof Error ? error.message : '' }), 'error', 2500);
    }
  }, [showMessage]);

  const handlePanic = useCallback(async () => {
    try {
      const result = await midiManager.sendPanic();
      if (result.failed.length > 0) {
        showMessage(
          tr('MIDI Panic enviado parcialmente. Dispositivos sem resposta: {names}', { names: result.failed.join(', ') }),
          'warn',
          3500,
        );
      } else {
        showMessage(tr('MIDI Panic enviado'), 'info', 1500);
      }
    } catch {
      showMessage(tr('Falha no MIDI Panic'), 'error', 2500);
    }
  }, [showMessage]);

  const handleConfirmExit = useCallback(async () => {
    setShowExit(false);
    try {
      await NativeMidi.fecharApp();
    } catch {
      window.close();
    }
  }, [setShowExit]);

  const handleRefreshRouter = useCallback(async () => {
    setIsRouterRefreshing(true);
    try {
      // `refreshDevices` nunca rejeita — ele chama `onError` quando o plugin
      // falha em `getDevices()`. Assim, o toast aparece só quando há falha
      // real, sem try/catch que nunca dispararia.
      await refreshDevices((error) => {
        console.warn('[useAppHandlers] refresh do roteador falhou:', error);
        showMessage(tr('Falha ao atualizar dispositivos MIDI'), 'error', 2500);
      });
    } finally {
      setIsRouterRefreshing(false);
    }
  }, [refreshDevices, setIsRouterRefreshing, showMessage]);

  const addNewRoute = useCallback(() => {
    midiManager.addRoute({ sourceId: VIRTUAL_ID, destinationId: firstConnectedDeviceId ?? '' });
  }, [firstConnectedDeviceId]);

  return {
    handleNoteOn,
    handleNoteOff,
    handleDisabledPress,
    handleToggleSustain,
    handlePanic,
    handleConfirmExit,
    handleRefreshRouter,
    addNewRoute,
  };
}
