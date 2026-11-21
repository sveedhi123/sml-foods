"""Builds SML logo SVGs with lettering converted to outlines (no font dependency).
Fonts: Bitter (OFL) for the SML wordmark, DM Sans (OFL) for the small caption."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os

G = "/usr/share/fonts/truetype/google-fonts/ofl/"
OUT = "/home/claude/logo/out"
os.makedirs(OUT, exist_ok=True)

def inst(path, **axes):
    f = TTFont(path)
    return instantiateVariableFont(f, axes, inplace=False)

BITTER = inst(G + "bitter/Bitter[wght].ttf", wght=800)
DMSANS = inst(G + "dmsans/DMSans[opsz,wght].ttf", wght=700, opsz=14)

def text_path(font, text, size, x, y, tracking=0.0, anchor="start"):
    """Return (svg path d, width). y = baseline. tracking in em."""
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    s = size / upm
    names = [cmap[ord(c)] for c in text]
    adv = [gs[n].width for n in names]
    width = (sum(adv) + tracking * upm * (len(text) - 1)) * s
    if anchor == "middle":
        x -= width / 2
    elif anchor == "end":
        x -= width
    pen = SVGPathPen(gs)
    cx = 0
    for n, a in zip(names, adv):
        tp = TransformPen(pen, (s, 0, 0, -s, x + cx * s, y))
        gs[n].draw(tp)
        cx += a + tracking * upm
    return pen.getCommands(), width

MAROON, TURMERIC, CREAM, INK = "#7A1F1F", "#F0B740", "#FFF9EF", "#2A1A12"

# ---------- Jaadi (pickle jar) shape, 200 x 220 box ----------
def jaadi(fill=MAROON, band=TURMERIC, x=0, y=0, k=1.0):
    def T(px, py):
        return f"{x + px * k:.2f} {y + py * k:.2f}"
    body = (f"M{T(62,46)} C{T(40,52)} {T(20,74)} {T(16,106)} C{T(10,150)} {T(28,196)} {T(70,210)} "
            f"L{T(130,210)} C{T(172,196)} {T(190,150)} {T(184,106)} C{T(180,74)} {T(160,52)} {T(138,46)} Z")
    neck = f"M{T(66,30)} L{T(134,30)} L{T(138,50)} L{T(62,50)} Z"
    lid = f"M{T(56,14)} Q{T(100,2)} {T(144,14)} L{T(144,30)} L{T(56,30)} Z"
    knob = f"M{T(90,6)} Q{T(100,-4)} {T(110,6)} Z"
    return (f'<path d="{body}" fill="{fill}"/><path d="{neck}" fill="{fill}"/>'
            f'<path d="{lid}" fill="{band}"/><path d="{knob}" fill="{band}"/>')

def save(name, w, h, inner, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{rect}{inner}</svg>'
    open(f"{OUT}/{name}.svg", "w").write(svg)
    return svg

# ===== Concept A: jaadi with SML on the label =====
def mark_a():
    d, _ = text_path(BITTER, "SML", 52, 100, 150, tracking=0.02, anchor="middle")
    label = (f'<rect x="40" y="104" width="120" height="62" rx="10" fill="{CREAM}"/>'
             f'<rect x="46" y="110" width="108" height="50" rx="6" fill="none" stroke="{TURMERIC}" stroke-width="2.5"/>')
    return jaadi() + label + f'<path d="{d}" fill="{MAROON}"/>'

save("A-mark", 200, 220, mark_a())

def lockup(mark_svg, mark_w, mark_h, name, word_color=MAROON):
    # horizontal: mark (scaled to 120 high) + SML + caption
    sc = 120 / mark_h
    g = f'<g transform="translate(0 0) scale({sc:.4f})">{mark_svg}</g>'
    x0 = mark_w * sc + 22
    d1, w1 = text_path(BITTER, "SML", 92, x0, 86, tracking=0.03)
    d2, w2 = text_path(DMSANS, "FOODS · KONASEEMA", 17, x0 + 3, 116, tracking=0.22)
    W = int(x0 + max(w1, w2) + 6)
    inner = g + f'<path d="{d1}" fill="{word_color}"/><path d="{d2}" fill="{INK}" opacity=".72"/>'
    save(name, W, 124, inner)

lockup(mark_a(), 200, 220, "A-horizontal")

# ===== Concept B: round seal with mango leaf =====
def mark_b():
    d, _ = text_path(BITTER, "SML", 64, 100, 122, tracking=0.02, anchor="middle")
    cap, _ = text_path(DMSANS, "KONASEEMA", 11.5, 100, 150, tracking=0.32, anchor="middle")
    leaf = (f'<path d="M100 52 C112 38 132 36 142 42 C130 46 116 52 100 52 Z" fill="{TURMERIC}"/>'
            f'<path d="M100 52 C88 38 68 36 58 42 C70 46 84 52 100 52 Z" fill="{TURMERIC}"/>'
            f'<path d="M100 52 L100 64" stroke="{TURMERIC}" stroke-width="3" stroke-linecap="round"/>')
    return (f'<circle cx="100" cy="100" r="96" fill="{MAROON}"/>'
            f'<circle cx="100" cy="100" r="86" fill="none" stroke="{TURMERIC}" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>'
            + leaf + f'<path d="{d}" fill="{CREAM}"/><path d="{cap}" fill="{TURMERIC}"/>')

save("B-mark", 200, 200, mark_b())
lockup(mark_b(), 200, 200, "B-horizontal")

# ===== Concept C: wordmark with a mango accent over the M =====
def wordmark_c():
    d1, w1 = text_path(BITTER, "SML", 110, 4, 112, tracking=0.03)
    # mango shape above the M (approx centre of M)
    mx = 4 + w1 * 0.50
    mango = (f'<path d="M{mx-6:.1f} 30 C{mx+16:.1f} 18 {mx+30:.1f} 34 {mx+22:.1f} 48 C{mx+14:.1f} 60 {mx-10:.1f} 56 {mx-12:.1f} 44 C{mx-13:.1f} 38 {mx-11:.1f} 33 {mx-6:.1f} 30 Z" fill="{TURMERIC}"/>'
             f'<path d="M{mx-4:.1f} 30 C{mx-2:.1f} 20 {mx+8:.1f} 12 {mx+20:.1f} 12 C{mx+14:.1f} 20 {mx+6:.1f} 26 {mx-4:.1f} 30 Z" fill="#3E6B2F"/>')
    d2, w2 = text_path(DMSANS, "FOODS · KONASEEMA", 17.5, 8, 146, tracking=0.24)
    W = int(max(w1, w2) + 12)
    return W, f'<path d="{d1}" fill="{MAROON}"/>' + mango + f'<path d="{d2}" fill="{INK}" opacity=".72"/>'

W, c = wordmark_c()
save("C-wordmark", W, 156, c)

# ===== Favicons =====
# A: jaadi on maroon rounded square
fa = (f'<rect width="64" height="64" rx="14" fill="{MAROON}"/>'
      f'<g transform="translate(9 6) scale(.23)">{jaadi(fill=CREAM, band=TURMERIC)}</g>'
      f'<rect x="21" y="33" width="22" height="9" rx="2" fill="{MAROON}"/>')
save("A-favicon", 64, 64, fa)
fb_d, _ = text_path(BITTER, "S", 40, 32, 46, anchor="middle")
save("B-favicon", 64, 64, f'<circle cx="32" cy="32" r="31" fill="{MAROON}"/><path d="{fb_d}" fill="{CREAM}"/><path d="M32 14 C36 9 43 8 46 10 C42 12 37 14 32 14 Z M32 14 C28 9 21 8 18 10 C22 12 27 14 32 14 Z" fill="{TURMERIC}"/>')
print("ok", sorted(os.listdir(OUT)))

# ===================== FINAL (concept B refined) =====================
def leaves(cx, cy, s=1.0, col=TURMERIC):
    # two mango leaves with mid-ribs on a short stem (like a thoranam sprig)
    L = (f'M{cx} {cy} C{cx+10*s} {cy-13*s} {cx+30*s} {cy-17*s} {cx+44*s} {cy-9*s} C{cx+30*s} {cy-4*s} {cx+14*s} {cy+1*s} {cx} {cy} Z')
    R = (f'M{cx} {cy} C{cx-10*s} {cy-13*s} {cx-30*s} {cy-17*s} {cx-44*s} {cy-9*s} C{cx-30*s} {cy-4*s} {cx-14*s} {cy+1*s} {cx} {cy} Z')
    rib = f'M{cx+4*s} {cy-3*s} C{cx+16*s} {cy-9*s} {cx+28*s} {cy-11*s} {cx+38*s} {cy-9*s} M{cx-4*s} {cy-3*s} C{cx-16*s} {cy-9*s} {cx-28*s} {cy-11*s} {cx-38*s} {cy-9*s}'
    return (f'<path d="{L}" fill="{col}"/><path d="{R}" fill="{col}"/>'
            f'<path d="{rib}" stroke="{MAROON}" stroke-width="{1.6*s:.2f}" fill="none" stroke-linecap="round" opacity=".55"/>'
            f'<path d="M{cx} {cy} L{cx} {cy+9*s}" stroke="{col}" stroke-width="{3*s:.2f}" stroke-linecap="round"/>')

def seal():
    d, _ = text_path(BITTER, "SML", 66, 100, 124, tracking=0.02, anchor="middle")
    cap, _ = text_path(DMSANS, "KONASEEMA", 11.5, 100, 152, tracking=0.34, anchor="middle")
    return (f'<circle cx="100" cy="100" r="98" fill="{MAROON}"/>'
            f'<circle cx="100" cy="100" r="90" fill="none" stroke="{TURMERIC}" stroke-width="2.2"/>'
            f'<circle cx="100" cy="100" r="84" fill="none" stroke="{TURMERIC}" stroke-width="1.6" stroke-dasharray="0.1 6" stroke-linecap="round"/>'
            + leaves(100, 60, 0.9) + f'<path d="{d}" fill="{CREAM}"/><path d="{cap}" fill="{TURMERIC}"/>')

def icon():
    d, _ = text_path(BITTER, "S", 92, 100, 156, anchor="middle")
    return (f'<circle cx="100" cy="100" r="98" fill="{MAROON}"/>'
            f'<circle cx="100" cy="100" r="88" fill="none" stroke="{TURMERIC}" stroke-width="3"/>'
            + leaves(100, 58, 0.95) + f'<path d="{d}" fill="{CREAM}"/>')

save("sml-seal", 200, 200, seal())
save("sml-icon", 200, 200, icon())

def horiz(name, word=MAROON, cap_col=INK, cap_op=".7"):
    g = f'<g transform="scale(.6)">{icon()}</g>'
    x0 = 120 + 18
    d1, w1 = text_path(BITTER, "SML", 82, x0, 78, tracking=0.03)
    d2, w2 = text_path(DMSANS, "FOODS · KONASEEMA", 15.5, x0 + 2, 106, tracking=0.24)
    W = int(x0 + max(w1, w2) + 4)
    save(name, W, 120, g + f'<path d="{d1}" fill="{word}"/><path d="{d2}" fill="{cap_col}" opacity="{cap_op}"/>')
    return W

horiz("sml-logo-horizontal")
horiz("sml-logo-horizontal-light", word=CREAM, cap_col=TURMERIC, cap_op="1")
# favicon: same icon, slightly bolder ring for tiny sizes
save("favicon", 200, 200, icon())

# Open Graph image 1200x630
og_seal = f'<g transform="translate(470 90) scale(1.3)">{seal()}</g>'
t1, _ = text_path(DMSANS, "KONASEEMA PICKLES · GHEE · PANEER", 30, 600, 430, tracking=0.12, anchor="middle")
t2, _ = text_path(DMSANS, "ORDER ONLINE", 20, 600, 478, tracking=0.34, anchor="middle")
save("og-image", 1200, 630, f'<rect width="1200" height="630" fill="{CREAM}"/><rect x="24" y="24" width="1152" height="582" fill="none" stroke="{TURMERIC}" stroke-width="3"/>' + og_seal + f'<path d="{t1}" fill="{MAROON}"/><path d="{t2}" fill="{INK}" opacity=".7"/>')
print("final ok")
