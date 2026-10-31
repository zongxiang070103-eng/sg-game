"""Build codex poster plates from ordered WDL11391 woodblock panels.

Usage: python -I _shots/make-plates.py
Requires _assets-tmp/panel-index.json and assets/codex/.
Writes WebP files plus _assets-tmp/plate-report.json.

The raw scans are not committed (see assets/codex/SOURCE.md for the source
URLs); re-download them into _assets-tmp/ before running this.
"""
import json
import os
from PIL import Image, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PANELS = os.path.join(ROOT, "_assets-tmp", "panels")
OUT = os.path.join(ROOT, "assets", "codex")
INDEX = os.path.join(ROOT, "_assets-tmp", "panel-index.json")

# character -> (chapter, slot, css object-position, optional rotate)
PLATE_MAP = {
    "caopi": (80, 1, "50% 42%"),
    "simayi": (107, 1, "50% 44%"),
    "guojia": (33, 2, "50% 44%"),
    "xunyu": (14, 1, "50% 46%"),
    "jiaxu": (9, 2, "50% 46%"),
    "xiahoudun": (18, 2, "50% 46%"),
    "zhangliao": (67, 2, "50% 46%"),
    "xuhuang": (76, 1, "50% 46%"),
    "zhanghe": (95, 1, "50% 46%"),
    "xuchu": (59, 1, "50% 46%"),
    "dianwei": (16, 2, "50% 46%"),
    "zhenji": (33, 1, "50% 44%"),
    "caoren": (74, 2, "50% 46%"),
    "zhaoyun": (41, 2, "50% 46%"),
    "zhugeliang": (91, 2, "50% 44%"),
    "huangzhong": (71, 1, "74% 48%"),
    "weiyan": (105, 2, "50% 42%"),
    "jiangwei": (93, 1, "50% 44%"),
    "pangtong": (63, 1, "50% 46%"),
    "fazheng": (71, 1, "20% 44%"),
    "xushu": (36, 2, "50% 46%"),
    "liushan": (85, 1, "50% 46%"),
    "sunjian": (6, 2, "50% 46%"),
    "sunce": (15, 2, "50% 46%"),
    "sunquan": (29, 2, "50% 46%"),
    "zhouyu": (49, 2, "50% 46%"),
    "lusu": (66, 1, "50% 46%"),
    "lvmeng": (75, 2, "50% 46%"),
    "luxun": (84, 1, "50% 46%"),
    "ganning": (68, 1, "50% 46%"),
    "taishici": (11, 1, "50% 46%"),
    "huanggai": (46, 2, "50% 46%"),
    "sunshangxiang": (61, 1, "50% 44%"),
    "dingfeng": (108, 1, "50% 46%"),
    "yuanshao": (30, 1, "50% 46%"),
    "yuanshu": (17, 1, "50% 46%"),
    "gongsunzan": (7, 1, "50% 46%"),
    "zhangjiao": (1, 2, "50% 46%"),
    "huatuo": (75, 1, "50% 46%"),
    "chengong": (19, 2, "50% 46%"),
    "wangyun": (8, 1, "50% 44%"),
    "menghuo": (90, 2, "50% 46%"),
    "hanxiandi": (20, 2, "50% 46%"),
}

# Panels printed sideways on the page, keyed by panel id.
ROTATE = {"p8b"}

# Cases where the printed illustration order is reversed inside a chapter.
PANEL_OVERRIDE = {
    "hanxiandi": "p23b",  # 董国舅内阁受诏 (衣带诏)
}

