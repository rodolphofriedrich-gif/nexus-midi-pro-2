import { afterEach, describe, expect, it } from 'vitest';
import {
  clearLatencyTraceEvents,
  getLatencyTraceEvents,
  markLatencyStage,
  setLatencyCaptureEnabled,
  withLatencyTrace,
} from './latencyDiagnostics';

afterEach(() => {
  setLatencyCaptureEnabled(false);
  clearLatencyTraceEvents();
});

describe('latencyDiagnostics', () => {
  it('records ordered stages for one synchronous note path', () => {
    setLatencyCaptureEnabled(true);
    withLatencyTrace('keyboard', 60, 1, () => {
      // Simula as chamadas síncronas atravessando o pipeline.
      markLatencyStage('performance.noteOn', 1);
      markLatencyStage('midi.routeMessage', 1);
      markLatencyStage('spessa.worklet.noteOn.call', 1);
    });

    const events = getLatencyTraceEvents();
    expect(events.map((event) => event.stage)).toEqual([
      'app.handler.start',
      'performance.noteOn',
      'midi.routeMessage',
      'spessa.worklet.noteOn.call',
      'app.handler.return',
    ]);
    expect(events.every((event) => event.source === 'keyboard' && event.note === 60)).toBe(true);
    expect(events.every((event) => event.elapsedMs >= 0)).toBe(true);
  });

  it('does not record when capture is disabled', () => {
    withLatencyTrace('pad-1', 36, 10, () => undefined);
    expect(getLatencyTraceEvents()).toEqual([]);
  });
});
