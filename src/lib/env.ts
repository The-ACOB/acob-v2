import "server-only";

/** Normalize accidental wrapping or stray edge quotes without altering credentials. */
export function cleanEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let cleaned = value.trim();
  if (cleaned.length >= 2 && ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'")))) {
    cleaned = cleaned.slice(1, -1).trim();
  } else {
    cleaned = cleaned.replace(/^["']+|["']+$/g, "").trim();
  }
  return cleaned || undefined;
}

export function requireEnv(name: string): string {
  const value = cleanEnvValue(process.env[name]);
  if (!value) throw new Error(`[config] Missing required environment variable: ${name}.`);
  return value;
}

/** Production has no fallback, preventing accidental localhost canonical/email links. */
export function getSiteUrl(): string {
  const configured = cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL);
  const value = configured ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");
  if (!value) throw new Error("[config] Missing required environment variable: NEXT_PUBLIC_SITE_URL.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("[config] NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL.");
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("[config] NEXT_PUBLIC_SITE_URL must be a plain absolute http(s) origin.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("[config] NEXT_PUBLIC_SITE_URL must use https in production.");
  }
  return url.origin;
}

export function getDatabaseUrl(): string {
  return requireEnv("DATABASE_URL");
}

export function getDirectUrl(): string {
  return requireEnv("DIRECT_URL");
}

export function getEmailConfig(): { apiKey: string | undefined; from: string } {
  return {
    apiKey: cleanEnvValue(process.env.RESEND_API_KEY),
    from: cleanEnvValue(process.env.EMAIL_FROM) ?? "ACOB <no-reply@theacob.com>",
  };
}
