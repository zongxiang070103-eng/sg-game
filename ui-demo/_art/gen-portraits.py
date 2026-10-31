"""Generate the 57 codex character illustrations (二次元事件立绘).

One prompt per character. Each prompt states who the figure is, what the
historical event looked like, and the setting, so the image reads as that
character at that moment rather than a generic warrior.

Backend: the public FLUX.1-schnell demo space on Hugging Face. It is free
but rate-limited; see _art/README.md. Swap `generate()` for another
text-to-image API if you have a key.

Usage:
  python -I _art/gen-portraits.py --list
  python -I _art/gen-portraits.py --only guanyu,zhaoyun
  python -I _art/gen-portraits.py            # all missing images
"""
import argparse
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_art", "out")

SPACE = "https://black-forest-labs-flux-1-schnell.hf.space"
HDRS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
W, H = 768, 1024

# Fixed style block. Keep it identical for every character so the 57 plates
# read as one set: anime cel shading, clean lineart, flat colour.
STYLE = (
    "日系二次元全身立绘，赛璐璐平涂上色，干净利落的线稿，鲜明色块，人物从头到脚完整入画，"
    "全身可见，动态站姿，背景简洁并交代事件环境，国风三国历史题材，汉末三国服饰与甲胄，"
    "画面中不要出现任何文字、签名或水印；"
    "anime full-body character illustration, cel shading, clean lineart, flat vivid colors, "
    "head-to-toe figure visible, simple cinematic background, historically inspired Han "
    "dynasty costume, no text, no watermark, no signature, no modern objects"
)

