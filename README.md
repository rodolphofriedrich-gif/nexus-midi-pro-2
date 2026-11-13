# NexusMIDI Pro

**Hub MIDI e sintetizador SoundFont para Android e Web.**  
**MIDI hub and SoundFont synthesizer for Android and the Web.**

[![Build](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/actions/workflows/build.yml/badge.svg)](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

- [Português (Brasil)](#português-brasil)
- [English](#english)

---

# Português (Brasil)

## Sobre o projeto

O **NexusMIDI Pro** transforma celulares e tablets Android em uma estação musical com teclado e pads virtuais, sintetizador SoundFont, conexões MIDI e ferramentas de performance. Também oferece uma versão Web com os recursos compatíveis com o navegador.

O projeto é desenvolvido com React, TypeScript, Capacitor e SpessaSynth. A interface oferece Português (Brasil) e Inglês, além de temas claro, escuro e sistema.

## Funcionalidades

### Teclado, pads e performance
- Teclado virtual multitoque, com glissando, zoom e rolagem.
- 16 pads General MIDI distribuídos em quatro bancos (64 posições).
- Chord Pads para notas individuais, acordes e intervalos personalizados.
- Curva de velocity, escalas, acordes e arpejador.
- Metrônomo, Tap Tempo e MIDI Clock.
- Wake Lock para manter a tela ativa durante a execução.

### Sintetizador SoundFont
- Importação de arquivos SoundFont `.sf2` para uma biblioteca local.
- Leitura dos nomes, bancos e programas disponíveis nos arquivos importados.
- Suporte multitimbral de 16 canais MIDI, com controles por canal.
- Efeitos e controles de áudio, incluindo EQ, compressor, delay, reverb, chorus, envelope, filtro, vibrato, afinação e polifonia.

### Conectividade e ferramentas MIDI
- MIDI por USB (OTG) e Bluetooth LE MIDI no Android.
- Modo de dispositivo BLE MIDI visível para equipamentos e aplicativos compatíveis.
- Roteador MIDI com múltiplas entradas e saídas, filtros e transposição.
- Monitor de mensagens MIDI enviadas (TX) e recebidas (RX).
- Gravador MIDI com reprodução e exportação de arquivos `.mid`.
- MIDI Learn, presets de controles CC, MIDI Panic e Pitch Bend.

> **Compatibilidade:** recursos MIDI nativos USB e Bluetooth LE dependem do Android, das permissões do sistema e do hardware conectado. No navegador, a disponibilidade depende do navegador e das APIs suportadas.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React, TypeScript, Vite e Tailwind CSS |
| Áudio | [SpessaSynth](https://github.com/spessasus/SpessaSynth) e Web Audio |
| Aplicativo Android | Capacitor 8 e plugin nativo Java |
| Testes e qualidade | Vitest, Oxlint, Prettier e GitHub Actions |

## Requisitos

- Node.js **20.19 ou superior** para desenvolvimento, conforme `package.json`. O CI utiliza Node.js 22.
- npm compatível com a versão do Node.js.
- Para compilar e executar a versão Android: JDK 21 e Android SDK. O Android Studio é recomendado.

## Instalação e desenvolvimento

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2.git
cd nexus-midi-pro-2
npm ci
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite disponibiliza o endereço local indicado no terminal (por padrão, porta 3000).

### Compilar para Web

```bash
npm run build
```

### Preparar e compilar para Android

```bash
npm run cap:sync
cd android
./gradlew assembleDebug
```

No Windows PowerShell, use o wrapper correspondente:

```powershell
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
```

O APK de depuração é gerado em:

`android/app/build/outputs/apk/debug/app-debug.apk`

Também é possível executar `npm run android:debug` na raiz do projeto.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Compila a versão Web |
| `npm run build:android` | Compila os arquivos Web para o aplicativo Android |
| `npm run cap:sync` | Compila a versão Android e sincroniza o Capacitor |
| `npm run android:debug` | Gera o APK Android de depuração |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run lint` | Executa o Oxlint |
| `npm test` | Executa os testes automatizados |
| `npm run check` | Executa typecheck, lint e testes |
| `npm run format` | Formata os arquivos de código suportados |

## Integração contínua e releases

O workflow em `.github/workflows/build.yml` executa verificação de tipos, lint, testes e build Web em Pull Requests e nos pushes configurados. O job Android não é executado em Pull Requests; ele compila o APK de depuração nos pushes para as branches configuradas.

Para gerar um APK de teste desta branch enquanto o Pull Request está em revisão:

1. Abra [GitHub Actions](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/actions/workflows/build.yml).
2. Selecione o workflow **CI & Build APK - NexusMIDI Pro**.
3. Clique em **Run workflow** e escolha a branch `fix/sf2-restore-and-storage`.
4. Após a conclusão, abra a execução e baixe o artefato `NexusMIDI-Pro-debug-apk`.

Para publicar um Release Android assinado, o mantenedor precisa configurar no GitHub Actions os seguintes *Secrets*:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

O keystore e suas senhas devem ser mantidos em local seguro e nunca enviados ao repositório. Após configurar a assinatura, uma tag no formato `vX.Y.Z` aciona o workflow de Release, que pode publicar APK e AAB assinados. Sem a configuração de assinatura, o workflow pode publicar apenas o APK de depuração; esse APK não deve ser tratado como versão de produção assinada.

Acompanhe os builds em [GitHub Actions](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/actions).

## Estrutura do projeto

```text
src/
├── components/     Telas e componentes da interface
├── constants/      Constantes e tabelas MIDI
├── hooks/          Hooks React
├── i18n/           Idiomas e traduções
├── lib/            Lógica independente da interface
├── services/       Serviços MIDI, áudio, sintetizador e armazenamento
└── bootstrap.ts    Inicialização dos serviços
android/            Projeto nativo Android e plugin MIDI
.github/            Workflows e modelos de contribuição
```

## Testes

Execute:

```bash
npm test
```

Os testes automatizados cobrem módulos de lógica MIDI, ferramentas musicais, gravação e reprodução, roteamento, serviços, armazenamento, biblioteca SoundFont e internacionalização. A cobertura depende dos testes existentes no repositório; a execução em CI não substitui testes em aparelhos e equipamentos reais.

## SoundFonts e arquivos de áudio

Os arquivos `.sf2` não são fornecidos por este repositório. Importe somente arquivos que você tenha autorização para usar. O usuário é responsável por verificar os direitos autorais e os termos de distribuição dos SoundFonts utilizados.

## Como contribuir

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar alterações. São bem-vindos relatos de bugs, propostas de melhoria, documentação e Pull Requests.

- [Relatar um bug](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/issues/new?template=bug_report.md)
- [Sugerir uma funcionalidade](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/issues/new?template=feature_request.md)
- [Consultar o histórico de alterações](CHANGELOG.md)
- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Política de Segurança](SECURITY.md)

## Licença

O código original deste projeto é distribuído sob a licença **MIT**. O texto oficial está em [LICENSE](LICENSE); há uma [tradução informativa para Português (Brasil)](LICENSE-PT-BR.md). As bibliotecas de terceiros mantêm suas próprias licenças e avisos; consulte [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md), [NOTICE](NOTICE) e o [registro de origem dos recursos visuais](ASSET_CREDITS.md). No aplicativo, a seção **Configurações → Sobre o App → Ver licenças e créditos** abre os avisos locais incluídos no build.

A licença MIT não concede direitos sobre marcas, nomes, ícones, arquivos SoundFont ou outros conteúdos de terceiros que possam ser utilizados com o aplicativo.

---

# English

## About

**NexusMIDI Pro** turns Android phones and tablets into a music workstation featuring a virtual keyboard and pads, a SoundFont synthesizer, MIDI connectivity, and performance tools. A Web version is also available, with features supported by the browser.

The project is built with React, TypeScript, Capacitor, and SpessaSynth. The interface supports Brazilian Portuguese and English, as well as light, dark, and system themes.

## Features

### Keyboard, pads, and performance
- Multitouch virtual keyboard with glissando, zoom, and scrolling.
- 16 General MIDI pads across four banks (64 pad positions).
- Chord Pads for single notes, chords, and custom intervals.
- Velocity curves, scales, chords, and arpeggiator.
- Metronome, Tap Tempo, and MIDI Clock.
- Wake Lock to keep the screen awake during performance.

### SoundFont synthesizer
- Import `.sf2` SoundFont files into a local library.
- Read instrument names, banks, and programs from imported files.
- 16-channel multitimbral MIDI support, with per-channel controls.
- Audio effects and controls, including EQ, compressor, delay, reverb, chorus, envelope, filter, vibrato, tuning, and polyphony.

### MIDI connectivity and tools
- USB (OTG) MIDI and Bluetooth LE MIDI on Android.
- BLE MIDI peripheral mode for compatible devices and applications.
- MIDI router with multiple inputs and outputs, filters, and transposition.
- MIDI monitor for transmitted (TX) and received (RX) messages.
- MIDI recorder with playback and `.mid` file export.
- MIDI Learn, CC control presets, MIDI Panic, and Pitch Bend.

> **Compatibility:** Native USB and Bluetooth LE MIDI features depend on Android, system permissions, and connected hardware. Browser functionality depends on the browser and its supported APIs.

## Technology stack

| Layer | Technology |
| --- | --- |
| Interface | React, TypeScript, Vite, and Tailwind CSS |
| Audio | [SpessaSynth](https://github.com/spessasus/SpessaSynth) and Web Audio |
| Android application | Capacitor 8 and a custom Java plugin |
| Testing and quality | Vitest, Oxlint, Prettier, and GitHub Actions |

## Requirements

- Node.js **20.19 or later** for development, as specified in `package.json`. CI uses Node.js 22.
- npm compatible with the installed Node.js version.
- To build and run the Android app: JDK 21 and Android SDK. Android Studio is recommended.

## Installation and development

Clone the repository and install dependencies:

```bash
git clone https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2.git
cd nexus-midi-pro-2
npm ci
```

Start the development server:

```bash
npm run dev
```

Vite prints the local development URL in the terminal (port 3000 by default).

### Build for the Web

```bash
npm run build
```

### Prepare and build for Android

```bash
npm run cap:sync
cd android
./gradlew assembleDebug
```

On Windows PowerShell, use the Windows wrapper:

```powershell
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
```

The debug APK is generated at:

`android/app/build/outputs/apk/debug/app-debug.apk`

You can also run `npm run android:debug` from the project root.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the Web version |
| `npm run build:android` | Builds Web assets for the Android application |
| `npm run cap:sync` | Builds Android assets and synchronizes Capacitor |
| `npm run android:debug` | Builds the Android debug APK |
| `npm run typecheck` | Runs the TypeScript type check |
| `npm run lint` | Runs Oxlint |
| `npm test` | Runs automated tests |
| `npm run check` | Runs typecheck, lint, and tests |
| `npm run format` | Formats supported source files |

## Continuous integration and releases

The workflow at `.github/workflows/build.yml` runs type checking, linting, tests, and the Web build on Pull Requests and configured pushes. The Android job does not run on Pull Requests; it builds a debug APK on pushes to the configured branches.

To build a test APK from this branch while the Pull Request is under review:

1. Open [GitHub Actions](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/actions/workflows/build.yml).
2. Select the **CI & Build APK - NexusMIDI Pro** workflow.
3. Click **Run workflow** and select the `fix/sf2-restore-and-storage` branch.
4. When the run completes, open it and download the `NexusMIDI-Pro-debug-apk` artifact.

To publish a signed Android Release, the maintainer must configure these GitHub Actions *Secrets*:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Keep the keystore and passwords secure and never commit them to the repository. After signing is configured, pushing a tag in the `vX.Y.Z` format triggers the Release workflow, which can publish signed APK and AAB files. Without signing configuration, the workflow may publish only a debug APK; that APK must not be treated as a signed production release.

Follow builds on [GitHub Actions](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/actions).

## Project structure

```text
src/
├── components/     UI screens and components
├── constants/      MIDI constants and tables
├── hooks/          React hooks
├── i18n/           Languages and translations
├── lib/            UI-independent logic
├── services/       MIDI, audio, synthesizer, and storage services
└── bootstrap.ts    Service initialization
android/            Native Android project and MIDI plugin
.github/            Workflows and contribution templates
```

## Tests

Run:

```bash
npm test
```

Automated tests cover MIDI logic, music tools, recording and playback, routing, services, storage, the SoundFont library, and internationalization. Test coverage depends on the tests currently present in the repository; CI does not replace testing on real devices and hardware.

## SoundFonts and audio files

This repository does not include `.sf2` files. Only import files that you are authorized to use. Users are responsible for checking the copyright and distribution terms of any SoundFonts used with the application.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Bug reports, improvement proposals, documentation, and Pull Requests are welcome.

- [Report a bug](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/issues/new?template=feature_request.md)
- [Changelog](CHANGELOG.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

## License

The original code in this project is distributed under the **MIT License**. The official license text is in [LICENSE](LICENSE); an [informational Brazilian Portuguese translation](LICENSE-PT-BR.md) is also available. Third-party libraries retain their own licenses and notices; see [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

The MIT License does not grant rights to third-party trademarks, names, icons, SoundFont files, or other content that may be used with the application.
