import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    // Limpar dados existentes (opcional)
    console.log('🧹 Limpando dados anteriores...');
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    console.log('✅ Limpeza concluída\n');

    // Criar Company padrão
    console.log('🏢 Criando Company...');
    const company = await prisma.company.create({
      data: {
        name: 'Postumus Funerária',
        tradeName: 'Postumus',
        cnpj: '12.345.678/0001-90',
        phone: '(91) 3000-0000',
        email: 'contato@postumus.com.br',
        address: 'Avenida Equatorial, 1000',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-000',
        pixKeyType: 'CPF',
        pixKey: '12345678900',
        pixName: 'Postumus Funerária',
        pixCity: 'Macapá',
        active: true,
      },
    });
    console.log(`✅ Company criada: ${company.name}\n`);

    // Hash de senhas
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('gerente123', 10);
    const collectorPassword = await bcrypt.hash('cobrador123', 10);

    // Criar usuários
    console.log('👥 Criando usuários...');

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@postumus.com.br',
        password: adminPassword,
        role: 'ADMIN',
        active: true,
        pin: '1234',
        zone: 'Central',
      },
    });
    console.log(`✅ Admin: ${admin.email} (senha: admin123)`);

    const gerente = await prisma.user.create({
      data: {
        name: 'Gerente Geral',
        email: 'gerente@postumus.com.br',
        password: managerPassword,
        role: 'GERENTE',
        active: true,
        pin: '5678',
        zone: 'Central',
      },
    });
    console.log(`✅ Gerente: ${gerente.email} (senha: gerente123)`);

    const secretaria = await prisma.user.create({
      data: {
        name: 'Secretária',
        email: 'secretaria@postumus.com.br',
        password: await bcrypt.hash('secretaria123', 10),
        role: 'SECRETARIA',
        active: true,
        pin: '9999',
        zone: 'Central',
      },
    });
    console.log(`✅ Secretária: ${secretaria.email} (senha: secretaria123)`);

    const cobrador1 = await prisma.user.create({
      data: {
        name: 'Cobrador João',
        email: 'joao.cobrador@postumus.com.br',
        password: collectorPassword,
        role: 'COBRADOR',
        active: true,
        pin: '1111',
        zone: 'Zona Sul',
      },
    });
    console.log(`✅ Cobrador 1: ${cobrador1.email} (senha: cobrador123)`);

    const cobrador2 = await prisma.user.create({
      data: {
        name: 'Cobrador Maria',
        email: 'maria.cobrador@postumus.com.br',
        password: collectorPassword,
        role: 'COBRADOR',
        active: true,
        pin: '2222',
        zone: 'Zona Norte',
      },
    });
    console.log(`✅ Cobrador 2: ${cobrador2.email} (senha: cobrador123)\n`);

    // Criar alguns Clientes de teste
    console.log('🤝 Criando Clientes de teste...');

    const cliente1 = await prisma.client.create({
      data: {
        code: 'CLI001',
        name: 'José Silva',
        cpf: '123.456.789-00',
        rg: '1.234.567',
        birthDate: new Date('1980-05-15'),
        phone: '3000-0001',
        cellphone: '(91) 98765-4321',
        email: 'jose@email.com',
        address: 'Rua A',
        number: '100',
        neighborhood: 'Centro',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-000',
        status: 'ACTIVE',
        monthlyValue: 500,
        cobradorId: cobrador1.id,
        active: true,
      },
    });
    console.log(`✅ Cliente 1: ${cliente1.name}`);

    const cliente2 = await prisma.client.create({
      data: {
        code: 'CLI002',
        name: 'Maria Santos',
        cpf: '987.654.321-00',
        rg: '7.654.321',
        birthDate: new Date('1975-03-20'),
        phone: '3000-0002',
        cellphone: '(91) 99876-5432',
        email: 'maria@email.com',
        address: 'Rua B',
        number: '200',
        neighborhood: 'Centro',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-000',
        status: 'ACTIVE',
        monthlyValue: 750,
        cobradorId: cobrador2.id,
        active: true,
      },
    });
    console.log(`✅ Cliente 2: ${cliente2.name}\n`);

    // Criar serviços padrão
    console.log('📋 Criando Serviços padrão...');

    const servicoVelorio = await prisma.service.create({
      data: {
        name: 'Serviço de Velório',
        description: 'Preparação e organização do velório',
        price: 1500,
        cost: 500,
        category: 'Funerário',
        active: true,
      },
    });
    console.log(`✅ Serviço: ${servicoVelorio.name}`);

    const servicoSepultamento = await prisma.service.create({
      data: {
        name: 'Serviço de Sepultamento',
        description: 'Transporte e sepultamento',
        price: 2000,
        cost: 800,
        category: 'Funerário',
        active: true,
      },
    });
    console.log(`✅ Serviço: ${servicoSepultamento.name}\n`);

    console.log('✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨');
    console.log('🎉 Seed concluído com sucesso!\n');
    console.log('📝 CREDENCIAIS DE TESTE:');
    console.log('================================');
    console.log('🔴 ADMIN:');
    console.log('   Email: admin@postumus.com.br');
    console.log('   Senha: admin123\n');
    console.log('🔵 GERENTE:');
    console.log('   Email: gerente@postumus.com.br');
    console.log('   Senha: gerente123\n');
    console.log('🟢 SECRETÁRIA:');
    console.log('   Email: secretaria@postumus.com.br');
    console.log('   Senha: secretaria123\n');
    console.log('🟡 COBRADOR:');
    console.log('   Email: joao.cobrador@postumus.com.br');
    console.log('   Senha: cobrador123\n');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
