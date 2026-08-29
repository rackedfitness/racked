const SIZES = { sm: 32, md: 44, lg: 72 } as const;

export default function Avatar({
  url,
  name,
  size = "md",
}: {
  url?: string | null;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const dims = SIZES[size];
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={dims}
        height={dims}
        className="shrink-0 rounded-full border border-card-border object-cover"
        style={{ width: dims, height: dims }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-card-border bg-card font-bold text-muted"
      style={{ width: dims, height: dims, fontSize: dims * 0.4 }}
    >
      {initial}
    </span>
  );
}
