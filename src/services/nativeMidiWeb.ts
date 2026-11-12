import { WebPlugin, type ListenerCallback, type PluginListenerHandle } from '@capacitor/core';
import type {
  NativeBleDevice,
  NativeBleServerStatus,
  NativeMidiConnection,
  NativeMidiDevice,
  NativeMidiMessageEvent,
  NativeMidiPlugin,
} from './nativeMidi';

/**
 * Fallback web do plugin NativeMidi quando rodando no navegador (fora do Android/Capacitor nativo).
 * Permite inicializar listeners, listar o Teclado Virtual e usar o sintetizador SoundFont sem erros.
 */
export class NativeMidiWeb extends WebPlugin implements NativeMidiPlugin {
  async initialize(): Promise<void> {}

  async getDevices(): Promise<{ devices: NativeMidiDevice[] }> {
    return { devices: [] };
  }

  async connect(options: { id: string; port?: number; portIndex?: number }): Promise<NativeMidiConnection> {
    return { id: options.id, name: options.id, port: options.port ?? options.portIndex ?? 0 };
  }

  async connectOutput(options: { id: string; port?: number; portIndex?: number }): Promise<NativeMidiConnection> {
    return { id: options.id, name: options.id, port: options.port ?? options.portIndex ?? 0 };
  }

  async connectInput(options: {
    id: string;
    port?: number;
    portIndex?: number;
    address?: string;
  }): Promise<NativeMidiConnection> {
    return { id: options.id, name: options.id, port: options.port ?? options.portIndex ?? 0 };
  }

  async disconnect(): Promise<void> {}

  async disconnectOutput(): Promise<void> {}

  async disconnectInput(): Promise<void> {}

  async send(): Promise<void> {}

  async sendTo(): Promise<void> {}

  async scanBleDevices(): Promise<{ devices: NativeBleDevice[] }> {
    return { devices: [] };
  }

  async stopBleScan(): Promise<void> {}

  async connectBleMidi(): Promise<{
    address: string;
    name: string;
    outputConnected: boolean;
    inputConnected: boolean;
  }> {
    throw this.unavailable('Bluetooth LE MIDI não está disponível na versão Web.');
  }

  async startBleServer(): Promise<NativeBleServerStatus> {
    throw this.unavailable('Servidor Bluetooth LE MIDI não está disponível na versão Web.');
  }

  async stopBleServer(): Promise<NativeBleServerStatus> {
    return { active: false };
  }

  async isBleServerRunning(): Promise<NativeBleServerStatus> {
    return { active: false };
  }

  async fecharApp(): Promise<void> {
    if (typeof window !== 'undefined') window.close();
  }

  override addListener(
    eventName: 'midiMessage',
    listenerFunc: (data: NativeMidiMessageEvent) => void,
  ): Promise<PluginListenerHandle>;
  override addListener(eventName: 'devicesChanged', listenerFunc: () => void): Promise<PluginListenerHandle>;
  override addListener(
    eventName: 'bleServerChanged',
    listenerFunc: (status: NativeBleServerStatus) => void,
  ): Promise<PluginListenerHandle>;
  override addListener(eventName: string, listenerFunc: (...args: never[]) => void): Promise<PluginListenerHandle> {
    return super.addListener(eventName, listenerFunc as unknown as ListenerCallback);
  }
}
