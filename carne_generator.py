#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Carnês de Pagamento em PDF
Especificações: 4 cupons por página A4, 2 vias (cobrador e cliente)
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color, black, white
from reportlab.pdfgen import canvas
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, PageBreak, Spacer, Table, TableStyle, Paragraph
from datetime import datetime, timedelta
from reportlab.lib import colors
import os

# ───────────────────────────────────────────────────────────────────────────────
# CONFIGURAÇÃO DE DADOS
# ───────────────────────────────────────────────────────────────────────────────

EMPRESA = "Posthumous"
SUBTITULO = "Gestão de Serviços Póstumos"
CLIENTE = "Ana Costa"
CPF = "123.456.789-00"
TOTAL = 3050.00
PARCELAS = 12
CARNE_ID = "2026-4567"

# Paleta de cores - Azul Corporativo (como no HTML)
PALETA = {
    "dark": HexColor("#1e3a5f"),
    "accent": HexColor("#2563eb"),
    "light": HexColor("#dbeafe"),
    "xlight": HexColor("#eff6ff"),
    "text": HexColor("#1e293b"),
    "label": HexColor("#93c5fd"),
    "border": HexColor("#bfdbfe"),
    "perf": HexColor("#60a5fa"),
}

# Cálculos
VALOR_PARCELA = TOTAL / PARCELAS
DATA_BASE = datetime(2026, 9, 1)

# ───────────────────────────────────────────────────────────────────────────────
# GERAÇÃO DO PDF
# ───────────────────────────────────────────────────────────────────────────────

