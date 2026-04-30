// server.js
// Servidor HTTP simples que recebe dados do frontend e gera o PDF
// Rode: node server.js  →  acesse http://localhost:3001

const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const { generate } = require('./src/generator');

const PORT = 3001;

// ── CORS helpers ─────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Lê body JSON ─────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => (raw += chunk));
    req.on('end',  () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ── Roteador ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  // ── POST /api/gerar-carne ────────────────────────────
  if (req.method === 'POST' && req.url === '/api/gerar-carne') {
    try {
      const body = await readBody(req);

      // Monta config a partir dos dados recebidos do frontend
      const config = {
        empresa:      body.empresa      || 'Posthumous',
        subtitulo:    body.subtitulo    || 'Gestão de Serviços Póstumos',
        cnpj:         body.cnpj         || '12.345.678/0001-99',
        cliente:      body.cliente      || 'Cliente',
        cpf:          body.cpf          || '000.000.000-00',
        endereco:     body.endereco     || '',
        carneId:      body.carneId      || `${body.ano || 2026}-${Date.now()}`,
        total:        body.total        || 'R$ 0,00',
        nParcelas:    Number(body.nParcelas)    || 12,
        valorParcela: body.valorParcela || 'R$ 0,00',
        jurosDia:     body.jurosDia     || 'R$ 0,85/dia',
        paleta:       body.paleta       || 'azul',
        diaVencimento:Number(body.diaVencimento) || 15,
        mesInicio:    Number(body.mesInicio)     || 1,
        anoInicio:    Number(body.anoInicio)     || (body.ano || 2026),
        output:       path.join(__dirname, 'output', `carne_${Date.now()}.pdf`),
      };

      // Garante que o diretório de saída existe
      fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });

      const outputPath = await generate(config);
      const pdfBuffer  = fs.readFileSync(outputPath);

      res.writeHead(200, {
        ...CORS,
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="carne_${config.cliente.replace(/\s+/g,'_')}.pdf"`,
        'Content-Length':      pdfBuffer.length,
      });
      res.end(pdfBuffer);

      // Limpa arquivo temporário após envio
      fs.unlink(outputPath, () => {});

    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ── GET /health ──────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', message: 'Gerador de Carnê ativo' }));
  }

  // ── Serve o frontend HTML ────────────────────────────
  if (req.method === 'GET' && (req.url === '/' || req.url === '/carnes')) {
    const htmlPath = path.join(__dirname, 'public', 'carnes.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { ...CORS, 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(htmlPath));
    }
  }

  // 404
  res.writeHead(404, { ...CORS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
});

server.listen(PORT, () => {
  console.log('');
  console.log('┌──────────────────────────────────────────┐');
  console.log('│   Gerador de Carnê · API + Frontend      │');
  console.log('├──────────────────────────────────────────┤');
  console.log(`│   http://localhost:${PORT}                   │`);
  console.log(`│   POST /api/gerar-carne  → retorna PDF   │`);
  console.log(`│   GET  /health           → status        │`);
  console.log('└──────────────────────────────────────────┘');
  console.log('');
});
