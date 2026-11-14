import { useEffect, useState } from 'react';
import { audioDiagnostics, type AudioRuntimeSnapshot } from '../services/audio/audioDiagnostics';

export function AudioDiagnosticsPanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(audioDiagnostics.isEnabled());
  const [runtime, setRuntime] = useState<AudioRuntimeSnapshot>(audioDiagnostics.getRuntimeSnapshot());
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const snapshot = audioDiagnostics.export();
      setRuntime(snapshot.runtime);
      setEventCount(snapshot.eventCount);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  const exportJson = () => {
    const payload = audioDiagnostics.export();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nexus-audio-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-3 right-3 z-[10000]">
      {open && (
        <section className="mb-2 w-[min(92vw,390px)] rounded-xl border border-cyan-400/40 bg-slate-950 p-3 text-xs text-slate-100 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm">Diagnóstico de áudio</strong>
            <button type="button" onClick={() => setOpen(false)} className="rounded px-2 py-1 text-slate-300">Fechar</button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="rounded bg-slate-800 p-2">
              <div className="text-slate-400">Eventos capturados</div>
              <strong className="text-lg tabular-nums">{eventCount}</strong>
            </div>
            <div className="rounded bg-slate-800 p-2">
              <div className="text-slate-400">Captura</div>
              <strong>{enabled ? 'Ativa' : 'Pausada'}</strong>
            </div>
          </div>
          <div className="max-h-36 overflow-auto rounded bg-slate-900 p-2 font-mono leading-5">
            <div>Contexto: {String(runtime.context?.state ?? 'indisponível')}</div>
            <div>Sample rate: {String(runtime.context?.sampleRate ?? '—')} Hz</div>
            <div>Base latency: {String(runtime.context?.baseLatency ?? '—')} s</div>
            <div>Output latency: {String(runtime.context?.outputLatency ?? '—')} s</div>
            <div>Audio time: {String(runtime.context?.currentTime ?? '—')} s</div>
            <div>Vozes: {String(runtime.synthesizer?.voiceCount ?? '—')}</div>
            <div>Voice cap: {String(runtime.synthesizer?.voiceCap ?? 'não exposto')}</div>
          </div>
          <p className="my-2 text-slate-400">A captura mede etapas JavaScript e o envio ao sintetizador. Não mede diretamente o instante acústico no alto-falante nem o processamento interno de cada bloco do Worklet.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { const next = !enabled; setEnabled(next); audioDiagnostics.setEnabled(next); }} className="rounded bg-slate-700 px-3 py-2">{enabled ? 'Pausar captura' : 'Retomar captura'}</button>
            <button type="button" onClick={exportJson} className="rounded bg-cyan-700 px-3 py-2 font-semibold">Exportar JSON</button>
            <button type="button" onClick={() => { audioDiagnostics.clear(); setEventCount(0); }} className="rounded bg-slate-700 px-3 py-2">Limpar</button>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full border border-cyan-400/50 bg-slate-950 px-4 py-2 text-xs font-semibold text-cyan-200 shadow-lg">
        {open ? 'Ocultar diagnóstico' : 'Diagnóstico de áudio'}
      </button>
    </div>
  );
}
