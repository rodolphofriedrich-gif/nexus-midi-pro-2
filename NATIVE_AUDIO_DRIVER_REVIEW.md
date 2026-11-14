# Atualização técnica — driver de áudio FluidSynth no Android

A revisão de um exemplo Android de referência mostrou que há uma opção adicional à implementação de callback Oboe próprio: compilar o FluidSynth com seu driver Android Oboe, quando a versão/build selecionada disponibilizar esse driver. O exemplo `robsonsmartins/android-midi-synth` configura `audio.oboe.performance-mode=LowLatency` e `audio.oboe.sharing-mode=Exclusive`, e instancia `new_fluid_audio_driver()`.

Isso deve ser validado contra a versão oficial exata do FluidSynth que será fixada. Não assumir que qualquer binário Android ou qualquer build upstream inclui esse driver.

Ordem de preferência para o protótipo:
1. **Primeiro avaliar o driver Oboe do próprio FluidSynth** (se disponível na versão oficial fixada), pois reduz código próprio e evita duplicar o gerenciamento do stream.
2. Se o driver não estiver disponível ou não fornecer diagnósticos/controle suficientes, usar callback Oboe próprio e chamar a API de renderização PCM do FluidSynth.
3. Não manter os dois drivers de saída ativos ao mesmo tempo.

O exemplo de terceiros é apenas referência arquitetural. Não copiar seus binários nem presumir que estejam atualizados; revisar versão, ABI, dependências transitivas e licenças antes de reutilizar qualquer artefato.


## Confirmação upstream (2026-11-14)

A revisão do código-fonte oficial confirmou que FluidSynth **2.6.2** inclui `src/drivers/fluid_oboe.cpp`. O driver chama `fluid_synth_write_float` ou `fluid_synth_write_s16` no callback Oboe e expõe configurações `audio.oboe.performance-mode`, `audio.oboe.sharing-mode`, `audio.oboe.sample-rate-conversion-quality` e `audio.oboe.error-recovery-mode`.

O CMake oficial declara a opção `enable-oboe` (desativada por padrão) e usa `find_package(oboe)`. Portanto, não precisamos criar um segundo callback Oboe próprio no primeiro protótipo: usaremos o driver upstream do FluidSynth, se o build Android confirmar `OBOE_SUPPORT`. Isso reduz código de áudio próprio e evita duplicar o ciclo de vida do stream.

Fontes consultadas:
- FluidSynth 2.6.2 CMakeLists: https://github.com/FluidSynth/fluidsynth/blob/master/CMakeLists.txt
- Driver Oboe upstream: https://github.com/FluidSynth/fluidsynth/blob/master/src/drivers/fluid_oboe.cpp
- Guia de build CMake: https://github.com/FluidSynth/fluidsynth/blob/master/doc/wiki/BuildingWithCMake.md
- Oboe 1.11.0: https://github.com/google/oboe/releases/tag/1.11.0
