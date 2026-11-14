# Decisão de arquitetura: saída de áudio Android

Data: 2026-11-14  
Branch: `experiment/android-oboe-audio-output-2026-11-14`

## Decisão

Adotar uma arquitetura de áudio por plataforma:

- **Android:** protótipo de sintetizador nativo FluidSynth + Oboe/AAudio.
- **Web:** manter SpessaSynth + Web Audio API/AudioWorklet.
- **Fallback:** manter o backend Web Audio disponível até o backend Android nativo passar pelos testes funcionais, de latência, estabilidade e consumo.

Oboe é uma API de saída de áudio PCM de baixa latência; não interpreta arquivos SF2. Portanto, a opção nativa precisa de um sintetizador como FluidSynth ligado ao driver Oboe. Não basta adicionar Oboe ao projeto atual.

## Por que esta decisão

O aplicativo é distribuído principalmente como APK Android e o problema relatado é latência ao tocar notas em tempo real. A documentação Android recomenda Oboe para a menor latência possível e recomenda LowLatency, Exclusive quando disponível, callback de áudio, taxa nativa do dispositivo e buffer ajustado ao frames-per-burst.

O repositório atual não contém código C/C++, CMake ou configuração NDK. O motor atual é SpessaSynth via AudioWorklet, e a saída está conectada à Web Audio API. Logo, trocar somente o driver de saída sem trocar/adaptar o motor de síntese não é uma alteração isolada.

## Referências técnicas

- Android low-latency audio: https://developer.android.com/games/sdk/oboe/low-latency-audio
- Android audio latency guidance: https://source.android.com/docs/core/audio/latency/app
- Oboe API: https://github.com/google/oboe
- FluidSynth Android binaries/releases: https://github.com/FluidSynth/fluidsynth/releases
- Exemplo de integração FluidSynth + Oboe + JNI: https://github.com/MelihHakanPektas/flutter_midi_pro
- Referência adicional: https://github.com/robsonsmartins/android-midi-synth

## Regras de migração

1. Não remover SpessaSynth nem o backend Web Audio durante o protótipo.
2. Preservar a interface pública do SynthService/SynthEngine sempre que possível.
3. Selecionar backend nativo somente no Android; Web continua com SpessaSynth.
4. Não enviar eventos de áudio ou MIDI pelo callback de áudio. O callback Oboe deve apenas renderizar PCM e nunca fazer I/O, alocar memória, esperar mutex ou executar trabalho pesado.
5. Eventos MIDI vindos da interface devem entrar em uma fila nativa segura e não bloqueante, consumida pelo motor de síntese.
6. O carregamento de SF2 deve ocorrer fora do callback de áudio.
7. Manter suporte funcional a Note On/Off, All Notes Off/All Sound Off, CC, sustain, pitch bend, pressão, program/bank, canais 1–16, polifonia e múltiplos SoundFonts antes de considerar a migração completa.
8. Reproduzir o mesmo SF2 e a mesma sequência de notas no backend Web e no nativo para comparação A/B.

## Etapas

### Fase A — Base nativa
- Adicionar NDK/CMake e bibliotecas Android do FluidSynth com versão e SHA-256 fixados.
- Integrar Oboe pelo driver FluidSynth ou por um callback Oboe dedicado, evitando dois caminhos de saída concorrentes.
- Criar plugin Capacitor nativo para inicialização, carregamento/remoção de SF2, comandos MIDI, diagnósticos e encerramento.
- Não alterar o backend Web.

### Fase B — Compatibilidade
- Implementar o contrato do SynthEngine usado pelo SynthService.
- Preservar acesso a arquivos SF2 selecionados pelo usuário, incluindo SAF/URI Android; não presumir que um URI é um caminho de arquivo nativo.
- Tratar ciclo de vida, pausa/retomada, troca de saída, falha/reabertura do stream e descarte de recursos.
- Verificar licenças e empacotamento das bibliotecas nativas para cada ABI distribuída.

### Fase C — Diagnóstico e comparação
Registrar: API de áudio efetiva (AAudio/OpenSL ES), sample rate real, frames-per-burst, buffer size/capacity, sharing/performance mode realmente obtidos, contagem de underruns/XRuns, vozes ativas, polifonia, uso de CPU e erros de callback.

Comparar:
- Web Audio/AudioWorklet atual.
- FluidSynth + Oboe LowLatency.
- Mesmo aparelho, SF2, notas, velocidade, volume e condições de teste.

A latência interna do software não será tratada como latência acústica. A validação final deve incluir medição independente toque-to-som.

## Critério para substituir o backend Android

Somente selecionar FluidSynth + Oboe como padrão Android depois de:
- APK compilar em CI para as ABIs suportadas;
- testes de Note On/Off e ausência de notas presas;
- validação de bancos, programas, canais, sustain, pitch bend e múltiplos SF2;
- teste de ciclo de vida e troca de rota de áudio;
- comparação acústica demonstrar melhora reproduzível sem aumento inaceitável de glitches, aquecimento ou consumo.

Até lá, o backend atual permanece disponível como fallback e referência.
