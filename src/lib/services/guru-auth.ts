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
    const response = await fetch(input, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 401 && response.status !== 403) {
      return response;
    }

    lastResponse = response;
  }

  return lastResponse as Response;
}
