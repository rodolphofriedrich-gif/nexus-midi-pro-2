# Plano de migração do motor de áudio Android

Data: 2026-11-14
Branch de trabalho: `experiment/fluidsynth-oboe-native-android-2026-11-14`
Checkpoint anterior: `checkpoint/pre-native-audio-implementation-2026-11-14`

## Decisão técnica

Para este aplicativo, a opção inicial será **FluidSynth + Oboe diretamente**, integrados por C++/NDK e expostos ao React/Capacitor por uma ponte nativa pequena.

O JUCE foi avaliado e é tecnicamente capaz de fornecer uma camada de dispositivos de áudio Android baseada em Oboe (`JUCE_USE_ANDROID_OBOE`). Porém, o JUCE não é um sintetizador SF2. Ainda precisaríamos integrar FluidSynth. Como o escopo atual é um player SoundFont Android, sem necessidade atual de plugins VST/AU ou de uma aplicação desktop JUCE, adicionar o framework completo aumentaria a superfície de integração e introduziria obrigações de licença que não são necessárias para o objetivo imediato.

Esta escolha não declara o JUCE inadequado. Ele poderá ser reavaliado se o projeto evoluir para aplicações desktop, plugins ou uma arquitetura de áudio multiplataforma mais ampla.

## Componentes escolhidos

- **FluidSynth:** leitura dos arquivos SF2 e síntese das vozes.
- **Oboe:** abertura e gerenciamento do stream de áudio Android, com AAudio quando disponível e fallback conforme suporte do dispositivo.
- **C++ / Android NDK / CMake:** implementação e compilação do backend.
- **Capacitor Plugin + JNI:** comandos de controle e ciclo de vida entre TypeScript, Java e C++.
- **SpessaSynth + Web Audio:** permanece como backend Web e fallback Android até a migração ser validada.

## Arquitetura-alvo

```text
React / TypeScript
       |
       | Capacitor Plugin (comandos MIDI e SF2)
       v
Java Plugin / JNI
       |
       | API nativa pequena; sem áudio PCM atravessando a ponte
       v
C++ NativeSynth
       |                    Oboe callback
       |                         |
       v                         v
FluidSynth --------------> PCM output
       |
       v
SoundFont SF2
```

O callback Oboe deverá apenas consumir eventos de uma fila pré-alocada e renderizar PCM. Não poderá executar I/O, carregar SF2, alocar memória, esperar mutex, chamar Java/JS ou executar operações bloqueantes.

O carregamento e descarregamento de SF2 ocorrerá fora do callback. A comunicação MIDI será feita por uma fila thread-safe e não bloqueante ou mecanismo equivalente validado para tempo real.

## Estado observado no repositório

- Aplicativo atual: React + TypeScript + Vite + Capacitor 8.
- Motor atual: `spessasynth_lib` via `WorkletSynthesizer` em `src/services/audio/spessaEngine.ts`.
- Contrato de abstração: `SynthEngine`, `SynthBackend` e `BackendFactory` em `src/services/synthTypes.ts`.
- Orquestrador: `src/services/synthService.ts`, que já concentra Note On/Off, CC, Program Change, Pitch Bend, pressão, polifonia, transposição e bancos.
- Integração Android atual: plugins Java em `android/app/src/main/java/com/midi/controller/keyboard/plugins/`.
- Gradle Android usa AGP 8.13.0, compile/target SDK 36, min SDK 24; CI usa JDK 21.
- Não foi encontrada infraestrutura C++, CMake ou NDK no projeto Android.
- O workflow atual compila o APK em push para branches configuradas, mas não compila C++ nativo.

## Por que não integrar JUCE nesta etapa

1. JUCE fornece infraestrutura de áudio e pode usar Oboe no Android, mas não substitui FluidSynth para ler SF2.
2. Para o objetivo restrito do NexusMIDI, Oboe diretamente evita uma camada de abstração adicional.
3. A licença JUCE 9 é AGPLv3 ou comercial. A licença Starter publicada atualmente é gratuita até US$ 20.000 de receita anual; acima do limite será necessário mudar de licença. A distribuição fechada exige atenção especial aos termos aplicáveis.
4. Não usar JUCE reduz dependências e torna mais simples auditar o caminho de áudio e a latência.

