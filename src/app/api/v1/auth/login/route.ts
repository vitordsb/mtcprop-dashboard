import { loginSchema } from "@/validators/auth";
import {
  applySessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import { errorResponse, successResponse } from "@/lib/http";
import { authService } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const adminUser = await authService.login(input);

    if (!adminUser) {
      return errorResponse(401, "INVALID_CREDENTIALS", "Credenciais invalidas.");
    }

    const sessionToken = await createSessionToken({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    });

    const response = successResponse({ adminUser });
    applySessionCookie(response, sessionToken);
    return response;
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "Dados de acesso invalidos.");
  }
}