# id: what the figure looks like + the moment being drawn
PROMPTS = {
    # 魏
    "caocao": "Cao Cao, middle-aged warlord with a short black beard, navy robe with gold trim over lamellar armor, sword at his belt, seated at a table with green plums and a warm wine cup, narrowed eyes, pavilion garden in summer dusk",
    "caopi": "Cao Pi, young emperor in black and gold imperial robe, ceremonial crown with hanging bead strings, holding the imperial jade seal, grand Han palace throne hall with red pillars",
    "simayi": "Sima Yi, middle-aged strategist with narrow eyes and a thin goatee, dark purple official robe, holding an edict scroll, palace courtyard at dawn with silent armored guards",
    "guojia": "Guo Jia, frail young strategist in a pale blue robe, coughing into his sleeve while holding a sealed letter, snowy northern military camp, candlelit tent",
    "xunyu": "Xun Yu, refined scholarly minister in white and azure robe, holding an imperial edict, ruined Luoyang palace with broken columns, the emperor's carriage behind him",
    "jiaxu": "Jia Xu, calm strategist with a thin smile, grey robe, pointing at a city map on a table, burning Chang'an gate in the background",
    "xiahoudun": "Xiahou Dun, one-eyed fierce general in black lamellar armor, pulling an arrow from his eye, blood on his cheek, dusty battlefield",
    "zhangliao": "Zhang Liao, armored general with a halberd, leading cavalry across a river ford at night, Wu soldiers scattering, banners in the wind",
    "xuhuang": "Xu Huang, veteran general with a battle axe, wading through floodwater toward a besieged city wall, Shu banners on the rampart",
    "zhanghe": "Zhang He, veteran general in lamellar armor with a spear, mountain pass at dusk, burning Shu camp in the valley below",
    "xuchu": "Xu Chu, huge muscular warrior, bare chest, wild hair, swinging a massive saber at an armored horseman, dust and sparks",
    "dianwei": "Dian Wei, giant warrior with twin halberds, guarding a burning gate alone, flames and arrows around him",
    "zhenji": "Zhen Mi, beautiful noblewoman in pale silk robe, sitting in a captured manor hall, fallen leaves, distant soldiers at the doorway",
    "caoren": "Cao Ren, armored general standing on a flooded city wall, brown water surging below, sword in hand, rain",
    # 蜀
    "liubei": "Liu Bei, benevolent middle-aged lord with long ears and a short beard, yellow robe over armor, sword, swearing brotherhood with two companions over incense in a peach garden, petals falling",
    "guanyu": "Guan Yu, tall imposing general with a long black beard, green robe over lamellar armor, holding a long guandao polearm with a broad crescent blade, charging at Hulao pass, dust",
    "zhangfei": "Zhang Fei, fierce general with a bristling black beard and wide eyes, black armor, wielding a long serpent spear, night duel by torchlight at a mountain pass",
    "zhaoyun": "Zhao Yun, young handsome general in silver-white armor with a blue cape, spear in hand, riding a white horse through enemy lines, a swaddled infant held against his chest, Changban slope",
    "zhugeliang": "Zhuge Liang, elegant scholar in white robe and black headscarf, holding a white goose-feather fan, writing a memorial at a wooden desk with bamboo scrolls, Shu palace hall, candlelight",
    "machao": "Ma Chao, handsome young general in a silver lion-head helmet, white robe and armor, spear, dueling a black-bearded general at a mountain pass at night",
    "huangzhong": "Huang Zhong, old general with a white beard in golden armor, drawing a bow on a mountain ridge, charging downhill",
    "weiyan": "Wei Yan, fierce general with a long sword, surrounded by soldiers, defiant, a hidden blade behind him, army camp at night",
    "jiangwei": "Jiang Wei, young general kneeling and offering his sword to a white-robed strategist with a feather fan, mountain fortress",
    "pangtong": "Pang Tong, short plain-looking strategist in a dark robe, riding a horse through a narrow valley, arrows flying, a fallen phoenix banner",
    "fazheng": "Fa Zheng, sharp-eyed strategist in dark red robe, pointing at a mountain map beside an old general, war tent",
    "huangyueying": "Huang Yueying, young woman in simple blue hanfu with rolled sleeves, examining a wooden ox mechanical cart in a workshop, tools and drawings",
    "xushu": "Xu Shu, scholar on horseback looking back, pointing toward a distant thatched cottage among bamboo, dusty road",
    "liushan": "Liu Shan, young prince in white mourning robe, kneeling beside a dying emperor's bed, candlelight, Shu palace",
    # 吴
    "sunjian": "Sun Jian, tiger-like general in red armor, holding the imperial jade seal found in a well, night, soldiers with torches",
    "sunce": "Sun Ce, young warlord with a spear, riding a horse along a great river, Jiangdong banners, confident grin",
    "sunquan": "Sun Quan, young ruler in green and gold robe, receiving the seal of command in a hall, officials kneeling",
    "zhouyu": "Zhou Yu, handsome young commander in silver armor, sword drawn, standing before burning warships on the Yangtze, red firelight",
    "lusu": "Lu Su, composed scholar in green robe, negotiating with a red-faced general across a table, riverside camp",
    "lvmeng": "Lu Meng, general in white merchant robes over armor, standing on a boat at night on the Yangtze, soldiers disguised as traders",
    "luxun": "Lu Xun, young commander in light armor, watching a forest fire spread through a river gorge, smoke",
    "ganning": "Gan Ning, bold warrior with a feathered headdress and bells, leading a night raid into an enemy camp, sword drawn",
    "taishici": "Taishi Ci, archer on horseback shooting toward a besieged city gate, quiver at his side, dust",
    "huanggai": "Huang Gai, old general with a white beard and scarred back, standing on a warship with fire arrows in the sky",
    "sunshangxiang": "Sun Shangxiang, warrior woman in red armor with a bow, standing on a river boat, a general and a baby behind her",
    "dingfeng": "Ding Feng, old general in a snowstorm, holding a short sword, enemy camp in the blizzard",
    "daqiao": "Da Qiao, elegant young noblewoman in pale lilac hanfu with jade hairpins, sitting by candlelight with a silk book in a captured manor hall, her younger sister beside her",
    "xiaoqiao": "Xiao Qiao, graceful young woman in pale green hanfu with a light cape, holding a guqin, standing in a courtyard with red wedding silk and plum blossoms, a river camp in the distance",
    # 群
    "lvbu": "Lu Bu, peerless warrior with a pheasant-tail headdress, ornate dark armor, riding a red horse, swinging a long halberd at Hulao pass",
    "diaochan": "Diao Chan, beautiful young court lady in flowing pink hanfu with gold hair ornaments, dancing in a moonlit pavilion garden",
    "dongzhuo": "Dong Zhuo, massive tyrant in dark robe and armor, hand on his sword, throne hall, a frightened young emperor behind",
    "yuanshao": "Yuan Shao, noble warlord in ornate gold-trimmed armor, standing before a vast camp with banners, Guandu",
    "yuanshu": "Yuan Shu, arrogant ruler in imperial yellow robe, holding a jade seal, palace hall, servants kneeling",
    "gongsunzan": "Gongsun Zan, general in white armor, leading white-horse cavalry across a bridge, spears and banners",
    "liubiao": "Liu Biao, dignified middle-aged lord in a dark scholarly robe with a sword, seated in a Jingzhou hall, maps and scrolls",
    "zhangjiao": "Zhang Jiao, gaunt yellow-turban sorcerer with a staff, raising his arms before a crowd of yellow-turban rebels, stormy sky",
    "huatuo": "Hua Tuo, old physician with a white beard and medicine box, treating a general's arm, surgical tools, tent",
    "caiwenji": "Cai Wenji, elegant woman in a fur-lined nomadic robe, holding a pipa, snowy grassland, a Han envoy carriage in the distance",
    "chengong": "Chen Gong, stern scholar in a prison robe, facing a captured warrior on a white gate tower, dawn",
    "wangyun": "Wang Yun, old minister with a white beard, holding a secret edict, conspirators in a candlelit hall",
    "menghuo": "Meng Huo, southern king in tribal armor and ornaments, standing before war drums and an elephant in a jungle",
    "hanxiandi": "Emperor Xian, young emperor in imperial robe, writing a secret edict on a silk strip inside his sleeve, dark palace chamber, candle",
    "zhurong": "Zhu Rong, fierce woman warrior with five small knives on her back, spear in hand, riding a horse, southern jungle battle",
}


