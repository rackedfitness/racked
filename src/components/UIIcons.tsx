type IconProps = { size?: number; className?: string };

export function CheckIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2.6}>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function MenuDotsIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function GearIcon({ size = 20, className }: IconProps) {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = 12 + Math.cos(a) * 7.2, y1 = 12 + Math.sin(a) * 7.2;
    const x2 = 12 + Math.cos(a) * 9.6, y2 = 12 + Math.sin(a) * 9.6;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      {teeth}
      <circle cx="12" cy="12" r="6.4" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M14.5 5.5L8 12l6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M4 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M5.5 14.5L12 8l6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDownIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M5.5 9.5L12 16l6.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SwapIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13.5M14 4.5L17.5 8 14 11.5" />
      <path d="M20 16H6.5M10 12.5L6.5 16 10 19.5" />
    </svg>
  );
}

export function GripIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

export function HeartIcon({ size = 18, className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4c2-.3 3.9.6 5 2.3l1.4 2 1.4-2c1.1-1.7 3-2.6 5-2.3 3.3.5 5.1 3.8 3.6 7.2-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  );
}

export function CommentIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5h16v11H8.5L4 20.5v-4H4z" />
    </svg>
  );
}

export function FlameIcon({ size = 24, className, color = "#ff8a3d" }: IconProps & { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill={color}>
      <path d="M12 2c1 3-3 4.5-3 8a3 3 0 006 0c1.2 1 2 2.6 2 4.3A5.3 5.3 0 0111.7 22 5.3 5.3 0 016.3 16.7c0-3.4 2.2-5 3.4-7.3.7-1.3.9-3 .3-4.4 1 .3 1.7.9 2 3z" />
    </svg>
  );
}
