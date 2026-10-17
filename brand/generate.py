"""Genera los SVG de marca de merit con el texto contorneado a paths.
Uso: python3 -I gen_svgs.py <fonts_dir> <out_kit_dir>
"""
import io, sys, os, json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONTS, OUT = sys.argv[1], sys.argv[2]
BRAND = os.path.join(OUT, 'brand')
PUB = os.path.join(OUT, 'apps/web/public')
os.makedirs(BRAND, exist_ok=True); os.makedirs(PUB, exist_ok=True)

C = dict(noche='#0A0A0F', grafito='#15151D', linea='#26262F', linea_f='#3A3A46', hueso='#F5F5F7',
         niebla='#A1A1AE', merito='#6E4BFF', lavanda='#A898FF', senal='#C6F432', white='#FFFFFF', papel='#F6F5F1')

def fmt(v):
    s = f"{v:.2f}".rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

class Font:
    def __init__(self, rel):
        tt = TTFont(os.path.join(FONTS, rel)); tt.flavor = None
        b = io.BytesIO(); tt.save(b); data = b.getvalue()
        self.tt = TTFont(io.BytesIO(data)); self.gs = self.tt.getGlyphSet()
        self.upem = self.tt['head'].unitsPerEm
        self.hb = hb.Font(hb.Face(hb.Blob(data)))
    def run(self, text, size, x, y, tracking=0.0):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": False})
        s = size / self.upem; parts = []; px = x; bp = BoundsPen(self.gs); bounds = None
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.tt.getGlyphName(info.codepoint)
            t = (s, 0, 0, -s, px + pos.x_offset * s, y - pos.y_offset * s)
            sp = SVGPathPen(self.gs, ntos=fmt); self.gs[name].draw(TransformPen(sp, t)); parts.append(sp.getCommands())
            b = BoundsPen(self.gs); self.gs[name].draw(TransformPen(b, t))
            if b.bounds:
                bounds = b.bounds if bounds is None else (min(bounds[0], b.bounds[0]), min(bounds[1], b.bounds[1]), max(bounds[2], b.bounds[2]), max(bounds[3], b.bounds[3]))
            px += pos.x_advance * s + tracking * size
        return ' '.join(p for p in parts if p), px, bounds  # bounds in SVG coords (y down), ymin/ymax swapped below

def ybounds(b):
    # TransformPen flips y, so BoundsPen reports (xmin, ymin, xmax, ymax) already in SVG space
    return b

outfit7 = Font('fontsource-outfit-5.3.0/package/files/outfit-latin-700-normal.woff2')
outfit6 = Font('fontsource-outfit-5.3.0/package/files/outfit-latin-600-normal.woff2')
dm4 = Font('fontsource-dm-sans-5.3.0/package/files/dm-sans-latin-400-normal.woff2')
jb5 = Font('fontsource-jetbrains-mono-5.3.0/package/files/jetbrains-mono-latin-500-normal.woff2')

def wordmark(size, x, y):
    """'merit' + punto. Devuelve (path_d, (cx, cy, r), bbox)."""
    d, px, b = outfit7.run('merit', size, x, y, tracking=-0.055)
    r = 0.085 * size
    cx = px + 0.04 * size + r          # px ya incluye el tracking tras la "t" (como en CSS)
    cy = y - r                          # el punto se apoya en la línea base
    bbox = (b[0], min(b[1], cy - r), max(b[2], cx + r), max(b[3], y))
    return d, (cx, cy, r), bbox

