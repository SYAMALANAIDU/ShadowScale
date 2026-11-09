const SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "api_key",
  "apikey",
  "authorization",
  "email",
  "access_key",
  "private_key",
];

export function maskSensitiveData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (data !== null && typeof data === "object") {
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key.toLowerCase();

      if (
        SENSITIVE_KEYS.some((sensitiveKey) =>
          normalizedKey.includes(sensitiveKey)
        )
      ) {
        masked[key] = "[REDACTED]";
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }

    return masked;
  }

  if (typeof data === "string") {
    return data
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
      .replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[REDACTED_EMAIL]"
      );
  }

  return data;
}