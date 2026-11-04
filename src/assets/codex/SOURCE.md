# 图鉴图版来源

本目录的 57 张人物图版全部取自公有领域历史图像，分为三类：**清大魁堂刊《三国演义》回目插图**（43 张）、**旧有清刻 / 颐和园长廊彩绘**（7 张，用于 8 位人物，张飞与马超共用一张）、以及 **补缺图版**（6 张，用于没有 WDL11391 回目插图的黄月英、大乔、小乔、刘表、蔡琰、祝融夫人）。界面中不再使用本项目绘制的原创人物场景。

## 一、主来源：WDL11391

- 文件页：<https://commons.wikimedia.org/wiki/File:Romance_of_the_Three_Kingdoms_in_Illustrations_WDL11391.pdf>
- 数字馆藏：World Digital Library / Library of Congress，**公有领域**。
- 版本：清大魁堂刊《三国演义》插图本，一页两幅回目插图，图旁有刻印题记。
- 本项目只使用该 PDF 的回目插图页（第 4–124 页），按 1280px 宽从 Wikimedia 缩略图服务取得页面渲染，再裁出上、下两幅。

### 页序与回目对应

- 第 4 页上半是序文，不是插图，已排除。
- 第 31 页下半、第 32 页上半是空白叶，已排除。
- 排除后：`p4b` = 第 1 回第 1 幅，`p42a` = 第 37 回第 2 幅，`p85b` = 第 80 回第 1 幅。以上三点均以原刻题记核对过（「玄德风雪请孔明」「废献帝曹丕篡汉」）。
- 同一回的两幅插图**不总是**按回目上下句顺序排列。第 20 回即为例外：`p23b` 是「董国舅内阁受诏」（衣带诏），`p24a` 才是「曹阿瞒许田打围」。汉献帝条因此使用 `p23b`。

### 裁切与调色

- 裁到原刻边框以内，去掉书页扫描黑边、页码与装订折痕；保留边框、纸色与部分原刻题记。
- 轻度自动对比、降饱和、加对比；不重绘、不补笔。
- 统一转为 WebP（quality 88，最长边约 1100px）。
- 卡片使用 3:4 竖幅裁切（`object-fit: cover`），详情页显示完整图版（`object-fit: contain`），因此同一张图在卡片上是特写、在册页里是整幅。

### 逐图对应

