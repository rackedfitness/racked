type IconProps = { active?: boolean };

const common = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ active }: IconProps) {
  return (
    <svg {...common} fill={active ? "currentColor" : "none"}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function DumbbellIcon({ active }: IconProps) {
  return (
    <svg {...common} fill="none">
      <path d="M4 9v6" strokeWidth={active ? 3 : 2} />
      <path d="M2.5 10v4" strokeWidth={active ? 3 : 2} />
      <path d="M20 9v6" strokeWidth={active ? 3 : 2} />
      <path d="M21.5 10v4" strokeWidth={active ? 3 : 2} />
      <path d="M7 7v10" strokeWidth={active ? 3 : 2} />
      <path d="M17 7v10" strokeWidth={active ? 3 : 2} />
      <path d="M7 12h10" strokeWidth={active ? 3 : 2} />
    </svg>
  );
}

export function TrendingUpIcon({ active }: IconProps) {
  return (
    <svg {...common} strokeWidth={active ? 2.5 : 2}>
      <path d="M3 17 9 11 13 15 21 6" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

export function UsersIcon({ active }: IconProps) {
  return (
    <svg {...common} fill="none">
      <circle cx="9" cy="8" r="3.25" fill={active ? "currentColor" : "none"} />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15.5 6.2a3.25 3.25 0 0 1 0 6.3" />
      <path d="M17.5 14.3c2.6.6 4.5 2.9 4.5 5.7" />
    </svg>
  );
}

export function UserIcon({ active }: IconProps) {
  return (
    <svg {...common} fill="none">
      <circle cx="12" cy="8" r="3.5" fill={active ? "currentColor" : "none"} />
      <path d="M4.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    </svg>
  );
}