def seed_for(cid):
    # Stable, distinct seed per character so reruns are reproducible.
    return 1000 + sorted(PROMPTS).index(cid) * 7


def post(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=HDRS)
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())


def get(url, timeout=300):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def generate(cid, prompt, out):
    res = post(f"{SPACE}/gradio_api/call/infer",
               {"data": [prompt, seed_for(cid), False, W, H, 4]})
    body = get(f"{SPACE}/gradio_api/call/infer/{res['event_id']}")
    data = None
    for line in body.splitlines():
        if line.startswith("data: "):
            data = json.loads(line[6:])
    if not data or not data[0]:
        raise RuntimeError("generation returned no image (quota or space error)")
    req = urllib.request.Request(data[0]["url"], headers=HDRS)
    with urllib.request.urlopen(req, timeout=120) as r:
        blob = r.read()
    with open(out, "wb") as f:
        f.write(blob)
    return len(blob)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--retries", type=int, default=3)
    ap.add_argument("--delay", type=float, default=2.0)
    args = ap.parse_args()

    if args.list:
        for cid in sorted(PROMPTS):
            print(cid, "|", PROMPTS[cid])
        return

    os.makedirs(OUT, exist_ok=True)
    ids = [s.strip() for s in args.only.split(",") if s.strip()] or sorted(PROMPTS)
    for cid in ids:
        out = os.path.join(OUT, f"{cid}.webp")
        if os.path.exists(out) and os.path.getsize(out) > 10000:
            print(cid, "exists")
            continue
        prompt = f"{STYLE}: {PROMPTS[cid]}"
        for attempt in range(1, args.retries + 1):
            try:
                size = generate(cid, prompt, out)
                print(cid, "ok", size, flush=True)
                break
            except Exception as exc:  # noqa: BLE001 - report and retry
                print(cid, f"attempt {attempt} failed: {exc}", file=sys.stderr, flush=True)
                time.sleep(20 * attempt)
        else:
            print(cid, "FAILED", flush=True)
        time.sleep(args.delay)


if __name__ == "__main__":
    main()
