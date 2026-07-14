export const GUEST_SESSION_URL = "/api/sessions/guest";
export const CURRENT_SESSION_URL = "/api/sessions/current";
export const REFRESH_SESSION_URL = "/api/sessions/refresh";
export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

export interface SessionCurrentInfo {
  expiresAt: string | null;
}

interface SessionApiError extends Error {
  status?: number;
  code?: string | null;
}

export function parseSessionExpiresAt(expiresAt: string | null): Date | null {
  if (!expiresAt) {
    return null;
  }

  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractTokenValue(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    const trimmed = payload.trim();

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return extractTokenValue(JSON.parse(trimmed) as unknown);
      } catch {
        return null;
      }
    }

    return trimmed;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.accessToken,
    record.token,
    record.data instanceof Object ? (record.data as Record<string, unknown>).accessToken : undefined,
    record.data instanceof Object ? (record.data as Record<string, unknown>).token : undefined,
    record.result instanceof Object ? (record.result as Record<string, unknown>).accessToken : undefined,
    record.result instanceof Object ? (record.result as Record<string, unknown>).token : undefined,
  ];

  const token = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof token === "string" ? token.trim() : null;
}

function extractExpiresAtValue(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.expiresAt,
    record.expires_at,
    record.data instanceof Object ? (record.data as Record<string, unknown>).expiresAt : undefined,
    record.data instanceof Object ? (record.data as Record<string, unknown>).expires_at : undefined,
    record.result instanceof Object ? (record.result as Record<string, unknown>).expiresAt : undefined,
    record.result instanceof Object ? (record.result as Record<string, unknown>).expires_at : undefined,
  ];

  const expiresAt = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof expiresAt === "string" ? expiresAt.trim() : null;
}

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function setStoredAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);

  // Notifica a useGame (y cualquier otro listener) que hay un token listo.
  // Usamos un CustomEvent porque el evento nativo `storage` solo se
  // propaga a otras pestañas, no a la pestaña que escribió el valor.
  window.dispatchEvent(new CustomEvent("amazonia:token", { detail: token }));
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const rawBody = await response.text();
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

function createSessionApiError(
  response: Response,
  payload: unknown,
  fallbackMessage: string,
): SessionApiError {
  const message = extractErrorMessage(payload) ?? fallbackMessage;
  const error = new Error(message) as SessionApiError;
  error.status = response.status;
  error.code = extractErrorCode(payload);
  return error;
}

export function getStoredAccessToken(): string | null {
  return readStoredAccessToken();
}

export async function createGuestSession(): Promise<string> {
  const response = await fetch(GUEST_SESSION_URL, { method: "POST" });

  if (!response.ok) {
    throw new Error(`Guest session request failed with status ${response.status}`);
  }

  const token = extractTokenValue(await parseResponsePayload(response));
  if (!token) {
    throw new Error("Guest session response did not include an access token.");
  }

  setStoredAccessToken(token);
  return token;
}

export async function getCurrentSessionInfo(token?: string | null): Promise<SessionCurrentInfo> {
  if (!token) {
    return { expiresAt: null };
  }

  const response = await fetch(CURRENT_SESSION_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    throw createSessionApiError(
      response,
      payload,
      `Current session request failed with status ${response.status}`,
    );
  }

  const payload = await parseResponsePayload(response);
  return { expiresAt: extractExpiresAtValue(payload) };
}

export async function refreshGuestSession(token?: string | null): Promise<string> {
  const response = await fetch(REFRESH_SESSION_URL, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    throw createSessionApiError(response, payload, `Refresh request failed with status ${response.status}`);
  }

  const payload = await parseResponsePayload(response);
  const refreshedToken = extractTokenValue(payload);
  if (!refreshedToken) {
    throw new Error("Refresh response did not include an access token.");
  }

  setStoredAccessToken(refreshedToken);
  return refreshedToken;
}

export function isTokenExpiredError(error: unknown): boolean {
  if (error instanceof Error) {
    const sessionError = error as SessionApiError;
    return (
      sessionError.status === 401 ||
      sessionError.code === "TOKEN_EXPIRED" ||
      /TOKEN_EXPIRED|El token no es valido/i.test(error.message)
    );
  }

  return false;
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.message, record.error, record.detail];
  const message = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof message === "string" ? message.trim() : null;
}

function extractErrorCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.code, record.errorCode, record.statusCode];
  const code = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof code === "string" ? code.trim() : null;
}