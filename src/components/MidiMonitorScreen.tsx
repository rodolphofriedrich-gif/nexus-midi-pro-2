import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { tr } from '../i18n';
import { midiManager } from '../services/midiService';
import type { MidiLogEntry } from '../types/midi';
import { clearLatencyTraceEvents, getLatencyCaptureStatus, getLatencyTraceEvents, setLatencyCaptureEnabled } from '../services/latencyDiagnostics';
import { synthService } from '../services/synthService';

const TYPE_COLORS: Partial<Record<MidiLogEntry['type'], string>> = {
  'Note On': 'text-[var(--nexus-accent)]',
  'Note Off': 'text-[var(--text-muted)]',
  'Control Change': 'text-[var(--nexus-primary)]',
  'Program Change': 'text-[var(--nexus-primary)]',
  'Pitch Bend': 'text-[var(--nexus-primary)]',
  'Channel Pressure': 'text-amber-400',
  'Poly Aftertouch': 'text-amber-400',
  System: 'text-purple-400',
};

interface Props {
  maxVisible?: number;
  filter: 'all' | 'RX' | 'TX';
  paused: boolean;
}

/**
 * Throttle de renders do Monitor.
 *
 * Em vez de re-renderizar a cada mensagem (pitch bend = ~100 msgs/s), só
 * notifica o React 1x por frame (~60 fps) via requestAnimationFrame.
 *
 * Funcionamento:
 *   - `midiManager.subscribeLog` dispara a cada pushLog (síncrono, mantém
 *     os 188 testes de midiCore.ts intactos).
 *   - Aqui, o primeiro disparo do frame agenda um rAF. Disparos subsequentes
 *     no mesmo frame são descartados (rafId !== null).
 *   - No rAF, atualizamos `committedLog` (referência estável que o React vê)
 *     e chamamos `pendingNotify` — o callback do useSyncExternalStore.
 *
 * Estado de módulo (fora do componente) porque o Monitor é a única tela que
 * assina o log do midiManager, e useSyncExternalStore exige subscribe estável.
 */
let committedLog: readonly MidiLogEntry[] | null = null;
let pendingNotify: (() => void) | null = null;
let rafId: number | null = null;

function commitAndNotify(): void {
  rafId = null;
  committedLog = midiManager.getLog();
  const fn = pendingNotify;
  pendingNotify = null;
  fn?.();
}

function subscribeThrottled(cb: () => void): () => void {
  pendingNotify = cb;
  // A tela é desmontada ao sair da aba MIDI. Sincroniza sempre o cache na
  // remontagem para incluir mensagens recebidas enquanto o Monitor estava fechado.
  const latestLog = midiManager.getLog();
  const snapshotChanged = committedLog !== latestLog;
  committedLog = latestLog;
  const unsubscribe = midiManager.subscribeLog(() => {
    if (rafId === null) rafId = requestAnimationFrame(commitAndNotify);
  });
  if (snapshotChanged) cb();
  return () => {
    unsubscribe();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingNotify = null;
  };
}

function getSnapshotThrottled(): readonly MidiLogEntry[] {
  // Fallback para o caso de getSnapshot ser chamado antes do subscribe
  // (React pode chamar getSnapshot no render inicial antes de assinar).
  return committedLog ?? midiManager.getLog();
}