| 人物 id | 文件 | 回目 / 原刻题记 | 页-幅 |
| --- | --- | --- | --- |
| caopi | `caopi-plate.webp` | 第 80 回 · 曹丕废帝篡炎刘 | `p85b` |
| simayi | `simayi-plate.webp` | 第 107 回 · 魏主政归司马氏 | `p113b` |
| guojia | `guojia-plate.webp` | 第 33 回 · 郭嘉遗计定辽东 | `p38a` |
| xunyu | `xunyu-plate.webp` | 第 14 回 · 曹孟德移驾幸许都 | `p17b` |
| jiaxu | `jiaxu-plate.webp` | 第 9 回 · 犯长安李傕听贾诩 | `p13a` |
| xiahoudun | `xiahoudun-plate.webp` | 第 18 回 · 夏侯惇拔矢啖睛 | `p22a` |
| zhangliao | `zhangliao-plate.webp` | 第 67 回 · 张辽威震逍遥津 | `p73a` |
| xuhuang | `xuhuang-plate.webp` | 第 76 回 · 徐公明大战沔水 | `p81b` |
| zhanghe | `zhanghe-plate.webp` | 第 95 回 · 马谡拒谏失街亭 | `p100b` |
| xuchu | `xuchu-plate.webp` | 第 59 回 · 许褚裸衣斗马超 | `p63b` |
| dianwei | `dianwei-plate.webp` | 第 16 回 · 曹孟德败师淯水 | `p20a` |
| zhenji | `zhenji-plate.webp` | 第 33 回 · 曹丕乘乱纳甄氏 | `p37b` |
| caoren | `caoren-plate.webp` | 第 74 回 · 关云长放水淹七军 | `p80a` |
| zhaoyun | `zhaoyun-plate.webp` | 第 41 回 · 赵子龙单骑救主 | `p46a` |
| zhugeliang | `zhugeliang-plate.webp` | 第 91 回 · 伐中原武侯上表 | `p97a` |
| huangzhong | `huangzhong-plate.webp` | 第 71 回 · 占对山黄忠逸待劳 | `p76b` |
| weiyan | `weiyan-plate.webp` | 第 105 回 · 魏延反骨被马岱 | `p112a` |
| jiangwei | `jiangwei-plate.webp` | 第 93 回 · 姜伯约归降孔明 | `p98b` |
| pangtong | `pangtong-plate.webp` | 第 63 回 · 诸葛亮痛哭庞统 | `p67b` |
| fazheng | `fazheng-plate.webp` | 第 71 回 · 占对山黄忠逸待劳（与黄忠同图，裁切不同） | `p76b` |
| xushu | `xushu-plate.webp` | 第 36 回 · 元直走马荐诸葛 | `p41a` |
| liushan | `liushan-plate.webp` | 第 85 回 · 刘先主遗诏托孤儿 | `p90b` |
| sunjian | `sunjian-plate.webp` | 第 6 回 · 匿玉玺孙坚背约 | `p10a` |
| sunce | `sunce-plate.webp` | 第 15 回 · 孙伯符大战严白虎 | `p19a` |
| sunquan | `sunquan-plate.webp` | 第 29 回 · 碧眼儿坐领江东 | `p34a` |
| zhouyu | `zhouyu-plate.webp` | 第 49 回 · 三江口周瑜纵火 | `p54a` |
| lusu | `lusu-plate.webp` | 第 66 回 · 关云长单刀赴会 | `p71b` |
| lvmeng | `lvmeng-plate.webp` | 第 75 回 · 吕子明白衣渡江 | `p81a` |
| luxun | `luxun-plate.webp` | 第 84 回 · 陆逊营烧七百里 | `p89b` |
| ganning | `ganning-plate.webp` | 第 68 回 · 甘宁百骑劫魏营 | `p73b` |
| taishici | `taishici-plate.webp` | 第 11 回 · 刘皇叔北海救孔融 | `p14b` |
| huanggai | `huanggai-plate.webp` | 第 46 回 · 献密计黄盖受刑 | `p51a` |
| sunshangxiang | `sunshangxiang-plate.webp` | 第 61 回 · 赵云截江夺阿斗 | `p65b` |
| dingfeng | `dingfeng-plate.webp` | 第 108 回 · 丁奉雪中奋短兵 | `p114b` |
| yuanshao | `yuanshao-plate.webp` | 第 30 回 · 战官渡本初败绩 | `p34b` |
| yuanshu | `yuanshu-plate.webp` | 第 17 回 · 袁公路大起七军 | `p20b` |
| gongsunzan | `gongsunzan-plate.webp` | 第 7 回 · 袁绍磐河战公孙 | `p10b` |
| zhangjiao | `zhangjiao-plate.webp` | 第 1 回 · 斩黄巾英雄首立功 | `p5a` |
| huatuo | `huatuo-plate.webp` | 第 75 回 · 关云长刮骨疗毒 | `p80b` |
| chengong | `chengong-plate.webp` | 第 19 回 · 白门楼吕布殒命 | `p23a` |
| wangyun | `wangyun-plate.webp` | 第 8 回 · 王司徒巧使连环计 | `p11b` |
| menghuo | `menghuo-plate.webp` | 第 90 回 · 烧藤甲七擒孟获 | `p96a` |
| hanxiandi | `hanxiandi-plate.webp` | 第 20 回 · 董国舅内阁受诏 | `p23b` |

说明：

- **法正**与**黄忠**都取第 71 回「占对山黄忠逸待劳」一幅：定军山是两人共同的事件，法正是献策者。两张卡使用不同的横向裁切（黄忠取右幅冲阵，法正取左幅对山），详情页共用整幅图版。
- **汉献帝**用 `p23b`，该印本把「董国舅内阁受诏」排在「许田打围」之前，与回目上下句顺序相反。
- 张角条没有「黄巾起义」的独立插图，采用第 1 回「斩黄巾英雄首立功」，画面仍是黄巾之乱。
- 曹仁条采用「关云长放水淹七军」，画面是樊城被水淹的守城视角，与「樊城死守」对应。

## 二、旧有历史图版（7 张）

以下图版在本轮之前已存在，仍用于 8 位人物：

| 文件 | 用于 | 内容 | 来源 |
| --- | --- | --- | --- |
| `caocao-liubei.webp` | 曹操 | 青梅煮酒论英雄 | 清刻《三国演义》插图，公有领域 |
| `yellow-turban.webp` | 刘备 | 桃园结义 / 讨黄巾 | 清刻《三国演义》插图，公有领域 |
| `hulao.webp` | 吕布 | 虎牢关三英战吕布 | 清刻《三国演义》插图，公有领域 |
| `court-dong.webp` | 董卓 | 废少帝、立献帝 | 清刻《三国演义》插图，公有领域 |
| `hulao-color.webp` | 关羽 | 虎牢关三英战吕布 | 颐和园长廊彩绘，公有领域摄影 |
| `zhangfei-machao.webp` | 张飞、马超 | 葭萌关夜战 | 颐和园长廊彩绘，公有领域摄影 |
| `lvbu-diaochan.webp` | 貂蝉 | 凤仪亭 / 连环计 | 颐和园长廊彩绘，公有领域摄影 |

