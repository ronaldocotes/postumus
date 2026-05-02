import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function ensureDirectoryExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const tradeName = formData.get("tradeName") as string;
    const cnpj = formData.get("cnpj") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const databaseUrl = formData.get("databaseUrl") as string;
    const pixKeyType = formData.get("pixKeyType") as string;
    const pixKey = formData.get("pixKey") as string;
    const pixName = formData.get("pixName") as string;
    const pixCity = formData.get("pixCity") as string;
    const logoFile = formData.get("logo") as File;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Handle logo upload
    let logoPath = null;
    if (logoFile && logoFile.size > 0) {
      try {
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), "public", "uploads");
        await ensureDirectoryExists(uploadDir);
        
        // Create filename with timestamp
        const timestamp = Date.now();
        const originalName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}_${originalName}`;
        const filepath = join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        logoPath = `/uploads/${filename}`;
      } catch (err) {
        console.error("Erro ao salvar logo:", err);
      }
    }

    const company = await prisma.company.create({
      data: {
        name,
        tradeName,
        cnpj,
        phone,
        email,
        address,
        city,
        state,
        zipCode,
        databaseUrl,
        logo: logoPath,
        pixKeyType,
        pixKey,
        pixName,
        pixCity,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const tradeName = formData.get("tradeName") as string;
    const cnpj = formData.get("cnpj") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const databaseUrl = formData.get("databaseUrl") as string;
    const pixKeyType = formData.get("pixKeyType") as string;
    const pixKey = formData.get("pixKey") as string;
    const pixName = formData.get("pixName") as string;
    const pixCity = formData.get("pixCity") as string;
    const logoFile = formData.get("logo") as File;

    if (!id || !name) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    let logoPath: string | undefined = undefined;

    // Handle logo upload
    if (logoFile && logoFile.size > 0) {
      try {
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadDir = join(process.cwd(), "public", "uploads");
        await ensureDirectoryExists(uploadDir);
        
        const timestamp = Date.now();
        const originalName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}_${originalName}`;
        const filepath = join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        logoPath = `/uploads/${filename}`;
      } catch (err) {
        console.error("Erro ao salvar logo:", err);
      }
    }

    const updateData: any = {
      name,
      tradeName,
      cnpj,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      databaseUrl,
      pixKeyType,
      pixKey,
      pixName,
      pixCity,
    };

    if (logoPath) {
      updateData.logo = logoPath;
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}
