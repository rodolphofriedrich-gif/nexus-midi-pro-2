# Contribuindo | Contributing

- [Português (Brasil)](#português-brasil)
- [English](#english)

---

# Português (Brasil)

Obrigado pelo interesse em contribuir com o NexusMIDI Pro. Relatos claros, documentação, correções e melhorias são bem-vindos.

## Antes de começar

1. Consulte as [issues abertas](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/issues) para evitar trabalho duplicado.
2. Para mudanças grandes, abra uma issue e descreva a proposta antes de implementar.
3. Faça suas alterações em uma branch própria, criada a partir da branch de desenvolvimento indicada pelo mantenedor.
4. Não inclua senhas, chaves, keystores, dados pessoais, arquivos SoundFont protegidos ou outros materiais sem autorização.

## Ambiente de desenvolvimento

- Node.js 20.19 ou superior (o CI utiliza Node.js 22).
- npm.
- Para Android: JDK 21 e Android SDK; Android Studio é recomendado.

Instale as dependências e inicie o projeto:

```bash
npm ci
npm run dev
```

## Verificações antes do Pull Request

Execute:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Ou use `npm run check` para typecheck, lint e testes. Se alterar a interface, valide também o build Web e, quando aplicável, o build Android. Informe no Pull Request quais comandos foram executados e seus resultados. Não declare testes em aparelho físico se eles não foram realizados.

## Diretrizes de código

- Prefira lógica independente de React e Capacitor em `src/lib/`, com testes unitários.
- Mantenha serviços testáveis e evite dependências globais desnecessárias.
- Adicione ou atualize testes para correções de bugs e novos comportamentos.
- Para textos da interface, use o sistema de internacionalização existente: inclua a chave em Português (Brasil) e sua tradução em `src/i18n/en.ts`.
- Preserve compatibilidade com os dados já armazenados pelo aplicativo; mudanças em IndexedDB ou persistência devem considerar usuários que atualizam versões anteriores.
- Evite adicionar dependências quando a funcionalidade puder ser implementada com as ferramentas existentes.
- Não inclua arquivos gerados, builds, APKs, keystores ou conteúdo binário que não seja necessário ao código-fonte.

## Android

O plugin nativo fica em:

`android/app/src/main/java/com/midi/controller/keyboard/plugins/`

Depois de alterar código Web/TypeScript integrado ao Android, execute:

```bash
npm run cap:sync
```

Não versione arquivos gerados em `android/app/src/main/assets/public` nem arquivos gerados do Capacitor que estejam listados no `.gitignore`.

## Pull Requests

- Use um título objetivo, de preferência no imperativo.
- Explique o problema, a solução e possíveis efeitos colaterais.
- Relacione issues relacionadas.
- Inclua capturas de tela quando a interface mudar.
- Para alterações MIDI/áudio, descreva o cenário testado, o dispositivo, a versão Android e o hardware utilizado.
- Mantenha o escopo do PR pequeno e evite misturar refatorações sem relação com a correção.

## Relato de bugs

Use o modelo de issue e informe, quando possível: modelo do aparelho, versão Android, versão do app, passos para reproduzir, resultado esperado, resultado observado e logs relevantes. Remova informações pessoais dos registros antes de publicá-los.

## Licença das contribuições

Ao enviar uma contribuição intencionalmente para este repositório, você concorda que ela será distribuída sob a licença MIT do projeto, salvo se houver acordo escrito diferente. Você declara que tem o direito de enviar o conteúdo e que ele não viola direitos de terceiros.

---

# English

Thank you for your interest in contributing to NexusMIDI Pro. Clear bug reports, documentation, fixes, and improvements are welcome.

## Before you start

1. Check the [open issues](https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/issues) to avoid duplicate work.
2. For substantial changes, open an issue and describe the proposal before implementation.
3. Make your changes in a dedicated branch based on the development branch specified by the maintainer.
4. Do not include passwords, keys, keystores, personal data, copyrighted SoundFonts, or other materials you are not authorized to share.

## Development environment

- Node.js 20.19 or later (CI uses Node.js 22).
- npm.
- For Android: JDK 21 and Android SDK; Android Studio is recommended.

Install dependencies and start the project:

```bash
npm ci
npm run dev
```

## Checks before submitting a Pull Request

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Alternatively, run `npm run check` for type checking, linting, and tests. If you change the interface, also validate the Web build and, where applicable, the Android build. State which commands you ran and their results in the Pull Request. Do not claim physical-device testing unless it was actually performed.

## Code guidelines

- Prefer React- and Capacitor-independent logic in `src/lib/`, with unit tests.
- Keep services testable and avoid unnecessary global dependencies.
- Add or update tests for bug fixes and new behavior.
- For interface text, use the existing internationalization system: include the Brazilian Portuguese source text and its translation in `src/i18n/en.ts`.
- Preserve compatibility with data already stored by the app; IndexedDB or persistence changes must consider users upgrading from previous versions.
- Avoid adding dependencies when existing tools can provide the required functionality.
- Do not commit generated files, builds, APKs, keystores, or binary assets that are not required by the source code.

## Android

The native plugin is located at:

`android/app/src/main/java/com/midi/controller/keyboard/plugins/`

After changing Web/TypeScript code integrated with Android, run:

```bash
npm run cap:sync
```

Do not commit generated files under `android/app/src/main/assets/public` or generated Capacitor files listed in `.gitignore`.

## Pull Requests

- Use a concise, descriptive title, preferably an imperative statement.
- Explain the problem, the solution, and possible side effects.
- Link related issues.
- Include screenshots when the interface changes.
- For MIDI/audio changes, describe the tested scenario, device, Android version, and hardware.
- Keep each PR focused; avoid unrelated refactoring.

## Bug reports

Use the issue template and, where possible, provide the device model, Android version, app version, reproduction steps, expected behavior, actual behavior, and relevant logs. Remove personal information from logs before publishing them.

## License of contributions

By intentionally submitting a contribution to this repository, you agree that it will be distributed under the project's MIT License unless a different written agreement applies. You represent that you have the right to submit the contribution and that it does not infringe third-party rights.
