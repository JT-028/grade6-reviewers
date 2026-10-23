import { createClient } from "@supabase/supabase-js";
import { ApiError, HEX_256 } from "./validation.ts";

export interface FamilyRepository {
  verifyParent(token: string): Promise<string>;
  dispatch(
    operation: string,
    context: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export function bearer(request: Request, opaque = false): string {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  if (!match || (opaque && !HEX_256.test(match[1]))) {
    throw new ApiError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Sign in or unlock your profile to continue.",
    );
  }
  return match[1];
}

export function supabaseRepository(url: string, serviceKey: string): FamilyRepository {
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)])
            : AbortSignal.timeout(10_000),
        }),
    },
  });
  return {
    async verifyParent(token) {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user?.id) {
        throw new ApiError(401, "PARENT_SIGN_IN_REQUIRED", "Sign in to your parent account again.");
      }
      return data.user.id;
    },
    async dispatch(operation, credential_context, payload) {
      const { data, error } = await client.rpc("family_dispatch", {
        operation,
        credential_context,
        payload,
      });
      if (error || !data || typeof data !== "object" || Array.isArray(data)) {
        throw new ApiError(
          503,
          "SERVICE_UNAVAILABLE",
          "Family access is temporarily unavailable.",
          true,
        );
      }
      const response = data as Record<string, unknown>;
      if (response._error === true) {
        const status = Number(response.status);
        throw new ApiError(
          status >= 400 && status <= 599 ? status : 503,
          typeof response.code === "string" ? response.code : "SERVICE_UNAVAILABLE",
          typeof response.message === "string" ? response.message : "Family access is unavailable.",
          status === 429 || status >= 500,
          typeof response.retry_after === "number" ? response.retry_after : undefined,
        );
      }
      return response;
    },
  };
}
