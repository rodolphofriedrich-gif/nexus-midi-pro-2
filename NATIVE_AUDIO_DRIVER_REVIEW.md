# Atualização técnica — driver de áudio FluidSynth no Android

A revisão de um exemplo Android de referência mostrou que há uma opção adicional à implementação de callback Oboe próprio: compilar o FluidSynth com seu driver Android Oboe, quando a versão/build selecionada disponibilizar esse driver. O exemplo `robsonsmartins/android-midi-synth` configura `audio.oboe.performance-mode=LowLatency` e `audio.oboe.sharing-mode=Exclusive`, e instancia `new_fluid_audio_driver()`.

Isso deve ser validado contra a versão oficial exata do FluidSynth que será fixada. Não assumir que qualquer binário Android ou qualquer build upstream inclui esse driver.

Ordem de preferência para o protótipo:
1. **Primeiro avaliar o driver Oboe do próprio FluidSynth** (se disponível na versão oficial fixada), pois reduz código próprio e evita duplicar o gerenciamento do stream.
2. Se o driver não estiver disponível ou não fornecer diagnósticos/controle suficientes, usar callback Oboe próprio e chamar a API de renderização PCM do FluidSynth.
3. Não manter os dois drivers de saída ativos ao mesmo tempo.

O exemplo de terceiros é apenas referência arquitetural. Não copiar seus binários nem presumir que estejam atualizados; revisar versão, ABI, dependências transitivas e licenças antes de reutilizar qualquer artefato.
