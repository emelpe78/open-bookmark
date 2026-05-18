export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Bitte gib eine Server-Adresse ein.");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Die Server-Adresse ist ungültig.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Die Server-Adresse ist ungültig.");
  }

  return parsed.origin;
}
