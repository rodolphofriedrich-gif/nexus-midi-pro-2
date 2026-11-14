export interface LatencyTraceEvent {
  id: number;
  stage: string;
  source: string;
  note: number;
  channel?: number;
  timeMs: number;
  elapsedMs: number;
}

export interface SynthControllerDiagnosticEvent {
  timeMs: number;
  channel: number;
  controller: number;
  value: number;
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

interface PendingProcessorNote extends ActiveTrace {}

const MAX_EVENTS = 500;
const MAX_PENDING_PROCESSOR_NOTES = 128;
const MAX_CONTROLLER_EVENTS = 100;
let captureEnabled = false;
let nextId = 1;
let activeTrace: ActiveTrace | null = null;
const events: LatencyTraceEvent[] = [];
const pendingProcessorNotes: PendingProcessorNote[] = [];
const controllerEvents: SynthControllerDiagnosticEvent[] = [];

function clock(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function setLatencyCaptureEnabled(enabled: boolean): void {
  captureEnabled = enabled;
  if (!enabled) {
    activeTrace = null;
    pendingProcessorNotes.length = 0;
  }
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

/** Registra a nota enviada ao Worklet para correlacionar com a confirmação assíncrona do sintetizador. */
export function registerPendingProcessorNote(channel: number, note: number): void {
  if (!captureEnabled || !activeTrace) return;
  pendingProcessorNotes.push({
    ...activeTrace,
    channel,
    note,
  });
  if (pendingProcessorNotes.length > MAX_PENDING_PROCESSOR_NOTES) {
    pendingProcessorNotes.splice(0, pendingProcessorNotes.length - MAX_PENDING_PROCESSOR_NOTES);
  }
}

/**
 * O evento noteOn do SpessaSynth é emitido pelo processador e entregue ao eventHandler.
 * O tempo medido inclui a entrega assíncrona da mensagem ao thread principal; não é a saída física.
 */
export function markProcessorNoteOn(channel: number, note: number): void {
  if (!captureEnabled) return;
  const index = pendingProcessorNotes.findIndex((pending) => pending.channel === channel && pending.note === note);
  if (index < 0) return;
  const [pending] = pendingProcessorNotes.splice(index, 1);
  if (!pending) return;
  const timeMs = clock();
  events.push({
    id: pending.id,
    stage: 'spessa.worklet.processor.noteOn.event',
    source: pending.source,
    note: pending.note,
    channel: pending.channel,
    timeMs: Number(timeMs.toFixed(3)),
    elapsedMs: Number((timeMs - pending.startedAt).toFixed(3)),
  });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

/** Guarda alterações de CC1 recebidas pelo sintetizador, úteis para investigar modulação involuntária. */
export function recordSynthControllerEvent(channel: number, controller: number, value: number): void {
  if (!captureEnabled || controller !== 1) return;
  controllerEvents.push({
    timeMs: Number(clock().toFixed(3)),
    channel,
    controller,
    value,
  });
  if (controllerEvents.length > MAX_CONTROLLER_EVENTS) {
    controllerEvents.splice(0, controllerEvents.length - MAX_CONTROLLER_EVENTS);
  }
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

export function getSynthControllerDiagnosticEvents(): SynthControllerDiagnosticEvent[] {
  return controllerEvents.slice();
}

export function clearLatencyTraceEvents(): void {
  events.length = 0;
  pendingProcessorNotes.length = 0;
  controllerEvents.length = 0;
}

export function getLatencyCaptureStatus(): boolean {
  return captureEnabled;
}
