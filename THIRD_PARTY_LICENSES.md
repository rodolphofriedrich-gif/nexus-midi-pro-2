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

Essa contagem é um retrato do lockfile consultado e pode mudar conforme as dependências mudarem. Ela não substitui a leitura do texto de licença e dos avisos de cada pacote.

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
