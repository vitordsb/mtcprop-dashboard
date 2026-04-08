// In-memory token storage to avoid frequent logins during function lifespan
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;
const TOKEN_TTL_MS = 25 * 60 * 1000; // 25 minutes (expires at 30 min)

type NelogicaAuthResponse = {
  status?: string;
  token?: string;
};

export class NelogicaClient {
  private static get baseUrl() {
    return process.env.NELOGICA_BASE_URL || "https://api-broker3-dev.nelogica.com.br/";
  }

  /**
   * Obtém o token atual, fazendo login se necessário ou se estiver perto de expirar.
   */
  private static async getToken(): Promise<string> {
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      return cachedToken;
    }

    console.log("[Nelogica] Fetching new auth token...");

    const payload = {
      user: process.env.NELOGICA_USER,
      password: process.env.NELOGICA_PASSWORD,
    };

    const response = await fetch(new URL("login", this.baseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[Nelogica] HTTP erro no login: ${response.status}`);
    }

    const data = (await response.json()) as NelogicaAuthResponse;

    if (data.status !== "1" || !data.token) {
      throw new Error(`[Nelogica] Falha no login: ${JSON.stringify(data)}`);
    }

    cachedToken = data.token;
    tokenExpiresAt = Date.now() + TOKEN_TTL_MS;

    return cachedToken as string;
  }

  /**
   * Executa uma chamada para o endpoint /request.php
   */
  public static async execute<T = unknown>(
    requestName: string,
    payload: Record<string, unknown> = {}
  ): Promise<T> {
    const token = await this.getToken();

    const body = {
      request: requestName,
      ...payload,
    };

    const response = await fetch(new URL("request.php", this.baseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Origin": process.env.NELOGICA_ORIGIN || "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`[Nelogica] HTTP error on request '${requestName}': ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  }
}
