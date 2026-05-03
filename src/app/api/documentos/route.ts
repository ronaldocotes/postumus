import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const deathRecordId = searchParams.get("deathRecordId");

  const where: any = {};
  if (clientId) where.clientId = clientId;
  if (deathRecordId) where.deathRecordId = deathRecordId;

  const documents = await prisma.document.findMany({
    where,
    include: {
      client: { select: { name: true } },
      deathRecord: { select: { deceasedName: true } },
      uploadedBy: { select: { name: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const clientId = formData.get("clientId") as string;
  const deathRecordId = formData.get("deathRecordId") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const notes = formData.get("notes") as string;

  if (!file || !name) {
    return NextResponse.json({ error: "Arquivo e nome são obrigatórios" }, { status: 400 });
  }

  // Salvar arquivo localmente (em produção, usar S3/R2)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const uploadDir = "./public/uploads";

  // Criar diretório se não existir
  const fs = await import("fs");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filepath = `${uploadDir}/${filename}`;
  fs.writeFileSync(filepath, buffer);

  const doc = await prisma.document.create({
    data: {
      clientId: clientId || null,
      deathRecordId: deathRecordId || null,
      name,
      filename: file.name,
      url: `/uploads/${filename}`,
      size: file.size,
      mimeType: file.type,
      category: category || "OUTRO",
      notes: notes || null,
      uploadedById: userId,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