class CarneGenerator:
    def __init__(self, filename="carne_pagamentos.pdf"):
        self.filename = filename
        self.page_width, self.page_height = A4
        self.margin = 10 * mm
        self.cupom_height = 65.5 * mm
        self.cupom_width = self.page_width - (2 * self.margin)
        
    def draw_cupom(self, c, y_pos, numero_parcela):
        """Desenha um cupom com 2 vias"""
        x_start = self.margin
        cupom_width = self.cupom_width
        cupom_height = self.cupom_height
        
        # Calcula datas
        mes = (numero_parcela - 1) % 12
        ano_ref = 2026 + ((numero_parcela - 1) // 12)
        data_ref = f"{numero_parcela:02d}/2026"
        data_venc = (DATA_BASE + timedelta(days=30 * (numero_parcela - 1))).strftime("%d/%m/%Y")
        
        # ────────────────────────────────────────────────────────────────────
        # VIA COBRADOR (esquerda - 38%)
        # ────────────────────────────────────────────────────────────────────
        via_cobrador_width = cupom_width * 0.38
        
        # Fundo claro
        c.setFillColor(PALETA["light"])
        c.rect(x_start, y_pos, via_cobrador_width, cupom_height, fill=1, stroke=0)
        
        # Barra superior escura
        barra_height = 7 * mm
        c.setFillColor(PALETA["dark"])
        c.rect(x_start, y_pos + cupom_height - barra_height, via_cobrador_width, barra_height, fill=1, stroke=0)
        
        # Texto barra: empresa e via
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(white)
        c.drawString(x_start + 3 * mm, y_pos + cupom_height - barra_height + 2 * mm, EMPRESA)
        c.drawRightString(x_start + via_cobrador_width - 2 * mm, y_pos + cupom_height - barra_height + 2 * mm, "VIA COBRADOR")
        
        # Conteúdo via cobrador
        c.setFont("Helvetica", 6.5)
        c.setFillColor(PALETA["text"])
        
        y_content = y_pos + cupom_height - barra_height - 4 * mm
        
        # Cliente
        c.setFillColor(PALETA["accent"])
        c.setFont("Helvetica-Bold", 5.5)
        c.drawString(x_start + 3 * mm, y_content, "CLIENTE")
        c.setFont("Helvetica", 6)
        c.setFillColor(PALETA["text"])
        c.drawString(x_start + 3 * mm, y_content - 2.5 * mm, CLIENTE)
        
        # Referência e Vencimento
        y_content -= 7 * mm
        c.setFillColor(PALETA["accent"])
        c.setFont("Helvetica-Bold", 5.5)
        c.drawString(x_start + 3 * mm, y_content, "REF.")
        c.setFont("Helvetica", 6)
        c.setFillColor(PALETA["text"])
        c.drawString(x_start + 3 * mm, y_content - 2.5 * mm, data_ref)
        
        c.setFillColor(PALETA["accent"])
        c.setFont("Helvetica-Bold", 5.5)
        c.drawString(x_start + 3 * mm, y_content - 5 * mm, "VENC.")
        c.setFont("Helvetica", 6)
        c.setFillColor(PALETA["text"])
        c.drawString(x_start + 3 * mm, y_content - 7.5 * mm, data_venc)
        
        # Número da parcela (grande)
        c.setFillColor(PALETA["accent"])
        c.setFont("Helvetica-Bold", 14)
        parcela_text = f"{numero_parcela:02d}/{PARCELAS:02d}"
        c.drawRightString(x_start + via_cobrador_width - 3 * mm, y_pos + 3 * mm, parcela_text)
        
        # ────────────────────────────────────────────────────────────────────
        # LINHA PERFURADA (vertical)
        # ────────────────────────────────────────────────────────────────────
        perf_x = x_start + via_cobrador_width + 2.5 * mm
        c.setStrokeColor(PALETA["perf"])
        c.setLineWidth(0.5)
        dash_height = 2 * mm
        dash_gap = 1.5 * mm
        
        for y in range(int(y_pos), int(y_pos + cupom_height), int(dash_height + dash_gap)):
            c.line(perf_x, y, perf_x, min(y + dash_height, y_pos + cupom_height))
        
        # ────────────────────────────────────────────────────────────────────
        # VIA CLIENTE (direita - 62%)
        # ────────────────────────────────────────────────────────────────────
        via_cliente_x = x_start + via_cobrador_width + 5 * mm
        via_cliente_width = cupom_width - via_cobrador_width - 5 * mm
        
        # Fundo branco
        c.setFillColor(white)
        c.rect(via_cliente_x, y_pos, via_cliente_width, cupom_height, fill=1, stroke=1)
        c.setStrokeColor(PALETA["border"])
        c.setLineWidth(1)
        c.rect(via_cliente_x, y_pos, via_cliente_width, cupom_height, stroke=1)
        
        # Barra superior
        c.setFillColor(PALETA["dark"])
        c.rect(via_cliente_x, y_pos + cupom_height - barra_height, via_cliente_width, barra_height, fill=1, stroke=0)
        
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(white)
        c.drawString(via_cliente_x + 3 * mm, y_pos + cupom_height - barra_height + 2 * mm, EMPRESA)
        c.drawRightString(via_cliente_x + via_cliente_width - 2 * mm, y_pos + cupom_height - barra_height + 2 * mm, "VIA CLIENTE/RECIBO")
        
        # Conteúdo dividido em 2 colunas
        col_width = (via_cliente_width - 6 * mm) / 2
        col1_x = via_cliente_x + 3 * mm
        col2_x = via_cliente_x + col_width + 3 * mm
        
        y_content = y_pos + cupom_height - barra_height - 3 * mm
        
        # Coluna 1
        c.setFont("Helvetica-Bold", 5)
        c.setFillColor(HexColor("#64748b"))
        c.drawString(col1_x, y_content, "CLIENTE")
        c.setFont("Helvetica", 6)
        c.setFillColor(PALETA["text"])
        c.drawString(col1_x, y_content - 2.5 * mm, CLIENTE)
        
        y_content -= 6 * mm
        c.setFont("Helvetica-Bold", 5)
        c.setFillColor(HexColor("#64748b"))
        c.drawString(col1_x, y_content, "REFERÊNCIA")
        c.setFont("Helvetica", 6)
        c.setFillColor(PALETA["text"])
        c.drawString(col1_x, y_content - 2.5 * mm, data_ref)
        
        y_content -= 6 * mm
        c.setFont("Helvetica-Bold", 5)
        c.setFillColor(HexColor("#64748b"))
        c.drawString(col1_x, y_content, "VENCIMENTO")
        c.setFont("Helvetica", 6)
        c.setFillColor(PALETA["text"])
        c.drawString(col1_x, y_content - 2.5 * mm, data_venc)
        
        # Coluna 2
        y_content = y_pos + cupom_height - barra_height - 3 * mm
        
        c.setFont("Helvetica-Bold", 5)
        c.setFillColor(HexColor("#64748b"))
        c.drawString(col2_x, y_content, "PARCELA")
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(PALETA["accent"])
        c.drawString(col2_x, y_content - 3.5 * mm, parcela_text)
        
        y_content -= 9 * mm
        c.setFont("Helvetica-Bold", 5)
        c.setFillColor(HexColor("#64748b"))
        c.drawString(col2_x, y_content, "VALOR")
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(PALETA["dark"])
        valor_text = f"R$ {VALOR_PARCELA:,.2f}".replace(".", ",")
        c.drawString(col2_x, y_content - 2.5 * mm, valor_text)
        
        # Badge de status
        y_content -= 6 * mm
        c.setFillColor(HexColor("#fef3c7"))
        c.rect(col2_x, y_content - 2.5 * mm, 16 * mm, 3 * mm, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 5)
        c.setFillColor(HexColor("#b45309"))
        c.drawString(col2_x + 1.5 * mm, y_content - 1.5 * mm, "PENDENTE")
        
    def draw_linha_corte(self, c, y_pos):
        """Desenha linha de corte entre cupons"""
        c.setStrokeColor(HexColor("#cbd5e1"))
        c.setLineWidth(0.5)
        dash = [2, 2]
        c.setDash(dash)
        
        x_start = self.margin
        x_end = self.page_width - self.margin
        
        # Símbolo de tesoura
        c.setDash([])
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#cbd5e1"))
        c.drawString((self.page_width - 4 * mm) / 2, y_pos - 1.5 * mm, "✂")
        
        # Linhas
        c.setDash(dash)
        c.line(x_start, y_pos, (self.page_width - 6 * mm) / 2, y_pos)
        c.line((self.page_width + 6 * mm) / 2, y_pos, x_end, y_pos)
        c.setDash([])
        
    def generate(self):
        """Gera o PDF com 4 cupons por página"""
        # Cria PDF
        c = canvas.Canvas(self.filename, pagesize=A4)
        
        # Adiciona metadados
        c.setTitle("Carnê de Pagamento - Posthumous")
        c.setAuthor("Posthumous - Sistema de Gestão")
        
        cupom_atual = 1
        y_pos = self.page_height - self.margin - self.cupom_height
        cupons_por_pagina = 4
        
        # Total de parcelas (por padrão 12)
        for i in range(PARCELAS):
            # Desenha cupom
            self.draw_cupom(c, y_pos, cupom_atual)
            
            # Próxima posição
            y_pos -= self.cupom_height + 2 * mm
            
            # Linha de corte
            if i < PARCELAS - 1:
                self.draw_linha_corte(c, y_pos)
                y_pos -= 3 * mm
            
            cupom_atual += 1
            
            # Pula página após 4 cupons
            if cupom_atual % (cupons_por_pagina + 1) == 1 and i < PARCELAS - 1:
                c.showPage()
                y_pos = self.page_height - self.margin - self.cupom_height
        
        # Rodapé informações
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#6b7280"))
        c.drawString(self.margin, 8 * mm, f"Carnê nº {CARNE_ID} • Cliente: {CLIENTE} • CPF: {CPF}")
        c.drawString(self.margin, 5 * mm, f"Total: R$ {TOTAL:,.2f} • Parcelas: {PARCELAS}x R$ {VALOR_PARCELA:,.2f}")
        c.drawString(self.margin, 2 * mm, f"Gerado em: {datetime.now().strftime('%d/%m/%Y às %H:%M')}")
        
        # Salva
        c.save()
        print(f"✓ PDF gerado com sucesso: {self.filename}")
        print(f"  - {PARCELAS} parcelas")
        print(f"  - Total: R$ {TOTAL:,.2f}")
        print(f"  - Valor parcela: R$ {VALOR_PARCELA:,.2f}")

# ───────────────────────────────────────────────────────────────────────────────
# EXECUÇÃO
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    output_path = os.path.expanduser("~/Downloads/carne_pagamentos.pdf")
    generator = CarneGenerator(output_path)
    generator.generate()
