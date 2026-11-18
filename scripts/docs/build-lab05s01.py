"""Gera o PDF do S01 a partir do Markdown e dos PNGs PlantUML locais.

Dependências de documentação: ReportLab e Pillow. Não faz parte do Worker.
"""
from __future__ import annotations

import html
import os
import re
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A2, A3, A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs' / 'release-3'
SOURCE = DOCS / 'lab05s01.md'
OUTPUT = DOCS / 'Lab05S01-Meritus.pdf'
GREEN = colors.HexColor('#173E35')
INK = colors.HexColor('#243D35')
MUTED = colors.HexColor('#566A61')
RULE = colors.HexColor('#D7E1DA')
MARGIN = 47
TOP = 62
BOTTOM = 47


def fonts():
    directory = Path(os.environ.get('LAB05_FONT_DIR', 'C:/Windows/Fonts'))
    for name, filename in [('Body', 'arial.ttf'), ('BodyBold', 'arialbd.ttf'),
                           ('BodyItalic', 'ariali.ttf'), ('Code', 'consola.ttf')]:
        path = directory / filename
        if not path.is_file():
            raise FileNotFoundError(f'Fonte ausente: {path}. Configure LAB05_FONT_DIR.')
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='BodyItalic', boldItalic='BodyBold')


def inline(value):
    value = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: m[1], value)
    value = html.escape(value)
    value = re.sub(r'`([^`]+)`', r'<font name="Code" size="8.3">\1</font>', value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', value)
    value = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<i>\1</i>', value)
    return value


def decorate(canvas, doc):
    width, height = canvas._pagesize
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.line(MARGIN, height - 37, width - MARGIN, height - 37)
    canvas.setFillColor(GREEN)
    canvas.setFont('BodyBold', 10)
    canvas.drawString(MARGIN, height - 26, 'MERITUS')
    canvas.setFont('Body', 8.2)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - MARGIN, height - 26, 'RELEASE 3  /  LAB05S01  /  18.11.2026')
    canvas.line(MARGIN, 32, width - MARGIN, 32)
    canvas.drawString(MARGIN, 20, 'Planejamento e modelagem - novas funcionalidades ainda não implementadas')
    canvas.drawRightString(width - MARGIN, 20, str(doc.page))
    canvas.restoreState()


