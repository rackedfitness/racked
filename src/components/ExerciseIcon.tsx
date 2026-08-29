type GlyphProps = { size: number };

function BarbellGlyph({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
      <rect x="4.5" y="7" width="2.6" height="10" rx="1" fill="currentColor" stroke="none" />
      <rect x="1.5" y="9" width="2" height="6" rx="0.8" fill="currentColor" stroke="none" />
      <rect x="16.9" y="7" width="2.6" height="10" rx="1" fill="currentColor" stroke="none" />
      <rect x="20.5" y="9" width="2" height="6" rx="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DumbbellGlyph({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round" />
      <rect x="2" y="8" width="4.2" height="8" rx="1.4" fill="currentColor" stroke="none" />
      <rect x="17.8" y="8" width="4.2" height="8" rx="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MachineGlyph({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x="4" y="3" width="8" height="13" rx="1" />
      <line x1="6" y1="6.2" x2="10" y2="6.2" />
      <line x1="6" y1="9" x2="10" y2="9" />
      <line x1="6" y1="11.8" x2="10" y2="11.8" />
      <circle cx="17" cy="6" r="2.2" />
      <line x1="17" y1="8.2" x2="17" y2="17" />
      <line x1="13" y1="20" x2="21" y2="20" strokeLinecap="round" />
    </svg>
  );
}

function CableGlyph({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="5.5" r="2.8" />
      <line x1="12" y1="8.3" x2="12" y2="15" />
      <line x1="8" y1="19" x2="16" y2="19" strokeLinecap="round" />
      <line x1="9.5" y1="15" x2="8" y2="19" />
      <line x1="14.5" y1="15" x2="16" y2="19" />
    </svg>
  );
}

function KettlebellGlyph({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M8.5 9.5a3.5 3.5 0 0 1 7 0" strokeLinecap="round" />
      <circle cx="12" cy="15" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BodyweightGlyph({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="4.6" r="2.2" fill="currentColor" stroke="none" />
      <path d="M12 7.5v6M8 10.5l4-1 4 1M9 20l3-6 3 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GLYPHS: Record<string, (props: GlyphProps) => React.JSX.Element> = {
  barbell: BarbellGlyph,
  dumbbell: DumbbellGlyph,
  machine: MachineGlyph,
  cable: CableGlyph,
  kettlebell: KettlebellGlyph,
  bodyweight: BodyweightGlyph,
};

export function equipmentLabel(equipment: string | null | undefined): string | null {
  if (!equipment) return null;
  return equipment.charAt(0).toUpperCase() + equipment.slice(1);
}

export default function ExerciseIcon({
  equipment,
  size = 28,
}: {
  equipment: string | null | undefined;
  size?: number;
}) {
  const Glyph = (equipment && GLYPHS[equipment]) || DumbbellGlyph;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
      style={{ width: size, height: size }}
    >
      <Glyph size={Math.round(size * 0.57)} />
    </span>
  );
}
