import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Token de reset com expiração
interface ResetToken {
  token: string;
  email: string;
  expiresAt: number;
}

// Armazenar tokens em memória (em produção, usar banco de dados)
const resetTokens = new Map<string, ResetToken>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validação
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por segurança, não revelar se o email existe ou não
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "Se o email existir, você receberá um link de redefinição",
        },
        { status: 200 }
      );
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora

    // Armazenar token
    resetTokens.set(token, {
      token,
      email: user.email,
      expiresAt,
    });

    // TODO: Enviar email com o link de reset
    // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm?token=${token}`;
    // await sendResetEmail(user.email, resetLink);

    // Por enquanto, retornar o token em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(`
        🔐 Reset Password Token (Development Only)
        Email: ${user.email}
        Token: ${token}
        Reset Link: http://localhost:3000/auth/reset-password/confirm?token=${token}
        Expires: ${new Date(expiresAt).toISOString()}
      `);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email de redefinição enviado com sucesso",
        ...(process.env.NODE_ENV === "development" && { token }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

// Endpoint para confirmar reset com token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(
      {
        success: true,
        email: resetData.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get reset token error:", error);
    return NextResponse.json(
      { error: "Erro ao validar token" },
      { status: 500 }
    );
  }
}
