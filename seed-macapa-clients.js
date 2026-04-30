const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Endereços reais de Macapá
const enderecosMAcapa = [
  {
    rua: "Avenida Getúlio Vargas",
    numero: "1205",
    bairro: "Centro",
    lat: -0.0278,
    lng: -51.0673,
  },
  {
    rua: "Rua Leopoldo Machado",
    numero: "452",
    bairro: "Centralzinho",
    lat: -0.0341,
    lng: -51.0702,
  },
  {
    rua: "Avenida Princesa Isabel",
    numero: "789",
    bairro: "Jaderlândia",
    lat: -0.0134,
    lng: -51.0534,
  },
  {
    rua: "Rua Tiradentes",
    numero: "234",
    bairro: "Santa Rita",
    lat: -0.0429,
    lng: -51.0748,
  },
  {
    rua: "Avenida Mendonça Júnior",
    numero: "567",
    bairro: "Trem",
    lat: -0.0196,
    lng: -51.0895,
  },
  {
    rua: "Rua Amazonas",
    numero: "890",
    bairro: "Muca",
    lat: -0.0505,
    lng: -51.0782,
  },
  {
    rua: "Avenida Padre Julio",
    numero: "1100",
    bairro: "Novo Buritizal",
    lat: 0.0012,
    lng: -51.0615,
  },
  {
    rua: "Rua Marajó",
    numero: "345",
    bairro: "Buritizal",
    lat: 0.0089,
    lng: -51.0542,
  },
  {
    rua: "Avenida Ipiranga",
    numero: "678",
    bairro: "Siqueira",
    lat: -0.0573,
    lng: -51.0612,
  },
  {
    rua: "Rua Floriano Peixoto",
    numero: "1234",
    bairro: "Centro",
    lat: -0.0301,
    lng: -51.0689,
  },
];

const nomes = [
  "Ana Silva Santos",
  "Bruno Costa Oliveira",
  "Carla Mendes Ferreira",
  "Diego Alves Ribeiro",
  "Eduarda Rocha Lima",
  "Fernando Gomes Pereira",
  "Gabriela Martins Costa",
  "Henrique Souza Barbosa",
  "Isabela Nunes Correia",
  "João Machado Tavares",
];

function gerarCPF() {
  // Gera um CPF válido (simplificado)
  const cpf = Array.from({ length: 9 })
    .map(() => Math.floor(Math.random() * 10))
    .join("");
  const digit1 = (
    ((cpf
      .split("")
      .reduce(
        (sum, digit, i) => sum + parseInt(digit) * (10 - i),
        0
      ) % 11) % 10) ^
    1
  );
  const digit2 = (
    ((cpf + digit1)
      .split("")
      .reduce((sum, digit, i) => sum + parseInt(digit) * (11 - i), 0) % 11) %
    10
  ) ^ 1;
  return cpf + digit1 + digit2;
}

function gerarTelefone() {
  const areaCode = "92"; // Macapá
  const firstPart = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  const secondPart = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `(${areaCode}) ${firstPart}-${secondPart}`;
}

function gerarDataAleatoria() {
  const agora = new Date();
  const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
  return new Date(
    umAnoAtras.getTime() +
      Math.random() * (agora.getTime() - umAnoAtras.getTime())
  );
}

async function main() {
  console.log("🌱 Iniciando seed de clientes em Macapá...");

  for (let i = 0; i < 10; i++) {
    const endereco = enderecosMAcapa[i];
    const cliente = {
      code: `CLI-${String(i + 1).padStart(4, "0")}`,
      name: nomes[i],
      cpf: gerarCPF(),
      phone: gerarTelefone(),
      cellphone: `(92) 9${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      email: `${nomes[i]
        .toLowerCase()
        .replace(/\s+/g, ".")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")}@email.com`,
      address: endereco.rua,
      number: endereco.numero,
      neighborhood: endereco.bairro,
      city: "Macapá",
      state: "AP",
      zipCode: "69000-000",
      contractDate: gerarDataAleatoria(),
      monthlyValue: Math.floor(Math.random() * 3000) + 500,
      status: "ACTIVE",
      active: true,
      latitude: endereco.lat,
      longitude: endereco.lng,
      dueDay: Math.floor(Math.random() * 28) + 1,
      zone: `Zona-${Math.floor(Math.random() * 5) + 1}`,
    };

    try {
      const clienteCriado = await prisma.client.create({
        data: cliente,
      });
      console.log(
        `✅ Cliente ${i + 1}/10 criado: ${clienteCriado.name} (${clienteCriado.code})`
      );
    } catch (error) {
      console.error(
        `❌ Erro ao criar cliente ${i + 1}: ${error.message}`
      );
    }
  }

  console.log("\n✨ Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
