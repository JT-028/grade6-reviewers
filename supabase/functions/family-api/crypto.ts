export const PIN_ITERATIONS = 600_000;
const encoder = new TextEncoder();

export function randomHex(bytes: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  if (!/^(?:[a-f0-9]{2})+$/i.test(hex)) throw new Error("Invalid hexadecimal value");
  return new Uint8Array(hex.match(/../g)!.map((pair) => parseInt(pair, 16)));
}

export async function sha256(value: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function mutationDigest(value: string, secret: string): Promise<string> {
  return await hmacSha256(`family-mutation-v1:${value}`, secret);
}

export async function hmacSha256(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    fromHex(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(value),
      ),
    ),
  );
}

export async function hashPin(pin: string, salt: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${pin}:${pepper}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(salt), iterations: PIN_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

export function constantTimeEqual(left: string, right: string): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index++) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

/** Object key ordering must not make an immutable mutation appear different. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${
      Object.keys(record).sort().map((key) =>
        `${JSON.stringify(key)}:${canonicalJson(record[key])}`
      ).join(",")
    }}`;
  }
  return JSON.stringify(value);
}

export function approvalCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => alphabet[byte & 31])
    .join("");
}
