export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = false,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const HEX_256 = /^[a-f0-9]{64}$/i;

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "INVALID_BODY", "A JSON object is required.");
  }
  return value as Record<string, unknown>;
}

export function fields(body: Record<string, unknown>, allowed: string[], required: string[] = []) {
  if (
    Object.keys(body).some((key) => !allowed.includes(key)) ||
    required.some((key) => !(key in body))
  ) {
    throw new ApiError(400, "INVALID_FIELDS", "The request has missing or unsupported fields.");
  }
}

export function text(value: unknown, name: string, minimum: number, maximum: number): string {
  if (
    typeof value !== "string" || value.trim().length < minimum || value.trim().length > maximum ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new ApiError(400, "INVALID_FIELD", `${name} is invalid.`);
  }
  return value.trim();
}

export function uuid(value: unknown, name = "ID"): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new ApiError(400, "INVALID_ID", `${name} is invalid.`);
  }
  return value.toLowerCase();
}

export function pin(value: unknown): string {
  if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
    throw new ApiError(400, "INVALID_PIN", "Use a six-digit PIN.");
  }
  return value;
}

export function ids(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new ApiError(400, "INVALID_CHILDREN", "Select between one and twenty profiles.");
  }
  const result = value.map((id) => uuid(id));
  if (new Set(result).size !== result.length) {
    throw new ApiError(400, "INVALID_CHILDREN", "Profiles must be unique.");
  }
  return result;
}

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.split(";")[0].trim().endsWith("application/json")) {
    throw new ApiError(400, "INVALID_BODY", "Use application/json.");
  }
  const maximum = 8192;
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_BODY", "A request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new ApiError(413, "BODY_TOO_LARGE", "The request is too large.");
    }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "INVALID_JSON", "Valid JSON is required.");
  }
}
