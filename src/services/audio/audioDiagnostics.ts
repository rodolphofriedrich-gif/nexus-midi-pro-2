export interface AudioDiagnosticEvent {
  sequence: number;
  traceId: number | null;
  stage: string;
  kind?: 'noteOn' | 'noteOff';
  source?: string;
  note?: number;
  velocity?: number;
  performanceTimeMs: number;
  wallTime: string;
  detail?: Record<string, unknown>;
}

export interface AudioRuntimeSnapshot {
  capturedAt: string;
  context: Record<string, unknown> | null;
  synthesizer: Record<string, unknown> | null;
}

type RuntimeReader = () => AudioRuntimeSnapshot;
const MAX_EVENTS = 5000;

class AudioDiagnostics {
  private enabled = true;
  private sequence = 0;
  private traceSequence = 0;
  private activeTrace: { id: number; kind: 'noteOn' | 'noteOff'; source: string; note: number; velocity?: number } | null = null;
  private events: AudioDiagnosticEvent[] = [];
  private runtimeReader: RuntimeReader | null = null;

  setEnabled(enabled: boolean): void { this.enabled = enabled; }
  isEnabled(): boolean { return this.enabled; }
  setRuntimeReader(reader: RuntimeReader | null): void { this.runtimeReader = reader; }

  beginTrace(kind: 'noteOn' | 'noteOff', source: string, note: number, velocity?: number): number | null {
    if (!this.enabled) return null;
    const trace = { id: ++this.traceSequence, kind, source, note, velocity };
    this.activeTrace = trace;
    this.mark(kind === 'noteOn' ? 'ui.handler.enter' : 'ui.handler.noteOff.enter');
    return trace.id;
  }

  endTrace(traceId: number | null): void {
    if (traceId === null || this.activeTrace?.id !== traceId) return;
    this.mark(this.activeTrace.kind === 'noteOn' ? 'ui.handler.return' : 'ui.handler.noteOff.return');
    this.activeTrace = null;
  }

  mark(stage: string, detail?: Record<string, unknown>): void {
    if (!this.enabled || !this.activeTrace) return;
    const performanceTimeMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.events.push({
      sequence: ++this.sequence,
      traceId: this.activeTrace.id,
      stage,
      kind: this.activeTrace.kind,
      source: this.activeTrace.source,
      note: this.activeTrace.note,
      velocity: this.activeTrace.velocity,
      performanceTimeMs,
      wallTime: new Date().toISOString(),
      ...(detail ? { detail } : {}),
    });
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS);
  }

  getRuntimeSnapshot(): AudioRuntimeSnapshot {
    try {
      return this.runtimeReader?.() ?? { capturedAt: new Date().toISOString(), context: null, synthesizer: null };
    } catch (error) {
      return { capturedAt: new Date().toISOString(), context: null, synthesizer: { snapshotError: String(error) } };
    }
  }

  clear(): void { this.events = []; this.sequence = 0; }

  export(): { schemaVersion: number; exportedAt: string; eventCount: number; runtime: AudioRuntimeSnapshot; events: AudioDiagnosticEvent[] } {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      eventCount: this.events.length,
      runtime: this.getRuntimeSnapshot(),
      events: this.events.slice(),
    };
  }
}

export const audioDiagnostics = new AudioDiagnostics();
