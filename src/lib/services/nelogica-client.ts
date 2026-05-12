import { ProxyAgent, fetch as undiciFetch, Dispatcher } from "undici";

// In-memory token storage to avoid frequent logins during function lifespan (Bearer mode only)
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;
const TOKEN_TTL_MS = 25 * 60 * 1000; // 25 minutes (expires at 30 min)

type NelogicaAuthResponse = {
  status?: string;
  token?: string;
};

/**
 * Quando `NELOGICA_PROXY_URL` está definida, roteia as chamadas Nelogica por um proxy HTTP/HTTPS.
 * Útil em dev local — o IP do dev não está na whitelist da Nelogica, mas a VPS sim.
 * Exemplo: `NELOGICA_PROXY_URL=http://76.13.175.81:8888` (proxy HTTP rodando na VPS via tinyproxy ou similar).
 *
 * Para túnel SSH simples, recomendamos SOCKS via ssh -D, mas como undici só aceita HTTP proxy aqui,
 * use HTTP proxy na VPS (mais portável e mais rápido).
 */
let cachedDispatcher: Dispatcher | null = null;
function getProxyDispatcher(): Dispatcher | null {
  const proxyUrl = process.env.NELOGICA_PROXY_URL;
  if (!proxyUrl) return null;
  if (!cachedDispatcher) {
    cachedDispatcher = new ProxyAgent({ uri: proxyUrl });
    console.log(`[Nelogica] usando proxy: ${proxyUrl}`);
  }
  return cachedDispatcher;
}

async function nelogicaFetch(url: string, init: { method: string; headers: Record<string, string>; body?: string }) {
  const dispatcher = getProxyDispatcher();
  if (dispatcher) {
    return undiciFetch(url, { ...init, dispatcher });
  }
  return fetch(url, init);
}

export class NelogicaClient {
  private static get baseUrl() {
    return process.env.NELOGICA_BASE_URL || "https://api-broker3.nelogica.com.br/";
  }

  // Modo A: chave DLL estática — injeta authenticationCode no body de cada request.
  // Quando definida, o fluxo de login (modo B) é ignorado.
  private static get authCode(): string | null {
    return process.env.NELOGICA_AUTH_CODE ?? null;
  }

  /**
   * Modo B (fallback): obtém Bearer token via login user/password.
   */
  private static async getToken(): Promise<string> {
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      return cachedToken;
    }

    const user = process.env.NELOGICA_USER;
    const password = process.env.NELOGICA_PASSWORD;

    if (!user || !password) {
      throw new Error(
        "[Nelogica] Credenciais não configuradas. Defina NELOGICA_AUTH_CODE (recomendado) ou NELOGICA_USER + NELOGICA_PASSWORD no .env.local"
      );
    }

    const loginUrl = new URL("login", this.baseUrl).toString();
    console.log(`[Nelogica] → LOGIN ${loginUrl} | user=${user}`);

    const response = await nelogicaFetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });

    const raw = await response.text();
    console.log(`[Nelogica] ← LOGIN status=${response.status} body=${raw}`);

    if (!response.ok) {
      throw new Error(`[Nelogica] HTTP erro no login: ${response.status}`);
    }

    const data = JSON.parse(raw) as NelogicaAuthResponse;

    if (data.status !== "1" || !data.token) {
      throw new Error(`[Nelogica] Falha no login: ${raw}`);
    }

    cachedToken = data.token;
    tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
    console.log("[Nelogica] Token cacheado por 25 min.");

    return cachedToken as string;
  }

  /**
   * Executa uma chamada para o endpoint /request.php.
   *
   * Modo A (NELOGICA_AUTH_CODE definido): inclui authenticationCode no body — sem login.
   * Modo B (fallback): faz login e usa Authorization: Bearer no header.
   */
  public static async execute<T = unknown>(
    requestName: string,
    payload: Record<string, unknown> = {}
  ): Promise<T> {
    const authCode = this.authCode;
    const origin = process.env.NELOGICA_ORIGIN || "";
    const requestUrl = new URL("request.php", this.baseUrl).toString();

    let headers: Record<string, string>;
    let body: Record<string, unknown>;
    let authMode: string;

    if (authCode) {
      authMode = "authCode";
      headers = {
        "Content-Type": "application/json",
        "Origin": origin,
      };
      body = {
        request: requestName,
        authenticationCode: authCode,
        ...payload,
      };
    } else {
      authMode = "bearer";
      const token = await this.getToken();
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Origin": origin,
      };
      body = {
        request: requestName,
        ...payload,
      };
    }

    // Log da requisição (omite authenticationCode por segurança)
    const logBody = { ...body, authenticationCode: authCode ? "***" : undefined };
    console.log(
      `[Nelogica] → REQUEST [${authMode}] ${requestUrl}\n` +
      `  body: ${JSON.stringify(logBody)}\n` +
      `  origin: "${origin}"`
    );

    const response = await nelogicaFetch(requestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    console.log(
      `[Nelogica] ← RESPONSE request=${requestName} status=${response.status}\n` +
      `  body: ${raw.length > 500 ? raw.slice(0, 500) + "…" : raw}`
    );

    if (!response.ok) {
      throw new Error(`[Nelogica] HTTP error on request '${requestName}': ${response.status}`);
    }

    const data = JSON.parse(raw);
    return data as T;
  }
}
