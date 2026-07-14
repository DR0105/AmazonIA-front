"use client";

import { useEffect } from "react";

import {
  createGuestSession,
  getCurrentSessionInfo,
  getStoredAccessToken,
  isTokenExpiredError,
  parseSessionExpiresAt,
  refreshGuestSession,
} from "./session";

const REFRESH_MARGIN_MS = 60_000;

export function useGuestSessionToken(enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const clearScheduledRefresh = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleNextRefresh = (expiresAt: string | null, token: string) => {
      clearScheduledRefresh();

      const expiresAtDate = parseSessionExpiresAt(expiresAt);
      if (!expiresAtDate || cancelled) {
        return;
      }

      const delay = expiresAtDate.getTime() - Date.now() - REFRESH_MARGIN_MS;
      if (delay <= 0) {
        void refreshAndReschedule(token);
        return;
      }

      timeoutId = window.setTimeout(() => {
        void refreshAndReschedule(token);
      }, delay);
    };

    const loadCurrentSession = async (token: string) => {
      const currentInfo = await getCurrentSessionInfo(token);
      if (cancelled) {
        return;
      }

      scheduleNextRefresh(currentInfo.expiresAt, token);
    };

    const refreshAndReschedule = async (token: string) => {
      try {
        const refreshedToken = await refreshGuestSession(token);
        if (cancelled) {
          return;
        }

        await loadCurrentSession(refreshedToken);
      } catch (error) {
        if (!isTokenExpiredError(error)) {
          throw error;
        }

        const renewedToken = await createGuestSession();
        if (cancelled) {
          return;
        }

        await loadCurrentSession(renewedToken);
      }
    };

    void (async () => {
      const storedToken = getStoredAccessToken();

      if (!storedToken) {
        const token = await createGuestSession();
        if (!cancelled) {
          await loadCurrentSession(token);
        }
        return;
      }

      try {
        await loadCurrentSession(storedToken);
      } catch (error) {
        if (isTokenExpiredError(error)) {
          await refreshAndReschedule(storedToken);
          return;
        }

        throw error;
      }
    })().catch((error) => {
      console.error("No se pudo generar la sesión de invitado:", error);
    });

    return () => {
      cancelled = true;
      clearScheduledRefresh();
    };
  }, [enabled]);
}