## Licenças e distribuição

- FluidSynth é LGPL-2.1. A implementação deve preservar a biblioteca como componente compartilhado substituível, publicar eventuais modificações feitas no FluidSynth nos termos da LGPL e incluir avisos/licenças e materiais exigidos.
- Oboe é Apache-2.0.
- O código original do NexusMIDI continua sob MIT.
- Antes de distribuição comercial, revisar a forma de empacotamento/linkagem do FluidSynth no Android e as obrigações de relink/substituição aplicáveis ao APK. Este documento não é parecer jurídico.

## Fases de implementação

### Fase 0 — Preparação (este commit)
- Registrar a decisão e o escopo.
- Preservar o backend Web atual.
- Trabalhar em branch experimental separada.

### Fase 1 — Build nativo mínimo
- Definir versões fixas de NDK, CMake, Oboe e FluidSynth.
- Adicionar um módulo CMake Android isolado.
- Compilar primeiro para `arm64-v8a`, arquitetura do Galaxy A54.
- Integrar o artefato nativo no APK sem ativar o novo motor.
- CI precisa compilar o APK com as bibliotecas nativas.
- Não alterar o comportamento do app nesta fase.

### Fase 2 — Saída Oboe e prova de vida
- Abrir/fechar o stream Oboe com tratamento de erros e ciclo de vida.
- Expor diagnósticos reais: API, sample rate, frames-per-burst, tamanho/capacidade do buffer, modo efetivo e contagem de underruns/XRuns.
- Validar callback estável antes de conectar o sintetizador.
- Não considerar silêncio ou tom de teste como validação SF2.

### Fase 3 — FluidSynth
- Criar settings e synth fora do callback.
- Carregar SF2 a partir de conteúdo acessível ao app; não presumir que URI SAF seja caminho de arquivo.
- Renderizar PCM do FluidSynth no callback Oboe.
- Controlar sincronização entre comandos MIDI e renderização sem locks bloqueantes.

### Fase 4 — Plugin Capacitor e contrato SynthEngine
- Adicionar plugin nativo independente sem alterar o plugin MIDI existente.
- Implementar init, load/unload SF2, Note On/Off, CC, Program/Bank, Pitch Bend, pressão, panic, configurações e dispose.
- Adaptar `SynthBackend` sem alterar os chamadores do `SynthService` desnecessariamente.
- Selecionar backend nativo somente em Android; Web segue com SpessaSynth.

### Fase 5 — Paridade funcional e medição
- Validar canais 1–16, bancos, programas, bateria, sustain, CC, polifonia, transposição, troca de SF2 e ausência de notas presas.
- Comparar com o backend atual usando mesmo aparelho, SF2, sequência, volume e condições térmicas.
- Medir toque-to-som com método acústico independente.
- Medir CPU, temperatura, bateria e underruns.

### Fase 6 — Decisão de ativação
- Manter SpessaSynth como fallback até todos os critérios passarem.
- Não ativar automaticamente o backend nativo por simples sucesso de compilação.
- Só tornar FluidSynth + Oboe padrão Android após evidência repetível de menor latência e estabilidade equivalente ou melhor.

## Critérios de aceite

- Build Web inalterado.
- APK Android compila no GitHub Actions para as ABIs definidas.
- O backend atual continua disponível e selecionável como fallback durante os testes.
- Nenhuma chamada Java/JS ou operação bloqueante no callback de áudio.
- SF2 do usuário carrega sem copiar conteúdo para locais inseguros nem perder permissões.
- Paridade dos comandos MIDI essenciais.
- Sem notas presas após troca de banco, interrupção, pause/resume ou encerramento.
- Latência acústica menor e repetível no Galaxy A54, sem glitches ou aquecimento/consumo inaceitáveis.