def svg(w, h, body, extra=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" width="{fmt(w)}" height="{fmt(h)}"{extra}>\n{body}\n</svg>\n'

def write(path, text):
    with open(path, 'w') as f: f.write(text)

# ---------- logo (wordmark) ----------
SIZE = 48
d, (cx, cy, r), bb = wordmark(SIZE, 0, 0)
pad = 4
W = (bb[2] - bb[0]) + 2 * pad; H = (bb[3] - bb[1]) + 2 * pad
tx, ty = pad - bb[0], pad - bb[1]
def logo(text_fill, dot_fill, title):
    body = (f'<title>{title}</title>\n<g transform="translate({fmt(tx)} {fmt(ty)})">\n'
            f'  <path d="{d}" fill="{text_fill}"/>\n'
            f'  <circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}" fill="{dot_fill}"/>\n</g>')
    return svg(W, H, body, ' role="img" aria-label="merit"')
write(os.path.join(BRAND, 'logo.svg'), logo(C['noche'], C['merito'], 'merit'))
write(os.path.join(BRAND, 'logo-dark.svg'), logo(C['hueso'], C['senal'], 'merit'))

# ---------- mark (isotipo) ----------
def mark_body(tile, tile_stroke, m_fill, dot_fill, size=64, radius_ratio=0.27, font_ratio=0.625, dot=True, full_bleed=False, content_scale=1.0):
    fs = size * font_ratio * content_scale
    md, mpx, mb = outfit7.run('m', fs, 0, 0)
    rr = 0.1 * fs
    dcx = mpx + 0.03 * fs + rr; dcy = -rr
    if dot:
        ub = (mb[0], min(mb[1], dcy - rr), max(mb[2], dcx + rr), max(mb[3], 0))
    else:
        ub = mb
    gx = size / 2 - (ub[0] + ub[2]) / 2; gy = size / 2 - (ub[1] + ub[3]) / 2
    rx = 0 if full_bleed else size * radius_ratio
    parts = []
    if tile_stroke:
        parts.append(f'<rect x="0.5" y="0.5" width="{fmt(size-1)}" height="{fmt(size-1)}" rx="{fmt(rx-0.5)}" fill="{tile}" stroke="{tile_stroke}"/>')
    else:
        parts.append(f'<rect width="{fmt(size)}" height="{fmt(size)}" rx="{fmt(rx)}" fill="{tile}"/>')
    parts.append(f'<g transform="translate({fmt(gx)} {fmt(gy)})">')
    parts.append(f'  <path d="{md}" fill="{m_fill}"/>')
    if dot:
        parts.append(f'  <circle cx="{fmt(dcx)}" cy="{fmt(dcy)}" r="{fmt(rr)}" fill="{dot_fill}"/>')
    parts.append('</g>')
    return '\n'.join(parts)

mark = svg(64, 64, '<title>merit</title>\n' + mark_body(C['merito'], None, C['white'], C['senal']), ' role="img" aria-label="merit"')
write(os.path.join(BRAND, 'mark.svg'), mark)
write(os.path.join(BRAND, 'mark-dark.svg'), svg(64, 64, '<title>merit</title>\n' + mark_body(C['grafito'], C['linea'], C['hueso'], C['senal']), ' role="img" aria-label="merit"'))
write(os.path.join(PUB, 'favicon.svg'), mark)

# Fuentes de raster (se renderizan después a PNG)
RAS = os.path.join(OUT, '.raster'); os.makedirs(RAS, exist_ok=True)
write(os.path.join(RAS, 'icon.svg'), mark)
write(os.path.join(RAS, 'icon-16.svg'), svg(64, 64, mark_body(C['merito'], None, C['white'], C['senal'], radius_ratio=0.22, font_ratio=0.78, dot=False)))
write(os.path.join(RAS, 'icon-touch.svg'), svg(64, 64, mark_body(C['merito'], None, C['white'], C['senal'], full_bleed=True, content_scale=0.9)))
write(os.path.join(RAS, 'icon-maskable.svg'), svg(64, 64, mark_body(C['merito'], None, C['white'], C['senal'], full_bleed=True, content_scale=0.72)))

# ---------- lockup (isotipo + wordmark) ----------
LS = 64
ld, (lcx, lcy, lr), lbb = wordmark(40, 0, 0)
gap = 16
lw = LS + gap + (lbb[2] - lbb[0]); lh = LS
lty = LS / 2 - (lbb[1] + lbb[3]) / 2
def lockup(text_fill, dot_fill, dark):
    tile = mark_body(C['grafito'], C['linea'], C['hueso'], C['senal']) if dark else mark_body(C['merito'], None, C['white'], C['senal'])
    body = (f'<title>merit</title>\n{tile}\n<g transform="translate({fmt(LS + gap - lbb[0])} {fmt(lty)})">\n'
            f'  <path d="{ld}" fill="{text_fill}"/>\n  <circle cx="{fmt(lcx)}" cy="{fmt(lcy)}" r="{fmt(lr)}" fill="{dot_fill}"/>\n</g>')
    return svg(lw, lh, body, ' role="img" aria-label="merit"')
write(os.path.join(BRAND, 'lockup.svg'), lockup(C['noche'], C['merito'], False))
write(os.path.join(BRAND, 'lockup-dark.svg'), lockup(C['hueso'], C['senal'], True))

# ---------- OG image 1200x630 ----------
og = []
og.append(f'<rect width="1200" height="630" fill="{C["noche"]}"/>')
# wordmark arriba a la izquierda
wd, (wcx, wcy, wr), wbb = wordmark(52, 0, 0)
og.append(f'<g transform="translate({fmt(80 - wbb[0])} {fmt(72 - wbb[1])})"><path d="{wd}" fill="{C["hueso"]}"/><circle cx="{fmt(wcx)}" cy="{fmt(wcy)}" r="{fmt(wr)}" fill="{C["senal"]}"/></g>')
# titular
h1a, _, _ = outfit6.run('Crédito que', 104, 80, 300, tracking=-0.04)
h1b, _, _ = outfit6.run('se gana.', 104, 80, 404, tracking=-0.04)
og.append(f'<path d="{h1a} {h1b}" fill="{C["hueso"]}"/>')
# subtítulo
s1, _, _ = dm4.run('La exclusión ya no está en la cuenta.', 30, 80, 476)
s2, _, _ = dm4.run('Está en el crédito.', 30, 80, 516)
og.append(f'<path d="{s1} {s2}" fill="{C["niebla"]}"/>')
# chip mono
chip_text = 'powered by Open Payments'
ct, cend, cb = jb5.run(chip_text, 18, 0, 0)
cw = (cend) + 36; chx, chy = 80, 552
og.append(f'<rect x="{chx}" y="{chy}" width="{fmt(cw)}" height="38" rx="19" fill="none" stroke="#3E4D18" stroke-width="1.5"/>')
og.append(f'<g transform="translate({chx + 18} {chy + 25})"><path d="{ct}" fill="{C["senal"]}"/></g>')
# anillo de score a la derecha
rcx, rcy, rr_ = 930, 330, 170
circ = 2 * 3.14159265 * rr_
og.append(f'<circle cx="{rcx}" cy="{rcy}" r="{rr_}" fill="none" stroke="{C["linea"]}" stroke-width="2"/>')
og.append(f'<circle cx="{rcx}" cy="{rcy}" r="{rr_}" fill="none" stroke="{C["merito"]}" stroke-width="10" stroke-linecap="round" stroke-dasharray="{fmt(circ*0.72)} {fmt(circ)}" transform="rotate(-90 {rcx} {rcy})"/>')
import math
ang = math.radians(-90 + 0.72 * 360)
og.append(f'<circle cx="{fmt(rcx + rr_*math.cos(ang))}" cy="{fmt(rcy + rr_*math.sin(ang))}" r="13" fill="{C["senal"]}"/>')
lab, lend, _ = jb5.run('SCORE MERIT', 14, 0, 0, tracking=0.14)
og.append(f'<g transform="translate({fmt(rcx - (lend - 0.14*14)/2)} {rcy - 62})"><path d="{lab}" fill="{C["niebla"]}"/></g>')
num, nend, nb = outfit6.run('720', 96, 0, 0, tracking=-0.04)
nw = nend + 0.04 * 96
og.append(f'<g transform="translate({fmt(rcx - nw/2)} {rcy + 34})"><path d="{num}" fill="{C["hueso"]}"/></g>')
bt, bend, _ = jb5.run('BUENO', 14, 0, 0, tracking=0.1)
bw = bend - 0.1 * 14 + 24
og.append(f'<rect x="{fmt(rcx - bw/2)}" y="{rcy + 58}" width="{fmt(bw)}" height="26" rx="13" fill="{C["senal"]}"/>')
og.append(f'<g transform="translate({fmt(rcx - bw/2 + 12)} {rcy + 76})"><path d="{bt}" fill="{C["noche"]}"/></g>')
og_svg = svg(1200, 630, '\n'.join(og), ' role="img" aria-label="merit — Crédito que se gana. La exclusión ya no está en la cuenta. Está en el crédito."')
write(os.path.join(BRAND, 'og-image.svg'), og_svg)
write(os.path.join(RAS, 'og-image.svg'), og_svg)

print(json.dumps({'logo': [round(W, 2), round(H, 2)], 'lockup': [round(lw, 2), lh], 'chip_w': round(cw, 1)}))