export function MidiMonitorScreen({ maxVisible = 150, filter, paused }: Props) {
  const log = useSyncExternalStore(subscribeThrottled, getSnapshotThrottled, getSnapshotThrottled);
  const [captureEnabled, setCaptureEnabled] = useState(getLatencyCaptureStatus());
  const [fxBypass, setFxBypass] = useState(synthService.getFxBypass());
  const [diagnosticSnapshot, setDiagnosticSnapshot] = useState(() => ({
    events: getLatencyTraceEvents(),
    audio: synthService.getAudioDiagnostics(),
  }));
  const [copyStatus, setCopyStatus] = useState('');

  const refreshDiagnostics = () => {
    setDiagnosticSnapshot({
      events: getLatencyTraceEvents(),
      audio: synthService.getAudioDiagnostics(),
    });
  };

  const toggleFxBypass = () => {
    const next = !fxBypass;
    synthService.setFxBypass(next);
    setFxBypass(next);
    refreshDiagnostics();
  };

  const toggleCapture = () => {
    const next = !captureEnabled;
    setLatencyCaptureEnabled(next);
    setCaptureEnabled(next);
    refreshDiagnostics();
  };

  const copyDiagnostics = async () => {
    const logEntries = midiManager.getLog();
    const report = {
      capturedAt: new Date().toISOString(),
      audio: synthService.getAudioDiagnostics(),
      fxBypass: synthService.getFxBypass(),
      events: getLatencyTraceEvents(),
      monitor: {
        totalEntries: logEntries.length,
        txEntries: logEntries.filter((entry) => entry.direction === 'TX').length,
        rxEntries: logEntries.filter((entry) => entry.direction === 'RX').length,
        latest: logEntries[0] ?? null,
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopyStatus('Relatório copiado.');
    } catch {
      setCopyStatus('Não foi possível copiar. Atualize e envie uma captura desta tela.');
    }
  };

  // Captura o log no momento em que `paused` vira true, para congelar a UI.
  // Usa useRef (não useMemo) porque a dep `log` mudaria a cada frame e
  // recapturaria o valor — o `prevPaused` guard garante que só capturamos
  // na transição false → true, preservando a semântica de "pausa".
  const frozenRef = useRef<readonly MidiLogEntry[]>(log);
  const prevPausedRef = useRef(paused);
  if (prevPausedRef.current !== paused && paused) {
    frozenRef.current = log;
  }
  prevPausedRef.current = paused;

  const source = paused ? frozenRef.current : log;
  const visible = useMemo(
    () => (filter === 'all' ? source : source.filter((e) => e.direction === filter)).slice(0, maxVisible),
    [source, filter, maxVisible],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)]">
      <section className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-panel)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--nexus-primary)]">Diagnóstico de latência</p>
            <p className="text-[11px] text-[var(--text-muted)]">Captura toque → MIDI → SpessaSynth; bypass testa delay/EQ/compressor master</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={toggleFxBypass} className="rounded-lg border border-[var(--nexus-primary)] px-3 py-2 text-xs font-bold text-[var(--nexus-primary)]">
              FX master: {fxBypass ? 'BYPASS' : 'normal'}
            </button>
            <button type="button" onClick={toggleCapture} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold text-[var(--text-main)]">
              {captureEnabled ? 'Parar captura' : 'Iniciar captura'}
            </button>
            <button type="button" onClick={refreshDiagnostics} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-main)]">Atualizar</button>
            <button type="button" onClick={() => { clearLatencyTraceEvents(); refreshDiagnostics(); }} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-main)]">Limpar</button>
            <button type="button" onClick={() => void copyDiagnostics()} className="rounded-lg border border-[var(--nexus-primary)] px-3 py-2 text-xs font-bold text-[var(--nexus-primary)]">Copiar relatório</button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[var(--text-muted)]">
          <span>Captura: {captureEnabled ? 'ATIVA' : 'parada'}</span>
          <span>Cadeia FX: {fxBypass ? 'bypass' : 'normal'}</span>
          <span>Eventos: {diagnosticSnapshot.events.length}</span>
          <span>AudioContext: {diagnosticSnapshot.audio?.state ?? 'indisponível'}</span>
          <span>Sample rate: {diagnosticSnapshot.audio?.sampleRate ?? '—'} Hz</span>
          <span>Base: {diagnosticSnapshot.audio?.baseLatencyMs ?? '—'} ms</span>
          <span>Saída: {diagnosticSnapshot.audio?.outputLatencyMs ?? '—'} ms</span>
        </div>
        {copyStatus && <p className="mt-1 text-[11px] text-[var(--nexus-accent)]">{copyStatus}</p>}
        {diagnosticSnapshot.events.length > 0 && (
          <div className="mt-2 max-h-28 overflow-y-auto rounded-lg border border-[var(--border-color)]">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="sticky top-0 bg-[var(--bg-app)] text-[var(--text-muted)]">
                <tr><th className="px-2 py-1">ID / origem</th><th className="px-2 py-1">Etapa</th><th className="px-2 py-1">Desde início</th></tr>
              </thead>
              <tbody>
                {diagnosticSnapshot.events.slice(-12).reverse().map((event, index) => (
                  <tr key={event.id + '-' + event.stage + '-' + index} className="border-t border-[var(--border-color)]">
                    <td className="px-2 py-1">{event.id} · {event.source} · {event.note}</td>
                    <td className="px-2 py-1">{event.stage}</td>
                    <td className="px-2 py-1">{event.elapsedMs.toFixed(3)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-xs text-[var(--text-muted)]">
            {tr('Nenhuma mensagem ainda. Toque no teclado ou envie MIDI de um dispositivo.')}
          </div>
        ) : (
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="sticky top-0 bg-[var(--bg-panel)] text-[10px] uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2">{tr('Hora')}</th>
                <th className="px-2 py-2">{tr('Dir.')}</th>
                <th className="px-2 py-2">{tr('Tipo')}</th>
                <th className="px-2 py-2">CH</th>
                <th className="px-2 py-2">{tr('Nota')}</th>
                <th className="px-2 py-2">Vel/Val</th>
                <th className="hidden px-2 py-2 sm:table-cell">Hex</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-panel)]/60">
                  <td className="px-3 py-1.5 text-[var(--text-muted)]">{entry.timestamp}</td>
                  <td className={`px-2 py-1.5 font-bold ${entry.direction === 'TX' ? 'text-[var(--nexus-accent)]' : 'text-emerald-400'}`}>{entry.direction}</td>
                  <td className={`px-2 py-1.5 ${TYPE_COLORS[entry.type] ?? 'text-[var(--text-main)]'}`}>{entry.type}</td>
                  <td className="px-2 py-1.5 text-[var(--text-main)]">{entry.channel || '-'}</td>
                  <td className="px-2 py-1.5 text-[var(--text-main)]">{entry.noteName}</td>
                  <td className="px-2 py-1.5 text-[var(--text-main)]">{entry.velocity}</td>
                  <td className="hidden px-2 py-1.5 text-[var(--text-muted)] sm:table-cell">{entry.bytesHex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
