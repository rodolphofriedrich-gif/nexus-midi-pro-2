/**
 * StatusToast — toast global de mensagens (info/warn/error/success).
 *
 * 🔗 Relacionamentos:
 * - Renderizado por: `App.tsx`, alimentado por `useToast` (`hooks/useToast.ts`).
 * - Todos os `showMessage`/`notify` do app terminam aqui
 *   (`useAppHandlers.ts`, `useMidiDevices.ts`, `handleRefreshRouter`, etc.).
 *
 * 🎨 Correção aplicada: as cores agora se adaptam ao tema (claro no claro,
 * escuro no escuro) via `dark:` do Tailwind.
 */
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';
import { tr } from '../i18n';

const STYLES: Record<Toast['type'], string> = {
  success: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:bg-emerald-900/90 dark:text-emerald-100 dark:border-emerald-700',
  warn:    'bg-amber-500/10 text-amber-600 border border-amber-500/30 dark:bg-amber-900/90 dark:text-amber-100 dark:border-amber-700',
  error:   'bg-red-500/10 text-red-600 border border-red-500/30 dark:bg-red-900/90 dark:text-red-100 dark:border-red-700',
  info:    'bg-blue-500/10 text-blue-600 border border-blue-500/30 dark:bg-blue-900/90 dark:text-blue-100 dark:border-blue-700',
};

export function StatusToast({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="nexus-toast-container pointer-events-none fixed bottom-5 left-0 right-0 z-[150] flex justify-center px-4">
      <div
        role="status"
        className={`nexus-toast pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 shadow-xl ${STYLES[toast.type]}`}
      >
        <span className="shrink-0">
          {toast.type === 'success' ? <CheckCircle2 size={19} /> : toast.type === 'info' ? <Info size={19} /> : <AlertTriangle size={19} />}
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium">{toast.text}</span>
        <button type="button" aria-label={tr('Fechar')} onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
