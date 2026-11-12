import { useVuMeter } from '../app/useAppEffects';
import { VuMeter } from './VuMeter';

/**
 * Wrapper que isola `useVuMeter` (baseado em setState a cada nota MIDI).
 *
 * Sem isso, o `App` inteiro re-renderiza a cada atividade MIDI (dezenas de
 * vezes por segundo num teclado rápido) — inclusive `AppHeader`,
 * `AppSidebar`, `MidiKeyboard` e `MidiPadGrid`.
 *
 * Com o wrapper, apenas este componente re-renderiza quando o nível muda.
 */
export function VuMeterLive() {
  const level = useVuMeter();
  return <VuMeter level={level} />;
}