CHINESE = {
    1: ("宴桃园豪杰三结义", "斩黄巾英雄首立功"),
    4: ("废汉帝陈留践位", "谋董贼孟德献刀"),
    5: ("发矫诏诸镇应曹公", "破关兵三英战吕布"),
    6: ("焚金阙董卓行凶", "匿玉玺孙坚背约"),
    7: ("袁绍磐河战公孙", "孙坚跨江击刘表"),
    8: ("王司徒巧使连环计", "董太师大闹凤仪亭"),
    9: ("除暴凶吕布助司徒", "犯长安李傕听贾诩"),
    11: ("刘皇叔北海救孔融", "吕温侯濮阳破曹操"),
    14: ("曹孟德移驾幸许都", "吕奉先乘夜袭徐郡"),
    15: ("太史慈酣斗小霸王", "孙伯符大战严白虎"),
    16: ("吕奉先射戟辕门", "曹孟德败师淯水"),
    17: ("袁公路大起七军", "曹孟德会合三将"),
    18: ("贾文和料敌决胜", "夏侯惇拔矢啖睛"),
    19: ("下邳城曹操鏖兵", "白门楼吕布殒命"),
    20: ("曹阿瞒许田打围", "董国舅内阁受诏"),
    29: ("小霸王怒斩于吉", "碧眼儿坐领江东"),
    30: ("战官渡本初败绩", "劫乌巢孟德烧粮"),
    33: ("曹丕乘乱纳甄氏", "郭嘉遗计定辽东"),
    36: ("玄德用计袭樊城", "元直走马荐诸葛"),
    41: ("刘玄德携民渡江", "赵子龙单骑救主"),
    46: ("用奇谋孔明借箭", "献密计黄盖受刑"),
    49: ("七星坛诸葛祭风", "三江口周瑜纵火"),
    59: ("许褚裸衣斗马超", "曹操抹书间韩遂"),
    61: ("赵云截江夺阿斗", "孙权遗书退老瞒"),
    63: ("诸葛亮痛哭庞统", "张翼德义释严颜"),
    66: ("关云长单刀赴会", "伏皇后为国捐生"),
    67: ("曹操平定汉中地", "张辽威震逍遥津"),
    68: ("甘宁百骑劫魏营", "左慈掷杯戏曹操"),
    71: ("占对山黄忠逸待劳", "据汉水赵云寡胜众"),
    74: ("庞令明抬榇决死战", "关云长放水淹七军"),
    75: ("关云长刮骨疗毒", "吕子明白衣渡江"),
    76: ("徐公明大战沔水", "关云长败走麦城"),
    80: ("曹丕废帝篡炎刘", "汉王正位续大统"),
    84: ("陆逊营烧七百里", "孔明巧布八阵图"),
    85: ("刘先主遗诏托孤儿", "诸葛亮安居平五路"),
    90: ("驱巨兽六破蛮兵", "烧藤甲七擒孟获"),
    91: ("祭泸水汉相班师", "伐中原武侯上表"),
    93: ("姜伯约归降孔明", "武乡侯骂死王朗"),
    95: ("马谡拒谏失街亭", "武侯弹琴退仲达"),
    105: ("武侯预伏锦囊计", "魏延反骨被马岱"),
    107: ("魏主政归司马氏", "姜维兵败牛头山"),
    108: ("丁奉雪中奋短兵", "孙峻席间施密计"),
    11: ("刘皇叔北海救孔融", "吕温侯濮阳破曹操"),
}


def main():
    idx = json.load(open(INDEX, encoding="utf-8"))["ordered"]
    by_index = {x["index"]: x for x in idx}
    os.makedirs(OUT, exist_ok=True)
    report = []
    for cid, (chapter, slot, pos) in PLATE_MAP.items():
        key = PANEL_OVERRIDE.get(cid)
        if not key:
            n = 2 * chapter - 2 + slot
            item = by_index.get(n)
            if not item:
                print("MISSING index", n, cid)
                continue
            key = item["key"]
        else:
            item = next((x for x in idx if x["key"] == key), {"key": key})
        path = os.path.join(PANELS, key + ".jpg")
        im = Image.open(path).convert("RGB")
        if key in ROTATE:
            im = im.rotate(-90, expand=True)
        # The panel crop still carries a thin scanner band on some pages.
        # Shaving 1.4% / 1.8% keeps the printed frame and drops the band.
        w, h = im.size
        im = im.crop((int(w * 0.014), int(h * 0.018), int(w * 0.986), int(h * 0.982)))
        # Normalize the aged paper without killing its character.
        im = ImageOps.autocontrast(im, cutoff=(1, 1))
        im = ImageEnhance.Color(im).enhance(0.92)
        im = ImageEnhance.Contrast(im).enhance(1.04)
        if im.width > 1100:
            im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
        name = f"{cid}-plate.webp"
        im.save(os.path.join(OUT, name), "WEBP", quality=88, method=6)
        title = CHINESE.get(chapter, ("", ""))[slot - 1]
        report.append({"id": cid, "src": name, "pos": pos, "panel": key, "chapter": chapter, "slot": slot, "caption": title})
        print(cid, name, key, f"ch{chapter}-{slot}", title)
    json.dump(report, open(os.path.join(ROOT, "_assets-tmp", "plate-report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("plates", len(report))


if __name__ == "__main__":
    main()
