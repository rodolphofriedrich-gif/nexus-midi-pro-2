# Licenças de terceiros | Third-party licenses

- [Português (Brasil)](#português-brasil)
- [English](#english)

---

# Português (Brasil)

O NexusMIDI Pro utiliza bibliotecas e ferramentas de terceiros. Cada componente continua sujeito à sua própria licença; a licença MIT deste repositório não substitui nem altera essas licenças.

As versões abaixo foram conferidas no `package-lock.json` do projeto. A lista de dependências transitivas pode mudar quando as dependências forem atualizadas. O campo `license` de cada pacote no lockfile deve ser consultado para a identificação específica.

## Dependências principais

| Componente | Versão travada no lockfile | Licença |
| --- | ---: | --- |
| React / React DOM | 19.3.1 | MIT |
| Capacitor (Android, Core, App, Filesystem, Share e CLI) | 8.x | MIT |
| SpessaSynth / spessasynth_core | 4.4.8 / 4.4.10 | Apache-2.0 |
| Tailwind CSS / @tailwindcss/vite | 4.3.5 | MIT |
| Vite | 8.3.8 | MIT |
| Vite PWA / Workbox | 1.3.0 / 7.4.1 | MIT |
| Lucide React | 0.546.0 | ISC |
| Vitest | 4.1.12 | MIT |
| Oxlint | 1.93.0 | MIT |
| Prettier | 3.10.1 | MIT |
| TypeScript | 7.0.2 | Apache-2.0 |

As versões são as resolvidas pelo lockfile na revisão desta documentação; não representam necessariamente as versões mais recentes disponíveis.

## Pacotes npm de execução identificados no lockfile

O lockfile marca 14 pacotes como dependências de produção (não inclui as dependências de desenvolvimento):

| Pacote | Versão | Licença |
| --- | ---: | --- |
| `@capacitor/app` | 8.1.2 | MIT |
| `@capacitor/core` | 8.6.2 | MIT |
| `@capacitor/filesystem` | 8.1.5 | MIT |
| `@capacitor/share` | 8.0.3 | MIT |
| `@capacitor/synapse` | 1.0.4 | ISC |
| `fflate` | 0.8.3 | MIT |
| `lucide-react` | 0.546.0 | ISC |
| `react` | 19.3.1 | MIT |
| `react-dom` | 19.3.1 | MIT |
| `scheduler` | 0.28.0 | MIT |
| `spessasynth_core` | 4.4.10 | Apache-2.0 |
| `spessasynth_lib` | 4.4.8 | Apache-2.0 |
| `stb-vorbis` | 0.0.7 | Apache-2.0 |
| `tslib` | 2.9.1 | 0BSD |

A tabela representa as dependências de produção sinalizadas no lockfile npm. O empacotamento Web/Android e a resolução Gradle podem incorporar dependências transitivas adicionais; para cada versão distribuída, a lista deve ser conferida com o artefato final e os arquivos de licença dos pacotes correspondentes.

## Licenças identificadas nas dependências transitivas

O lockfile contém 592 entradas de pacotes em `node_modules`. Os metadados de licença dessas entradas estão distribuídos da seguinte forma:

| Identificador de licença | Entradas |
| --- | ---: |
| MIT | 487 |
| Apache-2.0 | 33 |
| ISC | 28 |
| BlueOak-1.0.0 | 17 |
| MPL-2.0 | 12 |
| BSD-3-Clause | 5 |
| BSD-2-Clause | 4 |
| 0BSD | 2 |
| Unlicense | 2 |
| CC-BY-4.0 | 1 |
| MIT OR CC0-1.0 | 1 |

Essa contagem é um retrato de todas as entradas do lockfile, incluindo dependências exclusivas de desenvolvimento e ferramentas de build que não são incorporadas ao aplicativo final. Ela não representa, portanto, a lista de componentes distribuídos no APK. Para o conjunto npm de execução, o lockfile desta revisão registra 14 pacotes: 8 MIT, 2 ISC, 3 Apache-2.0 e 1 0BSD. A lista e as versões estão na tabela acima. A distribuição final Android também incorpora dependências resolvidas pelo Gradle, que devem ser conferidas no build específico antes de cada publicação.

## Dependências nativas Android

Além do lockfile npm, a configuração Gradle declara dependências Android nativas:

| Componente | Versão configurada | Licença |
| --- | ---: | --- |
| AndroidX AppCompat | 1.7.1 | Apache-2.0 |
| AndroidX CoordinatorLayout | 1.3.0 | Apache-2.0 |
| AndroidX Core SplashScreen | 1.2.0 | Apache-2.0 |
| Apache Cordova Android Framework | 14.0.1 | Apache-2.0 |
| Capacitor Android e plugins usados | 8.x | MIT |

O projeto também declara o Android Gradle Plugin 8.13.0 e o Google Services Gradle Plugin 4.4.4 como ferramentas de build. O plugin Google Services só é aplicado quando existe um arquivo `google-services.json` no projeto Android. Essas ferramentas não são dependências de execução do aplicativo.

Referências: [AndroidX](https://developer.android.com/jetpack/androidx), [Apache Cordova Android](https://github.com/apache/cordova-android), [Capacitor](https://github.com/ionic-team/capacitor), [Android Open Source Project licensing](https://source.android.com/docs/setup/contribute/licenses).

## Textos das licenças

- [MIT](https://opensource.org/license/mit)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [ISC](https://opensource.org/license/isc-license-txt)
- [Mozilla Public License 2.0 (MPL-2.0)](https://www.mozilla.org/en-US/MPL/2.0/)
- [BSD 2-Clause](https://opensource.org/license/bsd-2-clause)
- [BSD 3-Clause](https://opensource.org/license/bsd-3-clause)
- [Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
- [Zero-Clause BSD (0BSD)](https://opensource.org/license/0bsd)
- [Unlicense](https://unlicense.org/)
- [Creative Commons Attribution 4.0 (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/)
- [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## Avisos de distribuição

O repositório inclui `NOTICE` com os créditos e avisos de marca reproduzidos do projeto SpessaSynth. Os textos MIT, Apache-2.0, ISC e 0BSD usados pelo conjunto npm de execução são incluídos em `public/licenses/` e copiados para o build Web/Android. A página local `public/THIRD_PARTY_NOTICES.html` fica acessível em **Configurações → Sobre o App → Ver licenças e créditos**. Ela é um resumo de créditos e links; os avisos originais dos pacotes continuam sendo a referência para cada componente.

A página local não substitui uma conferência do conjunto Gradle efetivamente empacotado no APK. Antes de distribuir uma versão, gere e revise o relatório de dependências Android resolvidas e confira se todos os avisos/copyrights exigidos estão presentes no pacote final.

- Preserve os avisos de direitos autorais, textos de licença e arquivos `NOTICE` fornecidos pelos pacotes de terceiros quando redistribuir esses componentes.
- Componentes licenciados sob Apache-2.0 e MPL-2.0 possuem condições próprias; consulte os textos oficiais antes de modificar ou redistribuir esses componentes.
- Para uma distribuição binária do aplicativo, mantenha disponível uma relação atualizada das bibliotecas incorporadas e seus avisos de licença.
- Esta relação é um resumo informativo, não aconselhamento jurídico nem substituto dos arquivos de licença distribuídos pelos autores originais.

## SoundFonts e outros conteúdos

Este repositório não fornece arquivos SoundFont (`.sf2`). Os arquivos importados pelo usuário podem ter licenças próprias e não passam a ser licenciados sob MIT por serem abertos pelo aplicativo. O usuário deve obter os arquivos de fontes autorizadas e respeitar seus termos de uso e redistribuição.

---

# English

NexusMIDI Pro uses third-party libraries and tools. Each component remains subject to its own license; this repository's MIT License does not replace or modify those licenses.

The versions below were checked against the project's `package-lock.json`. The transitive dependency set may change when dependencies are updated. Consult each package's `license` field in the lockfile for package-specific identification.

## Main dependencies

| Component | Version pinned in lockfile | License |
| --- | ---: | --- |
| React / React DOM | 19.3.1 | MIT |
| Capacitor (Android, Core, App, Filesystem, Share, and CLI) | 8.x | MIT |
| SpessaSynth / spessasynth_core | 4.4.8 / 4.4.10 | Apache-2.0 |
| Tailwind CSS / @tailwindcss/vite | 4.3.5 | MIT |
| Vite | 8.3.8 | MIT |
| Vite PWA / Workbox | 1.3.0 / 7.4.1 | MIT |
| Lucide React | 0.546.0 | ISC |
| Vitest | 4.1.12 | MIT |
| Oxlint | 1.93.0 | MIT |
| Prettier | 3.10.1 | MIT |
| TypeScript | 7.0.2 | Apache-2.0 |

These are the versions resolved by the lockfile when this document was reviewed; they are not necessarily the latest available versions.

## npm runtime packages identified in the lockfile

The lockfile marks 14 packages as production dependencies (excluding development dependencies):

| Package | Version | License |
| --- | ---: | --- |
| `@capacitor/app` | 8.1.2 | MIT |
| `@capacitor/core` | 8.6.2 | MIT |
| `@capacitor/filesystem` | 8.1.5 | MIT |
| `@capacitor/share` | 8.0.3 | MIT |
| `@capacitor/synapse` | 1.0.4 | ISC |
| `fflate` | 0.8.3 | MIT |
| `lucide-react` | 0.546.0 | ISC |
| `react` | 19.3.1 | MIT |
| `react-dom` | 19.3.1 | MIT |
| `scheduler` | 0.28.0 | MIT |
| `spessasynth_core` | 4.4.10 | Apache-2.0 |
| `spessasynth_lib` | 4.4.8 | Apache-2.0 |
| `stb-vorbis` | 0.0.7 | Apache-2.0 |
| `tslib` | 2.9.1 | 0BSD |

This table represents production dependencies marked in the npm lockfile. The Web/Android packaging process and Gradle resolution may include additional transitive dependencies; for each distributed version, verify the final artifact and the corresponding packages' license files.

## Licenses identified in transitive dependencies

The lockfile contains 592 package entries under `node_modules`. Their license metadata is distributed as follows:

| License identifier | Entries |
| --- | ---: |
| MIT | 487 |
| Apache-2.0 | 33 |
| ISC | 28 |
| BlueOak-1.0.0 | 17 |
| MPL-2.0 | 12 |
| BSD-3-Clause | 5 |
| BSD-2-Clause | 4 |
| 0BSD | 2 |
| Unlicense | 2 |
| CC-BY-4.0 | 1 |
| MIT OR CC0-1.0 | 1 |

This count is a snapshot of the reviewed lockfile and may change as dependencies change. It does not replace reviewing each package's license text and notices.

## Native Android dependencies

In addition to the npm lockfile, the Gradle configuration declares native Android dependencies:

| Component | Configured version | License |
| --- | ---: | --- |
| AndroidX AppCompat | 1.7.1 | Apache-2.0 |
| AndroidX CoordinatorLayout | 1.3.0 | Apache-2.0 |
| AndroidX Core SplashScreen | 1.2.0 | Apache-2.0 |
| Apache Cordova Android Framework | 14.0.1 | Apache-2.0 |
| Capacitor Android and used plugins | 8.x | MIT |

The project also declares Android Gradle Plugin 8.13.0 and Google Services Gradle Plugin 4.4.4 as build tools. The Google Services plugin is applied only when a `google-services.json` file exists in the Android project. These tools are not runtime application dependencies.

References: [AndroidX](https://developer.android.com/jetpack/androidx), [Apache Cordova Android](https://github.com/apache/cordova-android), [Capacitor](https://github.com/ionic-team/capacitor), [Android Open Source Project licensing](https://source.android.com/docs/setup/contribute/licenses).

## License texts

- [MIT](https://opensource.org/license/mit)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [ISC](https://opensource.org/license/isc-license-txt)
- [Mozilla Public License 2.0 (MPL-2.0)](https://www.mozilla.org/en-US/MPL/2.0/)
- [BSD 2-Clause](https://opensource.org/license/bsd-2-clause)
- [BSD 3-Clause](https://opensource.org/license/bsd-3-clause)
- [Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
- [Zero-Clause BSD (0BSD)](https://opensource.org/license/0bsd)
- [Unlicense](https://unlicense.org/)
- [Creative Commons Attribution 4.0 (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/)
- [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## Distribution notices

- Preserve copyright notices, license texts, and any `NOTICE` files supplied by third-party packages when redistributing those components.
- Apache-2.0 and MPL-2.0 components have their own conditions; review the official license texts before modifying or redistributing them.
- For binary application distributions, keep an up-to-date list of bundled libraries and their license notices available.
- This document is an informational summary, not legal advice or a substitute for license files distributed by the original authors.

## SoundFonts and other content

This repository does not provide SoundFont (`.sf2`) files. User-imported files may have their own licenses and are not relicensed under MIT merely because the application can load them. Users must obtain files from authorized sources and comply with their terms of use and redistribution.
