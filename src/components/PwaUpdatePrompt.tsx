/**
 * PwaUpdatePrompt — banner de atualização + confirmação de "pronto offline".
 *
 * 🔗 Relacionamentos:
 * - Renderizado por: `App.tsx` (no nível raiz, antes de `<main>`).
 * - Consome: `virtual:pwa-register/react` (fornecido por `vite-plugin-pwa`).
 * - Consome: `Capacitor.isNativePlatform()` — pula o SW no app nativo
 *   (Capacitor empacota os assets; SW é inútil e pode falhar silenciosamente no iOS).
 * - Alimenta o fluxo do `registerType: 'prompt'` do `vite.config.ts`:
 *   sem este componente, o app NÃO avisa o usuário de novas versões.
 *
 * 💡 Comportamento:
 * - No primeiro carregamento com sucesso do cache: mostra "App pronto para uso offline"
 *   por alguns segundos.
 * - Quando uma nova versão do SW está instalada e esperando: mostra banner
 *   "Nova versão disponível" com botão "Atualizar" (recarrega a página).
 * - O usuário pode dispensar (X) e continuar tocando com a versão atual.
 */
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Capacitor } from '@capacitor/core';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { tr } from '../i18n';

export function PwaUpdatePrompt() {
  // No Android/iOS via Capacitor, os assets já estão empacotados.
  // O SW só faz sentido no PWA (browser).
  if (Capacitor.isNativePlatform()) return null;
  return <PwaUpdatePromptWeb />;
}

function PwaUpdatePromptWeb() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Verifica nova versão a cada 1h. Sem isso, o usuário que mantém
      // a PWA aberta por dias nunca veria o banner de update.
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      // Falha silenciosa em devtools/ambiente sem SW — não quebra a UI.
      console.warn('[PWA] register error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[300] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-3 shadow-2xl">
        {offlineReady && !needRefresh && (
          <>
            <WifiOff size={20} className="shrink-0 text-[var(--nexus-success)]" />
            <span className="min-w-0 flex-1 text-sm font-medium text-[var(--text-main)]">
              {tr('App pronto para uso offline.')}
            </span>
            <button
              type="button"
              aria-label={tr('Fechar')}
              onClick={close}
              className="shrink-0 opacity-70 transition hover:opacity-100"
            >
              <X size={16} />
            </button>
          </>
        )}

        {needRefresh && (
          <>
            <RefreshCw size={20} className="shrink-0 text-[var(--nexus-primary)]" />
            <span className="min-w-0 flex-1 text-sm font-medium text-[var(--text-main)]">
              {tr('Nova versão disponível.')}
            </span>
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500"
            >
              {tr('Atualizar')}
            </button>
            <button
              type="button"
              aria-label={tr('Depois')}
              onClick={close}
              className="shrink-0 opacity-70 transition hover:opacity-100"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
