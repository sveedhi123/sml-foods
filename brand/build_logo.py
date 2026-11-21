"""Builds the SML logo files, with lettering converted to outlines (no web font needed).

Design: "SML" in Montserrat ExtraBold. The M is a buffalo: its top corners curve into horns,
small ears sit under them, and a ghee drop is the face between the M's legs.
Two-tone: S and L dark (or cream on dark backgrounds), the buffalo M in gold.

Run:  python3 brand/build_logo.py   (needs fontTools, Pillow and rsvg-convert)
"""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
BRAND = os.path.join(ROOT, "brand")
G = "/usr/share/fonts/truetype/google-fonts/ofl/"

INK, CREAM, GOLD, GOLD_ON_DARK, DARK = "#1E1A16", "#F3ECE0", "#C38F32", "#E2B456", "#16130F"


def font(w):
    return instantiateVariableFont(TTFont(G + "montserrat/Montserrat[wght].ttf"), {"wght": w}, inplace=False)


BOLD, MED = font(800), font(500)


def text(f, s, size, x, y, tr=0.0, anchor="start"):
    """Outline path for a string. y = baseline, tr = tracking in em. Returns (d, width)."""
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    k = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [gs[n].width for n in names]
    w = (sum(adv) + tr * upm * (len(s) - 1)) * k
    if anchor == "middle":
        x -= w / 2
    pen, cx = SVGPathPen(gs), 0
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x + cx * k, y)))
        cx += a + tr * upm
    return pen.getCommands(), w


def drop(cx, tip_y, bottom_y, r):
    cy = bottom_y - r
    return (f"M{cx:.1f} {tip_y:.1f} C{cx:.1f} {tip_y:.1f} {cx-r:.1f} {cy - r*0.6:.1f} {cx-r:.1f} {cy:.1f} "
            f"C{cx-r:.1f} {cy + r*0.56:.1f} {cx - r*0.56:.1f} {bottom_y:.1f} {cx:.1f} {bottom_y:.1f} "
            f"C{cx + r*0.56:.1f} {bottom_y:.1f} {cx+r:.1f} {cy + r*0.56:.1f} {cx+r:.1f} {cy:.1f} "
            f"C{cx+r:.1f} {cy - r*0.6:.1f} {cx:.1f} {tip_y:.1f} {cx:.1f} {tip_y:.1f} Z")


def buffalo_m(x, base, size, fill):
    """The M as a buffalo head. Returns (svg, width)."""
    h, t, w = size * 0.70, size * 0.165, size * 0.92
    y0 = base - h
    vy = y0 + h * 0.52
    xm = x + w / 2
    pts = [(x, base), (x, y0), (x + t * 1.2, y0), (xm, vy - t * 1.3), (x + w - t * 1.2, y0), (x + w, y0),
           (x + w, base), (x + w - t, base), (x + w - t, y0 + t * 2.0), (xm + t * 0.2, vy), (xm - t * 0.2, vy),
           (x + t, y0 + t * 2.0), (x + t, base)]
    m = "M" + " L".join(f"{a:.1f} {b:.1f}" for a, b in pts) + " Z"
    s = size / 300
    T = t / s

    def horn(sign, ox):
        P = lambda px, py: f"{ox + sign * px * s:.1f} {y0 + py * s:.1f}"
        return (f"M{P(T, 0.5)} C{P(T - 6, -22)} {P(-14, -34)} {P(-34, -56)} "
                f"C{P(-46, -70)} {P(-50, -86)} {P(-46, -104)} "
                f"C{P(-70, -88)} {P(-84, -60)} {P(-78, -30)} "
                f"C{P(-72, -4)} {P(-44, 16)} {P(0, 22)} L{P(0, 0.5)} Z")

    def ear(sign, ox):
        P = lambda px, py: f"{ox + sign * px * s:.1f} {y0 + py * s:.1f}"
        return f"M{P(0, 44)} C{P(-16, 38)} {P(-36, 42)} {P(-48, 56)} C{P(-32, 64)} {P(-14, 62)} {P(0, 58)} Z"

    face = drop(xm, vy + t * 0.35, base, (w - 2 * t) * 0.30)
    parts = [horn(1, x), horn(-1, x + w), m, ear(1, x), ear(-1, x + w), face]
    return f'<g fill="{fill}">' + "".join(f'<path d="{p}"/>' for p in parts) + "</g>", w


