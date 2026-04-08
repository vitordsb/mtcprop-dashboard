import { forgotPasswordSchema } from "@/validators/auth";
import { errorResponse, successResponse } from "@/lib/http";
import { passwordResetService } from "@/lib/services/password-reset-service";

export async function POST(request: Request) {
  try {
    const input = forgotPasswordSchema.parse(await request.json());
    const origin = process.env.APP_URL?.trim() || new URL(request.url).origin;

    await passwordResetService.request(input, origin);

    return successResponse({
      message:
        "Se existir um acesso interno com esse e-mail, enviaremos um link para redefinir a senha.",
    });
  } catch (error) {
    console.error("[auth:forgot-password] falhou", error);
    return errorResponse(
      400,
      "INVALID_REQUEST",
      "Nao foi possivel iniciar a recuperacao de senha.",
    );
  }
}
