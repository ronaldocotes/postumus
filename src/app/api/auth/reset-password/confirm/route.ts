import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Armazenar tokens em memória (em produção, usar banco de dados)
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    // Validação
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "Senha é obrigatória" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Validar token
    const resetData = resetTokens.get(token);

    if (!resetData) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    if (resetData.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: "Token expirou" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: resetData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Limpar token
    resetTokens.delete(token);

    return NextResponse.json(
      {
        success: true,
        message: "Senha redefinida com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Confirm reset password error:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
