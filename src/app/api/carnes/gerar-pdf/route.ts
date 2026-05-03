/**
 * API Route para gerar carnês
 * POST /api/carnes/gerar-pdf
 * Gera PDF de carnê de pagamento com base nos dados fornecidos
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;
  let configFile: string | null = null;

  try {
    const body = await request.json();

    // Valida dados obrigatórios
    if (!body.cliente || !body.nParcelas) {
      return NextResponse.json(
        { error: 'Cliente e número de parcelas são obrigatórios' },
        { status: 400 }
      );
    }

    // Monta config para o gerador
    const config = {
      empresa: body.empresa || 'Posthumous',
      subtitulo: body.subtitulo || 'Gestão de Serviços Póstumos',
      cnpj: body.cnpj || '12.345.678/0001-99',
      cliente: body.cliente,
      cpf: body.cpf || '000.000.000-00',
      endereco: body.endereco || '',
      carneId: body.carneId || `${new Date().getFullYear()}-${Date.now()}`,
      total: body.total || 'R$ 0,00',
      nParcelas: Number(body.nParcelas) || 12,
      valorParcela: body.valorParcela || 'R$ 0,00',
      jurosDia: body.jurosDia || 'R$ 0,85/dia',
      paleta: body.paleta || 'azul',
      diaVencimento: Number(body.diaVencimento) || 15,
      mesInicio: Number(body.mesInicio) || 1,
      anoInicio: Number(body.anoInicio) || new Date().getFullYear(),
    };

    // Cria diretório temporário para os arquivos
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carne-'));

    // Paths para config e PDF
    configFile = path.join(tempDir, 'config.json');
    const pdfOutput = path.join(tempDir, 'carne_pagamentos.pdf');

    // Escreve config em arquivo temporário
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

    // Monta comando para executar o gerador via CLI
    const cliScript = path.join(
      process.cwd(),
      'src/lib/carnes-generator-v2/src/cli.js'
    );

    // Executa o gerador com a config
    const command = `node "${cliScript}" "${configFile}" "${pdfOutput}"`;

    try {
      await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000, // 30 segundos de timeout
      });
    } catch (error: any) {
      console.error('Erro ao executar gerador:', error);
      throw new Error(`Falha na geração do PDF: ${error.message}`);
    }

    // Verifica se PDF foi gerado
    if (!fs.existsSync(pdfOutput)) {
      throw new Error('PDF não foi gerado. Verifique se o gerador está funcionando.');
    }

    // Lê o PDF gerado
    const pdfBuffer = fs.readFileSync(pdfOutput);

    // Retorna PDF como anexo para download
    const response = new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="carne_${config.carneId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

    return response;
  } catch (error: any) {
    console.error('Erro ao gerar carnê:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar carnê' },
      { status: 500 }
    );
  } finally {
    // Limpa arquivos temporários
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('Erro ao limpar arquivos temporários:', err);
      }
    }
  }
}
