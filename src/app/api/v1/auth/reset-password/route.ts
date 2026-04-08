import { resetPasswordSchema } from "@/validators/auth";
import { errorResponse, successResponse } from "@/lib/http";
import { passwordResetService } from "@/lib/services/password-reset-service";

export async function POST(request: Request) {
  try {
    const input = resetPasswordSchema.parse(await request.json());
    const result = await passwordResetService.reset(input);

    if (!result.success) {
      return errorResponse(
        400,
        "INVALID_TOKEN",
        "O link de redefinicao e invalido ou expirou. Solicite um novo acesso.",
      );
    }

    return successResponse({
      message: "Senha redefinida com sucesso.",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse(
        400,
        "INVALID_REQUEST",
        "Revise a nova senha e tente novamente.",
      );
    }

    console.error("[auth:reset-password] falhou", error);

    return errorResponse(
      400,
      "INVALID_REQUEST",
      "Nao foi possivel redefinir a senha agora.",
    );
  }
}
