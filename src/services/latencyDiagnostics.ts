export interface LatencyTraceEvent {
  id: number;
  stage: string;
  source: string;
  note: number;
  channel?: number;
  timeMs: number;
  elapsedMs: number;
}

export interface AudioContextDiagnostics {
  state: string;
  sampleRate: number;
  currentTime: number;
  baseLatencyMs: number | null;
  outputLatencyMs: number | null;
  outputTimestamp: { contextTime: number; performanceTime: number } | null;
  workletAvailable: boolean;
}

interface ActiveTrace {
  id: number;
  source: string;
  note: number;
  channel?: number;
  startedAt: number;
}

const MAX_EVENTS = 500;
let captureEnabled = false;
let nextId = 1;
let activeTrace: ActiveTrace | null = null;
const events: LatencyTraceEvent[] = [];

function clock(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function setLatencyCaptureEnabled(enabled: boolean): void {
  captureEnabled = enabled;
  if (!enabled) activeTrace = null;
}

export function isLatencyCaptureEnabled(): boolean {
  return captureEnabled;
}

export function markLatencyStage(stage: string, channel?: number): void {
  if (!captureEnabled || !activeTrace) return;
  const timeMs = clock();
  events.push({
    id: activeTrace.id,
    stage,
    source: activeTrace.source,
    note: activeTrace.note,
    ...(channel === undefined ? {} : { channel }),
    timeMs: Number(timeMs.toFixed(3)),
    elapsedMs: Number((timeMs - activeTrace.startedAt).toFixed(3)),
  });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

/** Mantém o contexto de diagnóstico apenas durante o caminho síncrono do Note On/Off. */
export function withLatencyTrace<T>(
  source: string,
  note: number,
  channel: number,
  callback: () => T,
): T {
  if (!captureEnabled) return callback();

  const previous = activeTrace;
  const startedAt = clock();
  activeTrace = { id: nextId++, source, note, channel, startedAt };
  markLatencyStage('app.handler.start', channel);
  try {
    return callback();
  } finally {
    markLatencyStage('app.handler.return', channel);
    activeTrace = previous;
  }
}

export function getLatencyTraceEvents(): LatencyTraceEvent[] {
  return events.slice();
}

export function clearLatencyTraceEvents(): void {
  events.length = 0;
}

export function getLatencyCaptureStatus(): boolean {
  return captureEnabled;
}
