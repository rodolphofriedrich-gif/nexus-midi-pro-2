import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // 'prompt' = SW espera a próxima visita pra ativar. Evita reload
        // no meio de uma performance (perda de estado MIDI). A UI de update
        // mora em <PwaUpdatePrompt /> (usa useRegisterSW daqui).
        registerType: 'prompt',
        // null = NÃO injeta script automático. Deixamos o React registrar
        // via `virtual:pwa-register/react` para termos onNeedRefresh/onOfflineReady.
        injectRegister: null,
        includeAssets: ['favicon.ico', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
        manifest: {
          // `id` estável: sem isso o Chrome pode gerar um ID novo a cada install
          // e o app perde a identidade (permissões, storage persist, etc).
          id: '/',
          name: 'NexusMIDI Pro',
          short_name: 'NexusMIDI',
          description:
            'Hub MIDI e sintetizador SoundFont para Android e Web (USB, Bluetooth LE, roteador, gravador e arpejador).',
          lang: 'pt-BR',
          // Alinhado com <meta name="theme-color" content="#0c1019" /> no index.html.
          // Se mudar aqui, mude lá também — a splash e a barra de status leem daqui.
          theme_color: '#0c1019',
          background_color: '#0c1019',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          categories: ['music', 'utilities'],
          // false para o Chrome não sugerir a versão da Play Store em vez da PWA.
          prefer_related_applications: false,
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // `.webmanifest` incluído porque o manifest é um arquivo servido
          // à parte. `.webp`/`.woff`/`.ttf`/`.otf` para assets visuais/fonts.
          // `.json` para configs estáticas que o SpessaSynth possa servir.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,webp,woff,woff2,ttf,otf,wasm,json}'],
          // SpessaSynth empacota wasm grande — precisa de folga no limite.
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
        },
        devOptions: {
          // SW desligado em dev para não interferir no HMR.
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
