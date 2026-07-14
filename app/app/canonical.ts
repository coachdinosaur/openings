const EXCLUDED_KEYS = new Set(["timestamp", "generatedId", "absolutePath", "importRunId", "machineName", "userName", "temporaryPath"]);

export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !EXCLUDED_KEYS.has(key))
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function sha256(data: string | ArrayBuffer): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export const EXPECTED_B2_LESSON_HASH = "2B35452A27F6D6E413EDC5226D694D4986D8D2EDAC458CD5C2427A6EE0F6DFC0";
export const EXPECTED_CHAPTER2_LESSON_HASH = "29884B4B2CBDDBE9AB730C169640EB2077ACB034DDD0FD75E0E2BE63637C7369";
export const EXPECTED_CHAPTER3_LESSON_HASH = "037FE07522CE37C6633A23ED833B00A7FD9E4353FBC3386D5EFE9CF03C46D41A";
