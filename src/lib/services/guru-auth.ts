function sanitizeToken(value: string | undefined | null) {
  const token = value?.trim() || null;

  if (!token || token.startsWith("cole-o-")) {
    return null;
  }

  return token;
}

export function getGuruReadToken() {
  return sanitizeToken(process.env.GURU_USER_TOKEN) ?? sanitizeToken(process.env.GURU_ACCOUNT_TOKEN);
}

export function hasGuruReadToken() {
  return getGuruReadTokenCandidates().length > 0;
}

export function getGuruUserTokenOnly() {
  return sanitizeToken(process.env.GURU_USER_TOKEN);
}

export function getGuruAccountTokenOnly() {
  return sanitizeToken(process.env.GURU_ACCOUNT_TOKEN);
}

export function getGuruReadTokenCandidates() {
  return Array.from(
    new Set([getGuruUserTokenOnly(), getGuruAccountTokenOnly()].filter((token): token is string => Boolean(token))),
  );
}

const GURU_REQUEST_TIMEOUT_MS = 8000;

export async function fetchGuruWithReadAuth(
  input: string,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit } = {},
) {
  const tokens = getGuruReadTokenCandidates();

  if (tokens.length === 0) {
    throw new Error("Nenhum token de leitura da Guru configurado.");
  }

  let lastResponse: Response | null = null;

  for (const token of tokens) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GURU_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status !== 401 && response.status !== 403) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`[Guru] timeout após ${GURU_REQUEST_TIMEOUT_MS}ms em ${input}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return lastResponse as Response;
}