def sml(x, base, size, letters, m_fill):
    """Full SML lockup starting at x. Returns (svg, width)."""
    _, ws = text(BOLD, "S", size, 0, 0)
    _, wl = text(BOLD, "L", size, 0, 0)
    gap, wm = size * 0.26, size * 0.92
    s_d, _ = text(BOLD, "S", size, x, base)
    m_svg, _ = buffalo_m(x + ws + gap, base, size, m_fill)
    l_d, _ = text(BOLD, "L", size, x + ws + gap + wm + gap, base)
    return f'<g fill="{letters}"><path d="{s_d}"/><path d="{l_d}"/></g>{m_svg}', ws + gap + wm + gap + wl


def write(path, w, h, inner, bg=None, rx=0):
    rect = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    with open(path, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
                f'role="img" aria-label="SML">{rect}{inner}</svg>')
    return path


def png(svg_path, out, w):
    subprocess.run(["rsvg-convert", "-w", str(w), svg_path, "-o", out], check=True)


# ---------- Header / footer logo (no caption) ----------
SIZE, PAD = 100, 4
_, LW = sml(0, 0, SIZE, INK, GOLD)
W, H = round(LW + 2 * PAD), round(SIZE * 1.07 + 2 * PAD)
BASE = H - PAD
write(os.path.join(IMG, "logo.svg"), W, H, sml(PAD, BASE, SIZE, INK, GOLD)[0])
write(os.path.join(IMG, "logo-light.svg"), W, H, sml(PAD, BASE, SIZE, CREAM, GOLD_ON_DARK)[0])
print("logo", W, "x", H)

# ---------- Logo with caption, for labels and print ----------
CAP = "GHEE  ·  PICKLES  ·  PANEER"


def captioned(letters, m_fill, cap_fill):
    size = 300
    _, lw = sml(0, 0, size, letters, m_fill)
    w = round(lw + 40)
    base = size * 1.07 + 20
    cap, _ = text(MED, CAP, size * 0.085, w / 2, base + size * 0.26, tr=0.34, anchor="middle")
    return w, round(base + size * 0.34), sml(20, base, size, letters, m_fill)[0] + f'<path d="{cap}" fill="{cap_fill}"/>'


for name, args in [("SML-logo", (INK, GOLD, "#6F5F50")), ("SML-logo-light", (CREAM, GOLD_ON_DARK, "#CDB68A"))]:
    w, h, inner = captioned(*args)
    svg = write(os.path.join(BRAND, name + ".svg"), w, h, inner)
    png(svg, os.path.join(BRAND, name + ".png"), 1600)


# ---------- Icon: the buffalo M alone on dark ----------
def icon(px):
    size = px * 0.586
    mv, mw = buffalo_m(0, 0, size, GOLD_ON_DARK)
    return f'<g transform="translate({px/2 - mw/2:.2f} {px*0.78:.2f})">{mv}</g>'


write(os.path.join(IMG, "favicon.svg"), 64, 64, icon(64), bg=DARK, rx=12)
png(os.path.join(IMG, "favicon.svg"), os.path.join(IMG, "favicon-32.png"), 32)
write(os.path.join(BRAND, "SML-icon.svg"), 512, 512, icon(512), bg=DARK, rx=96)
png(os.path.join(BRAND, "SML-icon.svg"), os.path.join(BRAND, "SML-icon-1024.png"), 1024)
write("/tmp/apple.svg", 180, 180, icon(180), bg=DARK)   # iOS rounds the corners itself
png("/tmp/apple.svg", os.path.join(IMG, "apple-touch-icon.png"), 180)

# ---------- Share image for WhatsApp / Facebook (1200 x 630) ----------
size = 200
_, lw = sml(0, 0, size, CREAM, GOLD_ON_DARK)
og = sml(600 - lw / 2, 360, size, CREAM, GOLD_ON_DARK)[0]
cap, _ = text(MED, CAP, 24, 600, 440, tr=0.34, anchor="middle")
write("/tmp/og.svg", 1200, 630, og + f'<path d="{cap}" fill="#CDB68A"/>', bg=DARK)
png("/tmp/og.svg", os.path.join(IMG, "og-image.png"), 1200)
print("done")
