import { NextRequest, NextResponse } from "next/server";

// GET: Retorna VAPID public key
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID key não configurada" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey });
}