清刻图的版本与具体 Commons 文件页未逐张记录；它们与 WDL11391 同属清代《三国演义》插图系统，均标注为公有领域。颐和园长廊彩绘为清代建筑彩画，照片取自 Wikimedia Commons 的公有领域文件。

`court-dingyuan.webp`、`lvbu-dingyuan.webp`、`wangyun-gate.webp`、`wangyun-court.webp`、`emperor-xian.webp` 是早先挑选的备用图版，当前界面不再使用，保留在目录中以便回退，不计入「57 张历史海报」。

## 三、补缺图版（6 张）

WDL11391 中没有这 6 位人物的对应回目插图。补图优先选「画面能读出一个具体事件」的公有领域古版画，而不是任意人物像；全部列出原始文件页与处理方式。

| 人物 | 文件 | 事件 / 画面 | 来源与许可 |
| --- | --- | --- | --- |
| 黄月英 | `huangyueying-plate.webp` | 孔明造木牛流马；黄月英本人不在画中 | <https://commons.wikimedia.org/wiki/File:Shu_forces_construct_wooden_oxen_and_flowing_horses.jpg>，清刻《三国演义》插图，公有领域，原图 500×397 |
| 大乔 | `daqiao-plate.webp` | 二乔秉烛共读（对应孙策纳大乔） | <https://commons.wikimedia.org/wiki/File:%E5%8F%A4%E4%BB%8A%E7%99%BE%E7%BE%8E%E5%9C%96%E4%B9%8B%E4%BA%8C%E5%96%AC%EF%BC%88One_hundred_beauties_Qiao_sister%EF%BC%89.png>，吴友如《古今百美图》之二乔，19 世纪，公有领域，原图 1797×1445 |
| 小乔 | `xiaoqiao-plate.webp` | 同上，裁切偏右，突出小乔 | 同上 |
| 蔡琰 | `caiwenji-plate.webp` | 胡帐中倚笥独坐，夜不能寐（文姬归汉 / 胡笳十八拍） | <https://commons.wikimedia.org/wiki/File:%E5%8F%A4%E4%BB%8A%E7%99%BE%E7%BE%8E%E5%9C%96%E4%B9%8B%E6%96%87%E5%A7%AC%EF%BC%88One_hundred_beauties_Wenji%EF%BC%89.png>，吴友如《古今百美图》之文姬，公有领域，原图 1797×1471 |
| 刘表 | `liubiao-plate.webp`（详情）/ `liubiao-card.webp`（卡片） | 题「安坐镇荆州」的刘表绣像 | <https://commons.wikimedia.org/wiki/File:Liu_Biao_Qing_portait.jpg>，清刻《增像全图三国演义》绣像，1906 年，公有领域，原图 359×479 |
| 祝融夫人 | `zhurong-plate.webp` | 祝融夫人横矛纵马、力拒蜀军，原题「孟获妻 祝融夫人」 | <https://commons.wikimedia.org/wiki/File:Komei_muttsu_toriko_Mokaku_%E5%AD%94%E6%98%8E%E5%85%AD%E6%93%92%E5%AD%9F%E7%8D%B2_(BM_2008,3037.20004_2).jpg>，歌川国芳《孔明六擒孟获》，1854 年，大英博物馆藏，公有领域，原图 1084×1600 |

处理说明：

- 线描图统一转为暖纸色：灰度 → 自动对比（cutoff 0.2）→ 双色调映射（墨 `#261e15`、纸 `#dbcbad`）→ 轻微对比。界面再以 `mix-blend-mode: multiply` 叠在纸纹上。
- 小图用 Lanczos 放大并做轻度 USM 锐化：黄月英 500→800px，刘表 359→720px（卡片另裁 270×360 的人物特写，避开右侧题字，给竖排姓名留位）。
- 祝融夫人保留浮世绘原色，只裁掉白边与底部的印刷校色条；卡片与详情均用色版，不再做双色调。
- 大乔、小乔、蔡琰裁成 3:4；卡片与详情共用同一裁切，靠不同取景区分姊妹。
- 界面中不再使用 `codex-art.js` 生成的原创人物场景；该脚本仍用于战役示意图。

## 四、许可

- WDL11391 扫描件：World Digital Library / Library of Congress，公有领域。
- 清刻插图与颐和园长廊彩绘：清代作品，公有领域；Commons 文件页标注为公有领域。
- 吴友如《古今百美图》：作者卒于约 1893 年，19 世纪作品，公有领域；Commons 文件页标注为 Public domain，来源为湖南美术出版社《古今百美图》。
- 歌川国芳《孔明六擒孟获》：1854 年浮世绘，大英博物馆藏，Commons 标注 Public domain。
- 本项目手写的 SVG 战役图、界面代码：沿用项目根目录 MIT License。
- 未使用《三国杀》、光荣特库摩或其他商业三国游戏的图版、卡框、图标或字体。
