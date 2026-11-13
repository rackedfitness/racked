const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server actions receive ids straight from the client, and some get
// interpolated into PostgREST filter strings (.or(...)) where a crafted
// value could rewrite the filter — reject anything that isn't a plain UUID.
export function assertUuid(value: unknown, label = "id"): asserts value is string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
}