def build():
    fonts()
    body = ParagraphStyle('MeritusBody', fontName='Body', fontSize=9.5, leading=13,
                          textColor=INK, spaceAfter=6, allowWidows=0, allowOrphans=0)
    h1 = ParagraphStyle('MeritusH1', parent=body, fontName='BodyBold', fontSize=25,
                        leading=30, textColor=GREEN, spaceBefore=6, spaceAfter=17, keepWithNext=True)
    h2 = ParagraphStyle('MeritusH2', parent=body, fontName='BodyBold', fontSize=18,
                        leading=22, textColor=GREEN, spaceBefore=4, spaceAfter=13, keepWithNext=True)
    h3 = ParagraphStyle('MeritusH3', parent=body, fontName='BodyBold', fontSize=11.4,
                        leading=15, spaceBefore=5, spaceAfter=4, keepWithNext=True)
    bullet = ParagraphStyle('MeritusBullet', parent=body, leftIndent=13, bulletIndent=1,
                            bulletFontName='Body', bulletFontSize=10, spaceAfter=5)
    cell = ParagraphStyle('MeritusCell', parent=body, fontSize=8.6, leading=11.5, spaceAfter=0)
    cell_head = ParagraphStyle('MeritusCellHead', parent=cell, fontName='BodyBold', textColor=GREEN)
    caption = ParagraphStyle('MeritusCaption', parent=body, fontSize=10, leading=14, spaceAfter=12)

    sizes = {'portrait': A4, 'landscape': landscape(A4), 'large-landscape': landscape(A3), 'large-portrait': A3,
             'poster-landscape': landscape(A2), 'poster-portrait': A2}
    doc = BaseDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=TOP, bottomMargin=BOTTOM, title='Meritus - Lab05S01 - Release 3',
                          author='Projeto Meritus', subject='Seleção de três funcionalidades, padrões GoF e seis diagramas UML')
    for name, size in sizes.items():
        width, height = size
        frame = Frame(MARGIN, BOTTOM, width - 2 * MARGIN, height - TOP - BOTTOM,
                      leftPadding=0, bottomPadding=0, rightPadding=0, topPadding=0, id=name + '-frame')
        doc.addPageTemplates(PageTemplate(id=name, frames=[frame], onPage=decorate, pagesize=size))

    story = []
    lines = SOURCE.read_text(encoding='utf-8').splitlines()
    index = 0
    diagram = None
    width = A4[0] - 2 * MARGIN

    def paragraph(text, style=body, **kwargs):
        story.append(Paragraph(inline(text), style, **kwargs))

    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue
        if line == '<!-- PAGEBREAK -->':
            story.extend([NextPageTemplate('portrait'), PageBreak()])
            index += 1
            continue
        if line.startswith('<!-- DIAGRAM:'):
            diagram = line.split(':', 1)[1].split('-->')[0].strip()
            picture = DOCS / 'diagramas' / 'renderizados' / (diagram + '.png')
            with PILImage.open(picture) as image:
                iw, ih = image.size
            candidates = list(sizes.items())
            # Preserva letra de aproximadamente 9,6 pt ou mais nas figuras.
            selected = None
            for name, size in candidates:
                available_width, available_height = size[0] - 2 * MARGIN, size[1] - TOP - BOTTOM - 110
                scale = min(available_width / iw, available_height / ih)
                if scale >= 0.60:
                    selected = name
                    break
            if selected is None:
                selected = max(candidates, key=lambda item: min((item[1][0]-2*MARGIN)/iw, (item[1][1]-TOP-BOTTOM-110)/ih))[0]
            story.extend([NextPageTemplate(selected), PageBreak()])
            diagram = (picture, sizes[selected])
            index += 1
            continue
        if line.startswith('!['):
            if diagram is None:
                raise ValueError('Imagem sem marcador de diagrama.')
            picture, size = diagram
            with PILImage.open(picture) as image:
                iw, ih = image.size
            scale = min((size[0]-2*MARGIN)/iw, (size[1]-TOP-BOTTOM-110)/ih)
            image = Image(str(picture), width=iw*scale, height=ih*scale)
            image.hAlign = 'CENTER'
            story.append(image)
            diagram = None
            index += 1
            continue
        if line.startswith('|'):
            rows = []
            while index < len(lines) and lines[index].strip().startswith('|'):
                cells = [part.strip() for part in lines[index].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                    rows.append(cells)
                index += 1
            count = len(rows[0])
            ratios = {2: [0.31, 0.69], 3: [0.27, 0.33, 0.40], 4: [0.12, 0.29, 0.19, 0.40]}[count]
            data = [[Paragraph(inline(c), cell_head if r == 0 else cell) for c in row] for r, row in enumerate(rows)]
            table = Table(data, colWidths=[width*x for x in ratios], repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ECF3EE')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LINEBELOW', (0, 0), (-1, 0), 0.7, RULE),
                ('LINEBELOW', (0, 1), (-1, -1), 0.35, RULE),
                ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.extend([table, Spacer(1, 9)])
            continue
        if line.startswith('### '):
            paragraph(line[4:], h3)
        elif line.startswith('## '):
            paragraph(line[3:], h2)
        elif line.startswith('# '):
            paragraph(line[2:], h1)
        elif line.startswith('- '):
            paragraph(line[2:], bullet, bulletText='•')
        elif re.match(r'^\d+\. ', line):
            number, text = line.split('. ', 1)
            paragraph(text, bullet, bulletText=number + '.')
        else:
            buffer = [line]
            while index+1 < len(lines) and lines[index+1].strip() and not re.match(r'^(#|\||!\[|<!--|- |\d+\. )', lines[index+1].strip()):
                index += 1
                buffer.append(lines[index].strip())
            paragraph(' '.join(buffer), caption if diagram else body)
        index += 1

    doc.build(story)
    print(f'PDF gerado: {OUTPUT}')


if __name__ == '__main__':
    build()
