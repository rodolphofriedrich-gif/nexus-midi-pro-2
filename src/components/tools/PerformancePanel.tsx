import { Sparkles } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { tr } from '../../i18n';
import { NOTE_ROOTS } from '../../lib/midiMath';
import { CHORDS, SCALES, type ChordId, type ScaleId } from '../../lib/scales';
import { VELOCITY_CURVES, type VelocityCurve } from '../../lib/velocity';
import { prefsStore, toolsStore } from '../../services/stores';
import { CustomSelect } from '../CustomSelect'; // <-- IMPORTANTE: Importando o novo componente
import { Card, Field, RangeRow, Segmented } from './ui'; // selectClass removido se não for mais usado

const CURVE_LABELS: Record<VelocityCurve, string> = {
  linear: 'Linear',
  soft: 'Suave',
  hard: 'Forte',
  fixed: 'Fixa',
};

export function PerformancePanel() {
  const prefs = useStore(prefsStore);
  const tools = useStore(toolsStore);

  // Prepara as opções para os novos selects customizados
  const rootOptions = NOTE_ROOTS.map((name, index) => ({ value: index, label: name }));
  const scaleOptions = (Object.keys(SCALES) as ScaleId[]).map((id) => ({ value: id, label: tr(SCALES[id].name) }));
  const chordOptions = (Object.keys(CHORDS) as ChordId[]).map((id) => ({ value: id, label: tr(CHORDS[id].name) }));

  return (
    <Card title={tr('Performance')} Icon={Sparkles} accent="text-[var(--nexus-primary)]">
      <Field label={tr('Curva de velocity')}>
        <Segmented
          value={prefs.velocityCurve}
          options={VELOCITY_CURVES.map((c) => ({ id: c.id, label: tr(CURVE_LABELS[c.id]) }))}
          onChange={(velocityCurve) => prefsStore.set({ velocityCurve })}
        />
      </Field>
      {prefs.velocityCurve === 'fixed' && (
        <RangeRow label={tr('Velocity fixa')} value={tools.fixedVelocity} min={1} max={127} onChange={(fixedVelocity) => toolsStore.set({ fixedVelocity })} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={tr('Tônica')}>
          <CustomSelect
            value={tools.scaleRoot}
            onChange={(val) => toolsStore.set({ scaleRoot: Number(val) })}
            options={rootOptions}
          />
        </Field>
        <Field label={tr('Escala')}>
          <CustomSelect
            value={tools.scale}
            onChange={(val) => toolsStore.set({ scale: val as ScaleId })}
            options={scaleOptions}
          />
        </Field>
      </div>
      <p className="-mt-1 text-[10px] text-[var(--text-muted)]">{tr('Com uma escala ativa, notas fora dela são ajustadas para a mais próxima.')}</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label={tr('Acorde de um toque')}>
          <CustomSelect
            value={tools.chord}
            onChange={(val) => toolsStore.set({ chord: val as ChordId })}
            options={chordOptions}
          />
        </Field>
        <Field label={tr('Inversão')}>
          <Segmented
            value={tools.chordInversion}
            options={[0, 1, 2, 3].map((n) => ({ id: n, label: String(n) }))}
            onChange={(chordInversion) => toolsStore.set({ chordInversion })}
          />
        </Field>
      </div>
    </Card>
  );
}
