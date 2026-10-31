"""Build the six codex plates that had no WDL11391 panel.

Sources (all public domain, documentation in assets/codex/SOURCE.md):
  - 古今百美圖之二喬 / 之文姬, Wu Youru, 19th c.
  - 孔明造木牛流馬, Qing woodblock print
  - 劉表 Qing portrait, Zengxiang quantu Sanguoyanyi
  - 祝融夫人, Utagawa Kuniyoshi, 1854, British Museum

Usage: python -I _shots/make-extra-plates.py
Reads _assets-tmp/cand/, writes assets/codex/*-plate.webp.

The raw scans are not committed; source URLs and sizes are in
assets/codex/SOURCE.md. Re-download them into _assets-tmp/cand/ first.
"""
import os
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "codex")
CAND = os.path.join(ROOT, "_assets-tmp", "cand")
CAND2 = os.path.join(ROOT, "_assets-tmp", "cand2")


def tint(im):
    """Unify the line-art scans with the aged paper of the WDL plates.

    In the UI these plates are multiplied onto a paper gradient, so the
    white point only needs to stay warm and slightly off-white; ink keeps
    its weight.
    """
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=(0.2, 0.2))
    out = ImageOps.colorize(g, black=(38, 30, 21), white=(219, 203, 173), mid=(146, 126, 96))
    return ImageEnhance.Contrast(out).enhance(1.03)


def upscale(im, target_w):
    if im.width < target_w:
        im = im.resize((target_w, round(im.height * target_w / im.width)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=65, threshold=3))
    return im


JOBS = {
    # id: (source, crop box or None, target width, tint?)
    "daqiao": (os.path.join(CAND, "qiao-100.png"), (300, 380, 920, 1207), 900, True),
    "xiaoqiao": (os.path.join(CAND, "qiao-100.png"), (420, 370, 1040, 1197), 900, True),
    "caiwenji": (os.path.join(CAND2, "wenji-baimei-full.png"), (840, 450, 1560, 1410), 900, True),
    "huangyueying": (os.path.join(CAND, "wooden-ox.jpg"), None, 800, True),
    "liubiao": (os.path.join(CAND, "Liu_Biao_Qing_portait.jpg"), None, 720, True),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for cid, (src, box, target_w, do_tint) in JOBS.items():
        im = Image.open(src).convert("RGB")
        if box:
            im = im.crop(box)
        if do_tint:
            im = tint(im)
        im = upscale(im, target_w)
        if im.width > 1100:
            im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
        name = f"{cid}-plate.webp"
        im.save(os.path.join(OUT, name), "WEBP", quality=90, method=6)
        print(cid, name, im.size)

    # The Liu Biao portrait carries a long inscription on the right. Cards
    # place the vertical name there, so use a figure-only crop on the card
    # and keep the full plate, inscription included, for the detail page.
    im = Image.open(os.path.join(CAND, "Liu_Biao_Qing_portait.jpg")).convert("RGB")
    im = tint(im.crop((0, 55, 270, 415)))
    im = upscale(im, 540)
    im.save(os.path.join(OUT, "liubiao-card.webp"), "WEBP", quality=90, method=6)
    print("liubiao card", im.size)

    # Utagawa Kuniyoshi, 1854. Keep the colour print as colour; only trim the
    # white mount and the printer's colour-calibration strip at the bottom.
    im = Image.open(os.path.join(CAND2, "zhurong-ukiyoe.jpg")).convert("RGB")
    im = im.crop((14, 14, 1070, 1524))
    im = ImageEnhance.Color(im).enhance(0.96)
    im = ImageEnhance.Contrast(im).enhance(1.02)
    if im.width > 1100:
        im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, "zhurong-plate.webp"), "WEBP", quality=90, method=6)
    print("zhurong", "zhurong-plate.webp", im.size)


if __name__ == "__main__":
    main()
