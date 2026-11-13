/**
 * Contador de notas ativas isolado da árvore principal do React.
 * Atualizações de teclas não devem renderizar novamente o App inteiro.
 */
let activeNotes = 0;
const listeners = new Set<() => void>();

export function setActiveNotesCount(count: number): void {
  const next = Math.max(0, Math.trunc(count));
  if (next === activeNotes) return;
  activeNotes = next;
  listeners.forEach((listener) => listener());
}

export const getActiveNotesCount = (): number => activeNotes;

export function subscribeActiveNotesCount(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
