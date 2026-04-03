export function formatUnknownError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function truncateDetail(s: string, max = 4000): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
