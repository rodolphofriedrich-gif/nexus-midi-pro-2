# Registro de origem dos recursos visuais | Visual asset provenance

Este arquivo registra recursos visuais versionados no repositório cuja origem/licença não pode ser comprovada apenas pelo código-fonte. Antes de publicar ou redistribuir o aplicativo, o mantenedor deve confirmar a autoria ou guardar a licença/autorização correspondente.

This file tracks visual assets committed to the repository whose origin/license cannot be established from source code alone. Before publishing or redistributing the app, the maintainer must confirm authorship or retain the relevant license/permission.

## Recursos identificados

| Arquivo / grupo | Uso | Situação documental |
| --- | --- | --- |
| `public/icon.svg` | Ícone vetorial do aplicativo | O SVG está no repositório, mas não contém declaração de autoria, origem ou licença própria. Confirmar se foi criado pelo mantenedor ou se há autorização de uso. |
| `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` | Ícones Web/PWA | Não há registro de origem/licença nos metadados do repositório. Confirmar se são exportações do SVG acima ou se possuem outra origem. |
| `android/app/src/main/res/mipmap-*/` | Ícones Android | Confirmar se são derivados dos arquivos do projeto e se não incorporam marcas ou arte de terceiros sem autorização. |
| `android/app/src/main/res/drawable*/splash.png` | Telas de abertura Android | Não há registro de origem/licença nos metadados do repositório. Confirmar autoria ou autorização de uso. |

## Como fechar a verificação

Para cada arquivo, registre:
1. Autor/criador ou titular dos direitos.
2. Origem (arquivo-fonte, ferramenta ou URL).
3. Licença ou autorização que permite uso e redistribuição no aplicativo.
4. Atribuição exigida, se houver.
5. Se o arquivo foi modificado, a natureza da modificação.

Não inclua imagens baixadas de buscas, logotipos de fabricantes, capas de produtos ou material protegido apenas porque estão disponíveis publicamente. A ausência de aviso de copyright não significa que uma imagem esteja em domínio público.

## Recursos gerados ou exportados

Se os PNGs forem exportações de um SVG criado pelo mantenedor, registre isso explicitamente e mantenha o SVG-fonte. Se qualquer recurso tiver sido gerado por ferramenta de terceiros, verifique os termos aplicáveis à ferramenta e aos elementos de entrada utilizados.
