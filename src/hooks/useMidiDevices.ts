/**
 * useMidiDevices — estado e ações de conexão USB/BLE.
 *
 * 🔗 Relacionamentos:
 * - Consumido por: `App.tsx` (passa `refresh`, `toggleConnect`, etc. para
 *   `AppSidebar`, `MidiRouterScreen`, `useAppHandlers`).
 * - Consome: `midiManager` (midiService.ts), que registra os callbacks
 *   `handleRefresh` e `handleDisconnect` (usados aqui).
 * - `refresh(onError?)`: agora propaga falha de I/O via callback opcional.
 *   Chamadas internas (auto-refresh) continuam silenciosas.
 */
import { useCallback, useEffect, useState } from 'react';
import { tr } from '../i18n';
import { midiManager, type DisconnectReason } from '../services/midiService';
import type { MidiDestination } from '../types/midi';
import type { ToastType } from './useToast';

type Notify = (text: string, type?: ToastType, durationMs?: number) => void;

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** Estado e ações de conexão (USB/BLE) usados pelo cabeçalho do app. */
export function useMidiDevices(notify: Notify) {
  const [destinations, setDestinations] = useState<MidiDestination[]>([]);
  const [connected, setConnected] = useState<MidiDestination[]>([]);
  const [bleServerActive, setBleServerActive] = useState(false);
  const [scanningBle, setScanningBle] = useState(false);

  const refresh = useCallback(async (onError?: (error: unknown) => void) => {
    const list = await midiManager.getAvailableDestinations(onError);
    setDestinations(list);
    setConnected(midiManager.getConnectedDestinations());
    setBleServerActive(midiManager.getBleServerActive());
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleRefresh = () => {
      if (mounted) void refresh();
    };

    const handleDisconnect = (lost: MidiDestination, reason?: DisconnectReason) => {
      if (!mounted) return;
      if (reason === 'manual') {
        void refresh();
        return;
      }
      if (reason === 'reconnecting') {
        notify(tr('Reconectando a "{name}"...', { name: lost.displayName }), 'info', 2000);
        return;
      }
      void refresh();
      if (reason === 'failed') {
        notify(tr('Falha ao reconectar a "{name}".', { name: lost.displayName }), 'error', 4000);
      } else {
        notify(tr('Destino "{name}" desconectado.', { name: lost.displayName }), 'warn', 4000);
      }
    };

    midiManager.setCallbacks(handleRefresh, handleDisconnect);

    void (async () => {
      try {
        await midiManager.initWebMidi();
      } catch (error) {
        console.warn('MIDI nativo indisponível:', error);
      }
      await midiManager.isBleServerRunning();
      if (mounted) void refresh();
    })();

    return () => {
      mounted = false;
      midiManager.clearCallbacks();
    };
  }, [refresh, notify]);

  const toggleConnect = useCallback(
    async (dest: MidiDestination) => {
      const isConnected = midiManager.getConnectedDestinations().some((d) => d.id === dest.id);

      if (isConnected) {
        try {
          await midiManager.disconnectOutput(dest.id);
          notify(tr('Desconectado: {name}', { name: dest.displayName }), 'info', 2500);
        } catch (error) {
          notify(tr('Erro ao desconectar: {message}', { message: errorMessage(error, tr('Erro desconhecido')) }), 'error', 4000);
        }
      } else {
        try {
          await midiManager.connectOutput(dest);
          notify(tr('Conectado a: {name}', { name: dest.displayName }), 'success', 2500);
        } catch (error) {
          notify(tr('Erro ao conectar: {message}', { message: errorMessage(error, tr('Erro desconhecido')) }), 'error', 4000);
        }
      }

      try {
        await refresh();
      } catch {
        // Silencioso: a ação principal (conectar/desconectar) já deu feedback.
      }
    },
    [notify, refresh],
  );

  const disconnectAll = useCallback(async () => {
    try {
      for (const dest of midiManager.getConnectedDestinations()) {
        await midiManager.disconnectOutput(dest.id);
      }
      if (midiManager.getBleServerActive()) await midiManager.stopBleServer();
      notify(tr('Todos os dispositivos desconectados.'), 'info', 2500);
    } catch (error) {
      notify(tr('Erro ao desconectar: {message}', { message: errorMessage(error, tr('Erro desconhecido')) }), 'error', 3500);
    } finally {
      try {
        await refresh();
      } catch {
        // Silencioso, mesmo motivo.
      }
    }
  }, [notify, refresh]);

  const scanBle = useCallback(async (): Promise<number> => {
    setScanningBle(true);
    try {
      const found = await midiManager.scanBleDevice();
      await refresh();
      notify(
        found.length === 0
          ? tr('Nenhum dispositivo BLE MIDI encontrado.')
          : tr('{count} dispositivo(s) BLE MIDI encontrado(s).', { count: found.length }),
        found.length === 0 ? 'info' : 'success',
        3000,
      );
      return found.length;
    } catch (error) {
      notify(tr('Erro BLE: {message}', { message: errorMessage(error, tr('Falha na busca')) }), 'error', 3500);
      return 0;
    } finally {
      setScanningBle(false);
    }
  }, [notify, refresh]);

  const startBleServer = useCallback(async () => {
    try {
      const active = await midiManager.startBleServer();
      setBleServerActive(active);
      if (active) notify(tr('Modo BLE MIDI visível ativado.'), 'success', 4500);
    } catch (error) {
      setBleServerActive(false);
      notify(tr('Erro ao ativar BLE MIDI: {message}', { message: errorMessage(error, tr('Falha desconhecida')) }), 'error', 4500);
    }
  }, [notify]);

  return { destinations, connected, bleServerActive, scanningBle, refresh, toggleConnect, disconnectAll, scanBle, startBleServer };
}
