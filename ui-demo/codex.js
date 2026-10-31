'use strict';

/* ============================================================
   将星图鉴
   57 位人物 · 26 场战役 · 20 项成就
   人物页展示游戏面板：势力、定位、五项属性与两个战法。
   面板数据见 codex-roster.js，人物图版来源逐条注明。
   ============================================================ */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const FACTION = {
    wei: { name: '魏', full: '曹魏', accent: '#3f5f91', pale: '#c9d3df', note: '挟天子以令诸侯，据中原之厚。' },
    shu: { name: '蜀', full: '蜀汉', accent: '#356a50', pale: '#c9d9c8', note: '以汉室正统自居，据益州之险。' },
    wu: { name: '吴', full: '东吴', accent: '#9a452f', pale: '#e2cbb8', note: '坐断东南，凭长江之固。' },
    qun: { name: '群', full: '群雄', accent: '#8b6a2c', pale: '#dccda9', note: '汉末乱世，逐鹿于中原与四裔。' },
  };

  const TYPE = {
    ruler: '君主',
    strategist: '谋士',
    warrior: '武将',
    lady: '女杰',
    healer: '方技',
    rebel: '义军',
  };

  const PLATE_SOURCE = '清刻《三国演义》插图 · 公有领域';
  const CORRIDOR_SOURCE = '颐和园长廊彩绘 · 公有领域摄影';
  const BAIMEI_SOURCE = '吴友如《古今百美图》· 公有领域';
  const PORTRAIT_SOURCE = '清刻《增像全图三国演义》绣像 · 公有领域';
  const UKIYOE_SOURCE = '歌川国芳《孔明六擒孟获》· 大英博物馆 · 公有领域';
  const SCENE_SOURCE = '纸雕剪影 · 本项目绘制，非古画';

  const CHARACTERS = [
    /* ================= 魏 ================= */
    {
      id: 'caocao', name: '曹操', zi: '孟德', faction: 'wei', type: 'ruler', title: '魏武帝',
      battle: 'guandu',
      art: { kind: 'plate', src: 'caocao-liubei.webp', pos: '58% 36%', source: PLATE_SOURCE },
    },
    {
      id: 'caopi', name: '曹丕', zi: '子桓', faction: 'wei', type: 'ruler', title: '魏文帝',
      battle: null,
      art: { kind: 'scene', scene: 'court', props: ['throne', 'seal', 'banners', 'incense'], figure: 'ruler', weapon: 'sword' },
    },
    {
      id: 'simayi', name: '司马懿', zi: '仲达', faction: 'wei', type: 'strategist', title: '晋宣帝',
      battle: 'gaopingling',
      art: { kind: 'scene', scene: 'court', props: ['city', 'spears', 'seal', 'lanterns'], figure: 'strategist', weapon: 'sword', flip: true },
    },
    {
      id: 'guojia', name: '郭嘉', zi: '奉孝', faction: 'wei', type: 'strategist', title: '贞侯',
      battle: 'guandu',
      art: { kind: 'scene', scene: 'warroom', props: ['map', 'scrolls', 'lantern', 'incense'], figure: 'strategist', weapon: 'fan' },
    },
    {
      id: 'xunyu', name: '荀彧', zi: '文若', faction: 'wei', type: 'strategist', title: '敬侯',
      battle: 'guandu',
      art: { kind: 'scene', scene: 'court', props: ['throne', 'scrolls', 'banners', 'incense'], figure: 'strategist', weapon: 'fan', flip: true },
    },
    {
      id: 'jiaxu', name: '贾诩', zi: '文和', faction: 'wei', type: 'strategist', title: '肃侯',
      battle: 'changan',
      art: { kind: 'plate', src: 'wangyun-gate.webp', pos: '52% 42%', source: PLATE_SOURCE },
    },
    {
      id: 'xiahoudun', name: '夏侯惇', zi: '元让', faction: 'wei', type: 'warrior', title: '高安乡侯',
      battle: null,
      art: { kind: 'scene', scene: 'horse', props: ['arrows', 'spears', 'banners', 'dust'], figure: 'warrior', weapon: 'spear', flip: true },
    },
    {
      id: 'zhangliao', name: '张辽', zi: '文远', faction: 'wei', type: 'warrior', title: '晋阳侯',
      battle: 'hefei',
      art: { kind: 'scene', scene: 'river', props: ['city', 'horse', 'spears', 'banners'], figure: 'warrior', weapon: 'halberd' },
    },
    {
      id: 'xuhuang', name: '徐晃', zi: '公明', faction: 'wei', type: 'warrior', title: '阳平侯',
      battle: 'fancheng',
      art: { kind: 'scene', scene: 'city', props: ['spears', 'banners', 'river', 'dust'], figure: 'warrior', weapon: 'glaive', flip: true },
    },
    {
      id: 'zhanghe', name: '张郃', zi: '儁乂', faction: 'wei', type: 'warrior', title: '鄚侯',
      battle: 'jieting',
      art: { kind: 'scene', scene: 'mountain', props: ['spears', 'tents', 'banners', 'dust'], figure: 'warrior', weapon: 'spear' },
    },
    {
      id: 'xuchu', name: '许褚', zi: '仲康', faction: 'wei', type: 'warrior', title: '牟乡侯',
      battle: 'tongguan',
      art: { kind: 'scene', scene: 'horse', props: ['spears', 'dust', 'banners'], figure: 'warrior', weapon: 'blade', flip: true },
    },
    {
      id: 'dianwei', name: '典韦', zi: '未知', faction: 'wei', type: 'warrior', title: '忠侯',
      battle: 'wan',
      art: { kind: 'scene', scene: 'fire', props: ['city', 'spears', 'halberd', 'smoke'], figure: 'warrior', weapon: 'halberd' },
    },
    {
      id: 'zhenji', name: '甄宓', zi: '无', faction: 'wei', type: 'lady', title: '文昭甄皇后',
      battle: null,
      art: { kind: 'scene', scene: 'moon', props: ['lotus', 'ribbon', 'moon'], figure: 'lady', weapon: 'none', flip: true },
    },
    {
      id: 'caoren', name: '曹仁', zi: '子孝', faction: 'wei', type: 'warrior', title: '忠侯',
      battle: 'fancheng',
      art: { kind: 'scene', scene: 'city', props: ['river', 'spears', 'banners', 'rain'], figure: 'warrior', weapon: 'sword' },
    },

    /* ================= 蜀 ================= */
    {
      id: 'liubei', name: '刘备', zi: '玄德', faction: 'shu', type: 'ruler', title: '昭烈帝',
      battle: 'yellow-turban',
      art: { kind: 'plate', src: 'yellow-turban.webp', pos: '48% 52%', source: PLATE_SOURCE },
    },
    {
      id: 'guanyu', name: '关羽', zi: '云长', faction: 'shu', type: 'warrior', title: '汉寿亭侯',
      battle: 'taodong',
      art: { kind: 'plate', src: 'hulao-color.webp', pos: '76% 42%', color: true, source: CORRIDOR_SOURCE },
    },
    {
      id: 'zhangfei', name: '张飞', zi: '益德', faction: 'shu', type: 'warrior', title: '桓侯',
      battle: 'jiameng',
      art: { kind: 'plate', src: 'zhangfei-machao.webp', pos: '76% 54%', color: true, source: CORRIDOR_SOURCE },
    },
    {
      id: 'zhaoyun', name: '赵云', zi: '子龙', faction: 'shu', type: 'warrior', title: '顺平侯',
      battle: 'changban',
      art: { kind: 'scene', scene: 'horse', props: ['spears', 'baby', 'banners', 'dust'], figure: 'warrior', weapon: 'spear', flip: true },
    },
    {
      id: 'zhugeliang', name: '诸葛亮', zi: '孔明', faction: 'shu', type: 'strategist', title: '忠武侯',
      battle: 'wuzhangyuan',
      art: { kind: 'scene', scene: 'warroom', props: ['map', 'scrolls', 'lantern', 'feather'], figure: 'strategist', weapon: 'fan' },
    },
    {
      id: 'machao', name: '马超', zi: '孟起', faction: 'shu', type: 'warrior', title: '斄乡侯',
      battle: 'jiameng',
      art: { kind: 'plate', src: 'zhangfei-machao.webp', pos: '18% 54%', color: true, source: CORRIDOR_SOURCE },
    },
    {
      id: 'huangzhong', name: '黄忠', zi: '汉升', faction: 'shu', type: 'warrior', title: '刚侯',
      battle: 'dingjun',
      art: { kind: 'scene', scene: 'mountain', props: ['banners', 'spears', 'horse', 'dust'], figure: 'warrior', weapon: 'glaive', flip: true },
    },
    {
      id: 'weiyan', name: '魏延', zi: '文长', faction: 'shu', type: 'warrior', title: '南郑侯',
      battle: 'wuzhangyuan',
      art: { kind: 'scene', scene: 'mountain', props: ['spears', 'tents', 'banners', 'rain'], figure: 'warrior', weapon: 'glaive' },
    },
    {
      id: 'jiangwei', name: '姜维', zi: '伯约', faction: 'shu', type: 'warrior', title: '平襄侯',
      battle: 'mieshu',
      art: { kind: 'scene', scene: 'mountain', props: ['city', 'spears', 'banners', 'rain'], figure: 'warrior', weapon: 'spear', flip: true },
    },
    {
      id: 'pangtong', name: '庞统', zi: '士元', faction: 'shu', type: 'strategist', title: '靖侯',
      battle: 'luofeng',
      art: { kind: 'scene', scene: 'mountain', props: ['arrows', 'horse', 'banners', 'rain'], figure: 'strategist', weapon: 'sword', flip: true },
    },
    {
      id: 'fazheng', name: '法正', zi: '孝直', faction: 'shu', type: 'strategist', title: '翼侯',
      battle: 'dingjun',
      art: { kind: 'scene', scene: 'warroom', props: ['map', 'scrolls', 'spears', 'lantern'], figure: 'strategist', weapon: 'fan', flip: true },
    },
    {
      id: 'huangyueying', name: '黄月英', zi: '无', faction: 'shu', type: 'lady', title: '黄夫人',
      battle: null,
      art: { kind: 'scene', scene: 'workshop', props: ['ox', 'carts', 'scrolls'], figure: 'lady', weapon: 'none' },
    },
    {
      id: 'xushu', name: '徐庶', zi: '元直', faction: 'shu', type: 'strategist', title: '徐庶',
      battle: null,
      art: { kind: 'scene', scene: 'horse', props: ['bamboo', 'banners', 'dust'], figure: 'strategist', weapon: 'sword' },
    },
    {
      id: 'liushan', name: '刘禅', zi: '公嗣', faction: 'shu', type: 'ruler', title: '蜀后主',
      battle: 'mieshu',
      art: { kind: 'scene', scene: 'court', props: ['wine', 'drums', 'throne', 'lanterns'], figure: 'ruler', weapon: 'none', flip: true },
    },

    /* ================= 吴 ================= */
    {
      id: 'sunjian', name: '孙坚', zi: '文台', faction: 'wu', type: 'ruler', title: '武烈皇帝',
      battle: 'taodong',
      art: { kind: 'scene', scene: 'city', props: ['horse', 'spears', 'banners', 'fire'], figure: 'ruler', weapon: 'glaive' },
    },
    {
      id: 'sunce', name: '孙策', zi: '伯符', faction: 'wu', type: 'ruler', title: '长沙桓王',
      battle: 'jiangdong',
      art: { kind: 'scene', scene: 'river', props: ['horse', 'spears', 'boats', 'banners'], figure: 'warrior', weapon: 'spear' },
    },
    {
      id: 'sunquan', name: '孙权', zi: '仲谋', faction: 'wu', type: 'ruler', title: '吴大帝',
      battle: 'chibi',
      art: { kind: 'scene', scene: 'warroom', props: ['map', 'ships', 'throne', 'banners'], figure: 'ruler', weapon: 'sword', flip: true },
    },
    {
      id: 'zhouyu', name: '周瑜', zi: '公瑾', faction: 'wu', type: 'strategist', title: '偏将军',
      battle: 'chibi',
      art: { kind: 'scene', scene: 'fire', props: ['ships', 'river', 'banners', 'smoke'], figure: 'strategist', weapon: 'sword' },
    },
    {
      id: 'lusu', name: '鲁肃', zi: '子敬', faction: 'wu', type: 'strategist', title: '横江将军',
      battle: null,
      art: { kind: 'scene', scene: 'river', props: ['boat', 'swords', 'lanterns', 'reeds'], figure: 'strategist', weapon: 'none' },
    },
    {
      id: 'lvmeng', name: '吕蒙', zi: '子明', faction: 'wu', type: 'strategist', title: '孱陵侯',
      battle: 'baijiang',
      art: { kind: 'scene', scene: 'river', props: ['boats', 'spears', 'snow', 'banners'], figure: 'strategist', weapon: 'sword', flip: true },
    },
    {
      id: 'luxun', name: '陆逊', zi: '伯言', faction: 'wu', type: 'strategist', title: '昭侯',
      battle: 'yiling',
      art: { kind: 'scene', scene: 'fire', props: ['jungle', 'tents', 'spears', 'smoke'], figure: 'strategist', weapon: 'sword' },
    },
    {
      id: 'ganning', name: '甘宁', zi: '兴霸', faction: 'wu', type: 'warrior', title: '折冲将军',
      battle: 'ruxu',
      art: { kind: 'scene', scene: 'horse', props: ['tents', 'spears', 'fire', 'banners'], figure: 'warrior', weapon: 'blade' },
    },
    {
      id: 'taishici', name: '太史慈', zi: '子义', faction: 'wu', type: 'warrior', title: '建昌都尉',
      battle: null,
      art: { kind: 'scene', scene: 'city', props: ['bow', 'horse', 'arrows', 'banners'], figure: 'warrior', weapon: 'bow', flip: true },
    },
    {
      id: 'huanggai', name: '黄盖', zi: '公覆', faction: 'wu', type: 'warrior', title: '偏将军',
      battle: 'chibi',
      art: { kind: 'scene', scene: 'fire', props: ['ships', 'river', 'banners', 'smoke'], figure: 'warrior', weapon: 'blade', flip: true },
    },
    {
      id: 'daqiao', name: '大乔', zi: '无', faction: 'wu', type: 'lady', title: '江东二乔',
      battle: 'jiangdong',
      art: { kind: 'scene', scene: 'moon', props: ['pavilion', 'qin', 'ribbon', 'lotus'], figure: 'lady', weapon: 'none' },
    },
    {
      id: 'xiaoqiao', name: '小乔', zi: '无', faction: 'wu', type: 'lady', title: '江东二乔',
      battle: 'jiangdong',
      art: { kind: 'scene', scene: 'moon', props: ['ships', 'qin', 'lanterns', 'ribbon'], figure: 'lady', weapon: 'none', flip: true },
    },
    {
      id: 'sunshangxiang', name: '孙尚香', zi: '无', faction: 'wu', type: 'lady', title: '孙夫人',
      battle: null,
      art: { kind: 'scene', scene: 'river', props: ['boat', 'bow', 'spears', 'ribbon'], figure: 'lady', weapon: 'bow' },
    },
    {
      id: 'dingfeng', name: '丁奉', zi: '承渊', faction: 'wu', type: 'warrior', title: '安丰侯',
      battle: 'dongxing',
      art: { kind: 'scene', scene: 'snow', props: ['spears', 'banners', 'city'], figure: 'warrior', weapon: 'sword', flip: true },
    },

    /* ================= 群 ================= */
    {
      id: 'lvbu', name: '吕布', zi: '奉先', faction: 'qun', type: 'warrior', title: '温侯',
      battle: 'taodong',
      art: { kind: 'plate', src: 'hulao.webp', pos: '56% 42%', source: PLATE_SOURCE },
    },
    {
      id: 'diaochan', name: '貂蝉', zi: '无', faction: 'qun', type: 'lady', title: '四大美人',
      battle: 'dongzhuo',
      art: { kind: 'plate', src: 'lvbu-diaochan.webp', pos: '50% 42%', color: true, source: CORRIDOR_SOURCE },
    },
    {
      id: 'dongzhuo', name: '董卓', zi: '仲颖', faction: 'qun', type: 'ruler', title: '太师',
      battle: 'dongzhuo',
      art: { kind: 'plate', src: 'court-dong.webp', pos: '38% 56%', source: PLATE_SOURCE },
    },
    {
      id: 'yuanshao', name: '袁绍', zi: '本初', faction: 'qun', type: 'ruler', title: '大将军',
      battle: 'guandu',
      art: { kind: 'scene', scene: 'camp', props: ['carts', 'banners', 'fire', 'smoke'], figure: 'ruler', weapon: 'sword' },
    },
    {
      id: 'yuanshu', name: '袁术', zi: '公路', faction: 'qun', type: 'ruler', title: '仲氏皇帝',
      battle: null,
      art: { kind: 'scene', scene: 'court', props: ['throne', 'seal', 'wine', 'banners'], figure: 'ruler', weapon: 'none', flip: true },
    },
    {
      id: 'gongsunzan', name: '公孙瓒', zi: '伯珪', faction: 'qun', type: 'warrior', title: '易侯',
      battle: 'jieqiao',
      art: { kind: 'scene', scene: 'snow', props: ['horse', 'spears', 'banners', 'tower'], figure: 'warrior', weapon: 'spear' },
    },
    {
      id: 'liubiao', name: '刘表', zi: '景升', faction: 'qun', type: 'ruler', title: '荆州牧',
      battle: null,
      art: { kind: 'scene', scene: 'city', props: ['river', 'boats', 'banners', 'scrolls'], figure: 'ruler', weapon: 'none' },
    },
    {
      id: 'zhangjiao', name: '张角', zi: '无', faction: 'qun', type: 'rebel', title: '大贤良师',
      battle: 'yellow-turban',
      art: { kind: 'scene', scene: 'yellow', props: ['banners', 'spears', 'fire', 'figures'], figure: 'rebel', weapon: 'staff' },
    },
    {
      id: 'huatuo', name: '华佗', zi: '元化', faction: 'qun', type: 'healer', title: '神医',
      battle: 'fancheng',
      art: { kind: 'scene', scene: 'medicine', props: ['knife', 'gourd', 'scrolls', 'lantern'], figure: 'healer', weapon: 'staff' },
    },
    {
      id: 'caiwenji', name: '蔡琰', zi: '文姬', faction: 'qun', type: 'lady', title: '陈留才女',
      battle: null,
      art: { kind: 'scene', scene: 'snow', props: ['qin', 'tents', 'banners', 'cranes'], figure: 'lady', weapon: 'none' },
    },
    {
      id: 'chengong', name: '陈宫', zi: '公台', faction: 'qun', type: 'strategist', title: '陈宫',
      battle: 'xiapi',
      art: { kind: 'scene', scene: 'city', props: ['horse', 'lanterns', 'swords', 'rain'], figure: 'strategist', weapon: 'sword', flip: true },
    },
    {
      id: 'wangyun', name: '王允', zi: '子师', faction: 'qun', type: 'strategist', title: '司徒',
      battle: 'dongzhuo',
      art: { kind: 'plate', src: 'wangyun-court.webp', pos: '58% 40%', source: PLATE_SOURCE },
    },
    {
      id: 'menghuo', name: '孟获', zi: '无', faction: 'qun', type: 'rebel', title: '南蛮王',
      battle: 'nanzhong',
      art: { kind: 'scene', scene: 'jungle', props: ['elephant', 'drums', 'spears', 'fire'], figure: 'rebel', weapon: 'spear' },
    },
    {
      id: 'hanxiandi', name: '刘协', zi: '伯和', faction: 'qun', type: 'ruler', title: '汉献帝',
      battle: 'dongzhuo',
      art: { kind: 'plate', src: 'emperor-xian.webp', pos: '48% 30%', source: PLATE_SOURCE },
    },
    {
      id: 'zhurong', name: '祝融夫人', zi: '无', faction: 'qun', type: 'lady', title: '南蛮女将',
      battle: 'nanzhong',
      art: { kind: 'scene', scene: 'jungle', props: ['spears', 'drums', 'fire', 'ribbon'], figure: 'lady', weapon: 'spear', flip: true },
    },
  ];

  /* Full-page woodblock plates from the Qing 大魁堂 edition of the
     Romance (WDL11391, public domain). Each entry points at the printed
     chapter illustration of that character's event. */
  const PLATE_OVERRIDES = {
    caopi: { src: 'caopi-plate.webp', pos: '50% 42%' },
    simayi: { src: 'simayi-plate.webp', pos: '50% 44%' },
    guojia: { src: 'guojia-plate.webp', pos: '50% 44%' },
    xunyu: { src: 'xunyu-plate.webp', pos: '50% 46%' },
    jiaxu: { src: 'jiaxu-plate.webp', pos: '50% 46%' },
    xiahoudun: { src: 'xiahoudun-plate.webp', pos: '50% 46%' },
    zhangliao: { src: 'zhangliao-plate.webp', pos: '50% 46%' },
    xuhuang: { src: 'xuhuang-plate.webp', pos: '50% 46%' },
    zhanghe: { src: 'zhanghe-plate.webp', pos: '50% 46%' },
    xuchu: { src: 'xuchu-plate.webp', pos: '50% 46%' },
    dianwei: { src: 'dianwei-plate.webp', pos: '50% 46%' },
    zhenji: { src: 'zhenji-plate.webp', pos: '50% 44%' },
    caoren: { src: 'caoren-plate.webp', pos: '50% 46%' },
    zhaoyun: { src: 'zhaoyun-plate.webp', pos: '50% 46%' },
    zhugeliang: { src: 'zhugeliang-plate.webp', pos: '50% 44%' },
    huangzhong: { src: 'huangzhong-plate.webp', pos: '74% 48%' },
    weiyan: { src: 'weiyan-plate.webp', pos: '50% 42%' },
    jiangwei: { src: 'jiangwei-plate.webp', pos: '50% 44%' },
    pangtong: { src: 'pangtong-plate.webp', pos: '50% 46%' },
    fazheng: { src: 'fazheng-plate.webp', pos: '20% 44%' },
    xushu: { src: 'xushu-plate.webp', pos: '50% 46%' },
    liushan: { src: 'liushan-plate.webp', pos: '50% 46%' },
    sunjian: { src: 'sunjian-plate.webp', pos: '50% 46%' },
    sunce: { src: 'sunce-plate.webp', pos: '50% 46%' },
    sunquan: { src: 'sunquan-plate.webp', pos: '50% 46%' },
    zhouyu: { src: 'zhouyu-plate.webp', pos: '50% 46%' },
    lusu: { src: 'lusu-plate.webp', pos: '50% 46%' },
    lvmeng: { src: 'lvmeng-plate.webp', pos: '50% 46%' },
    luxun: { src: 'luxun-plate.webp', pos: '50% 46%' },
    ganning: { src: 'ganning-plate.webp', pos: '50% 46%' },
    taishici: { src: 'taishici-plate.webp', pos: '50% 46%' },
    huanggai: { src: 'huanggai-plate.webp', pos: '50% 46%' },
    sunshangxiang: { src: 'sunshangxiang-plate.webp', pos: '50% 44%' },
    dingfeng: { src: 'dingfeng-plate.webp', pos: '50% 46%' },
    yuanshao: { src: 'yuanshao-plate.webp', pos: '50% 46%' },
    yuanshu: { src: 'yuanshu-plate.webp', pos: '50% 46%' },
    gongsunzan: { src: 'gongsunzan-plate.webp', pos: '50% 46%' },
    zhangjiao: { src: 'zhangjiao-plate.webp', pos: '50% 46%' },
    huatuo: { src: 'huatuo-plate.webp', pos: '50% 46%' },
    chengong: { src: 'chengong-plate.webp', pos: '50% 46%' },
    wangyun: { src: 'wangyun-plate.webp', pos: '50% 44%' },
    menghuo: { src: 'menghuo-plate.webp', pos: '50% 46%' },
    hanxiandi: { src: 'hanxiandi-plate.webp', pos: '50% 46%' },

    /* The six characters without a panel in WDL11391. Sources are listed
       in assets/codex/SOURCE.md; all are public domain. */
    huangyueying: { src: 'huangyueying-plate.webp', pos: '50% 50%' },
    daqiao: { src: 'daqiao-plate.webp', pos: '50% 46%', source: BAIMEI_SOURCE },
    xiaoqiao: { src: 'xiaoqiao-plate.webp', pos: '50% 46%', source: BAIMEI_SOURCE },
    liubiao: { src: 'liubiao-plate.webp', cardSrc: 'liubiao-card.webp', pos: '50% 44%', source: PORTRAIT_SOURCE },
    caiwenji: { src: 'caiwenji-plate.webp', pos: '50% 44%', source: BAIMEI_SOURCE },
    zhurong: { src: 'zhurong-plate.webp', pos: '50% 42%', color: true, source: UKIYOE_SOURCE },
  };

  for (const c of CHARACTERS) {
    const plate = PLATE_OVERRIDES[c.id];
    if (plate) c.art = { kind: 'plate', fit: 'print', source: PLATE_SOURCE, ...plate };
  }

  /* 游戏面板：属性、称号与战法见 codex-roster.js。
     17 名演武场武将取 data/ 原值，其余按同一数值区间补齐。 */
  const ROSTER = window.CODEX_ROSTER || {};
  const SKILLS = window.CODEX_SKILLS || {};
  for (const c of CHARACTERS) {
    if (ROSTER[c.id]) Object.assign(c, ROSTER[c.id]);
  }

  const TARGET_NAME = {
    enemy: '单体敌人',
    lowestEnemy: '生命最低的敌人',
    strongestEnemy: '攻击最高的敌人',
    allEnemies: '全体敌人',
    self: '自身',
    lowestAlly: '生命最低的友军',
    allAllies: '全体友军',
  };

  const STAT_ROWS = [
    { key: 'hp', label: '生命', max: 132 },
    { key: 'atk', label: '攻击', max: 34 },
    { key: 'def', label: '防御', max: 25 },
    { key: 'int', label: '智力', max: 35 },
    { key: 'spd', label: '速度', max: 19 },
  ];

  function skillOf(id) {
    return SKILLS[id] || { name: id, cd: 0, target: 'enemy', desc: '战法资料待补。' };
  }

  const BATTLES = [
    {
      id: 'yellow-turban', name: '黄巾之乱', year: '184', era: '中平元年', place: '冀州、颍川、南阳',
      sides: ['黄巾军', '东汉官军'], commanders: ['张角', '皇甫嵩', '朱儁', '曹操', '刘备'],
      result: '黄巾主力覆灭，东汉根基动摇', record: '史实', scene: 'yellow', accent: 'qun',
      props: ['banners', 'spears', 'fire', 'figures'],
      summary: '张角以太平道聚众数十万，八州并起。东汉急调皇甫嵩、朱儁、曹操等分路镇压，张角病逝，黄巾主力年内溃散，但汉室自此失控。',
      characters: ['zhangjiao', 'liubei', 'guanyu', 'zhangfei', 'caocao'],
    },
    {
      id: 'dongzhuo', name: '董卓入京', year: '189', era: '中平六年', place: '洛阳',
      sides: ['董卓军', '东汉朝廷'], commanders: ['董卓', '何进', '袁绍', '丁原', '吕布'],
      result: '董卓专权，废少帝立献帝', record: '史实', scene: 'court', accent: 'qun',
      props: ['throne', 'spears', 'seal', 'banners'],
      summary: '何进召外兵入京诛宦官，反被十常侍所杀。袁绍等诛宦官，董卓率凉州军入洛，吞并丁原部众，废少帝、立献帝，独揽朝政。',
      characters: ['dongzhuo', 'lvbu', 'wangyun', 'diaochan', 'hanxiandi', 'yuanshao', 'caocao'],
    },
    {
      id: 'taodong', name: '讨董之战 · 虎牢关', year: '190', era: '初平元年', place: '洛阳、虎牢关、阳人',
      sides: ['关东联军', '董卓军'], commanders: ['袁绍', '孙坚', '曹操', '刘备', '吕布'],
      result: '董卓迁都长安，联军瓦解', record: '史实', scene: 'city', accent: 'qun',
      props: ['horse', 'spears', 'banners', 'fire'],
      summary: '关东诸侯以袁绍为盟主起兵讨董。孙坚在阳人破董军、斩华雄；吕布守虎牢，联军久攻不下。董卓焚洛阳、迁都长安，联军随即因内讧散去。',
      characters: ['sunjian', 'guanyu', 'zhangfei', 'liubei', 'lvbu', 'caocao', 'yuanshao'],
      recordNote: '“三英战吕布”为演义情节；孙坚斩华雄见史。',
    },
    {
      id: 'jieqiao', name: '界桥之战', year: '191', era: '初平二年', place: '界桥',
      sides: ['袁绍军', '公孙瓒军'], commanders: ['袁绍', '麴义', '公孙瓒'],
      result: '袁绍胜，白马义从受挫', record: '史实', scene: 'snow', accent: 'qun',
      props: ['horse', 'spears', 'banners', 'arrows'],
      summary: '公孙瓒率白马义从南下争冀州，袁绍将麴义以八百盾兵伏于阵前，强弩齐发，义从人马俱惊。公孙瓒大败，河北之势渐归袁绍。',
      characters: ['gongsunzan', 'yuanshao'],
    },
    {
      id: 'changan', name: '长安之乱', year: '192', era: '初平三年', place: '长安',
      sides: ['李傕郭汜军', '长安守军'], commanders: ['李傕', '郭汜', '贾诩', '王允', '吕布'],
      result: '王允死，献帝落入凉州军阀之手', record: '史实', scene: 'city', accent: 'qun',
      props: ['spears', 'fire', 'banners', 'smoke'],
      summary: '董卓被吕布所杀后，李傕、郭汜本欲散归凉州。贾诩劝其收兵西攻长安，城破，王允死节，吕布东逃，天下再入军阀混战。',
      characters: ['jiaxu', 'wangyun', 'hanxiandi', 'lvbu'],
    },
    {
      id: 'jiangdong', name: '平定江东', year: '195', era: '兴平二年', place: '曲阿、会稽',
      sides: ['孙策军', '江东诸郡'], commanders: ['孙策', '周瑜', '刘繇', '王朗'],
      result: '孙策尽有江东六郡', record: '史实', scene: 'river', accent: 'wu',
      props: ['horse', 'spears', 'boats', 'banners'],
      summary: '孙策以父旧部千余人渡江，得周瑜相助，连破刘繇、王朗、严白虎，数年间据有江东六郡，为东吴奠基。',
      characters: ['sunce', 'zhouyu', 'daqiao', 'taishici'],
    },
    {
      id: 'wan', name: '宛城之战', year: '197', era: '建安二年', place: '宛城',
      sides: ['曹操军', '张绣军'], commanders: ['曹操', '典韦', '张绣', '贾诩'],
      result: '曹操败走，典韦、曹昂战死', record: '史实', scene: 'fire', accent: 'wei',
      props: ['city', 'spears', 'halberd', 'smoke'],
      summary: '曹操纳张绣婶母，张绣用贾诩之计夜袭曹营。典韦守门死战，曹操侥幸逃脱，长子曹昂、侄子曹安民与典韦皆殁。',
      characters: ['dianwei', 'caocao', 'jiaxu'],
    },
    {
      id: 'xiapi', name: '下邳之战', year: '198', era: '建安三年', place: '下邳',
      sides: ['曹操刘备联军', '吕布军'], commanders: ['曹操', '刘备', '吕布', '陈宫'],
      result: '吕布败亡，白门楼缢杀', record: '史实', scene: 'city', accent: 'qun',
      props: ['river', 'spears', 'banners', 'rain'],
      summary: '曹操围下邳，引沂、泗水灌城。吕布部将叛降，城破被擒。吕布求降不成，缢杀于白门楼；陈宫不屈，从容就戮。',
      characters: ['lvbu', 'chengong', 'caocao', 'liubei', 'guanyu', 'zhangfei'],
    },
    {
      id: 'guandu', name: '官渡之战', year: '200', era: '建安五年', place: '官渡',
      sides: ['曹操军', '袁绍军'], commanders: ['曹操', '袁绍', '郭嘉', '荀彧', '张郃'],
      result: '曹操胜，奠定统一北方基础', record: '史实', scene: 'camp', accent: 'wei',
      props: ['carts', 'banners', 'fire', 'spears'],
      summary: '袁绍拥兵十万南下，曹操以劣势兵力相持。许攸叛投，献烧乌巢粮仓之计；张郃临阵降曹。袁军崩溃，袁绍仅率八百骑北逃。',
      characters: ['caocao', 'yuanshao', 'guojia', 'xunyu', 'zhanghe'],
    },
    {
      id: 'changban', name: '长坂坡之战', year: '208', era: '建安十三年', place: '当阳长坂',
      sides: ['曹操军', '刘备军'], commanders: ['曹操', '刘备', '赵云', '张飞'],
      result: '刘备败走，退往江夏', record: '史实', scene: 'horse', accent: 'shu',
      props: ['spears', 'baby', 'banners', 'dust'],
      summary: '曹操轻骑追击刘备于当阳长坂。刘备弃辎重南走，赵云保护甘夫人与阿斗脱险，张飞据水断桥拒敌。刘备退往江夏，与孙权结盟。',
      characters: ['zhaoyun', 'zhangfei', 'liubei', 'caocao'],
      recordNote: '赵云救阿斗、张飞断桥见史；“七进七出”“喝退曹军”为演义渲染。',
    },
    {
      id: 'chibi', name: '赤壁之战', year: '208', era: '建安十三年', place: '赤壁、乌林',
      sides: ['孙刘联军', '曹操军'], commanders: ['周瑜', '孙权', '刘备', '曹操', '黄盖'],
      result: '曹操大败，三分格局初成', record: '史实', scene: 'fire', accent: 'wu',
      props: ['ships', 'river', 'banners', 'smoke'],
      summary: '曹操率二十余万大军南下，孙刘联军五万拒于赤壁。黄盖诈降，火船乘风焚曹军连环舰阵，周瑜主力继进。曹操退保南郡，天下三分之势成形。',
      characters: ['zhouyu', 'huanggai', 'sunquan', 'zhugeliang', 'caocao', 'lusu', 'xiaoqiao'],
    },
    {
      id: 'tongguan', name: '潼关之战', year: '211', era: '建安十六年', place: '潼关、渭南',
      sides: ['曹操军', '马超韩遂联军'], commanders: ['曹操', '许褚', '马超', '韩遂'],
      result: '曹操胜，关中平定', record: '史实', scene: 'horse', accent: 'wei',
      props: ['spears', 'dust', 'banners', 'arrows'],
      summary: '马超、韩遂起兵关中，曹操亲征。曹军渡渭、筑城，以离间计使马韩相疑，一举破之。马超退走凉州，关中入曹。',
      characters: ['xuchu', 'machao', 'caocao'],
    },
    {
      id: 'ruxu', name: '濡须口之战', year: '213', era: '建安十八年', place: '濡须口',
      sides: ['曹操军', '孙权军'], commanders: ['曹操', '孙权', '甘宁'],
      result: '相持月余，曹操退军', record: '史实', scene: 'river', accent: 'wu',
      props: ['ships', 'spears', 'banners', 'lanterns'],
      summary: '曹操攻濡须，孙权据江拒守。甘宁率百余骑夜袭曹营，斩获而还。两军相持月余，曹操见江东水军严整，叹“生子当如孙仲谋”，引军北还。',
      characters: ['ganning', 'sunquan', 'caocao'],
    },
    {
      id: 'jiameng', name: '葭萌关之战', year: '214', era: '建安十九年', place: '葭萌关',
      sides: ['刘备军', '马超军'], commanders: ['刘备', '张飞', '马超'],
      result: '马超归降刘备', record: '演义', scene: 'mountain', accent: 'shu',
      props: ['horse', 'spears', 'banners', 'dust'],
      summary: '马超奉张鲁之命攻葭萌关，与张飞昼夜鏖战。刘备爱其才，遣李恢说降。马超遂归刘备，成都震动，刘璋不久出降。',
      characters: ['zhangfei', 'machao', 'liubei'],
      recordNote: '马超攻葭萌见史；“夜战张飞”“挑灯再战”为演义情节。',
    },
    {
      id: 'luofeng', name: '落凤坡之战', year: '214', era: '建安十九年', place: '雒城落凤坡',
      sides: ['刘备军', '刘璋军'], commanders: ['庞统', '刘备', '张任'],
      result: '庞统中伏身亡', record: '演义', scene: 'mountain', accent: 'shu',
      props: ['arrows', 'horse', 'banners', 'rain'],
      summary: '刘备围雒城，庞统率军走小路，至落凤坡遭张任伏击。乱箭之下，庞统身亡，年仅三十六。刘备痛失谋主，急调诸葛亮入蜀。',
      characters: ['pangtong', 'liubei'],
      recordNote: '庞统死于雒城攻城战见史；“落凤坡”与“凤雏殒命”细节为演义。',
    },
    {
      id: 'hefei', name: '合肥之战 · 逍遥津', year: '215', era: '建安二十年', place: '合肥、逍遥津',
      sides: ['曹魏军', '孙吴军'], commanders: ['张辽', '李典', '乐进', '孙权'],
      result: '张辽以少胜多，威震江东', record: '史实', scene: 'river', accent: 'wei',
      props: ['city', 'horse', 'spears', 'banners'],
      summary: '孙权率十万大军围合肥。张辽募八百死士夜袭吴营，直逼孙权麾盖；吴军退至逍遥津，张辽又率军追击，孙权几乎被擒。',
      characters: ['zhangliao', 'sunquan', 'lvmeng'],
    },
    {
      id: 'dingjun', name: '定军山之战', year: '219', era: '建安二十四年', place: '定军山',
      sides: ['刘备军', '曹魏军'], commanders: ['刘备', '黄忠', '法正', '夏侯渊'],
      result: '黄忠斩夏侯渊，刘备取汉中', record: '史实', scene: 'mountain', accent: 'shu',
      props: ['banners', 'spears', 'horse', 'dust'],
      summary: '刘备南渡沔水、依山扎营，法正诱夏侯渊分兵。黄忠乘高鼓噪而下，一战斩渊。曹军失帅大败，刘备遂取汉中，进位汉中王。',
      characters: ['huangzhong', 'fazheng', 'liubei'],
    },
    {
      id: 'fancheng', name: '樊城之战 · 水淹七军', year: '219', era: '建安二十四年', place: '樊城、襄阳',
      sides: ['关羽军', '曹魏军'], commanders: ['关羽', '曹仁', '于禁', '庞德', '徐晃'],
      result: '关羽威震华夏，后为吴所袭', record: '史实', scene: 'city', accent: 'shu',
      props: ['river', 'rain', 'spears', 'banners'],
      summary: '关羽围樊城，汉水暴涨，水淹于禁七军，擒于禁、斩庞德，威震华夏。曹仁死守孤城，徐晃率援军解围。孙权遣吕蒙袭取荆州，关羽败走。',
      characters: ['guanyu', 'xuhuang', 'caoren', 'huatuo', 'caocao'],
    },
    {
      id: 'baijiang', name: '白衣渡江', year: '219', era: '建安二十四年', place: '公安、江陵',
      sides: ['孙吴军', '关羽军'], commanders: ['吕蒙', '陆逊', '孙权', '关羽'],
      result: '荆州失守，关羽败亡', record: '史实', scene: 'river', accent: 'wu',
      props: ['boats', 'spears', 'snow', 'banners'],
      summary: '吕蒙称病，以陆逊代己，使关羽放松后防。吴军白衣摇橹，伪装商船，袭取公安、江陵，安抚关羽将士家属。关羽后方瓦解，败走麦城。',
      characters: ['lvmeng', 'luxun', 'sunquan', 'guanyu'],
    },
    {
      id: 'yiling', name: '夷陵之战', year: '221', era: '章武元年至二年', place: '夷陵、猇亭',
      sides: ['蜀汉军', '孙吴军'], commanders: ['刘备', '陆逊', '孙权'],
      result: '陆逊火攻，蜀军大败', record: '史实', scene: 'fire', accent: 'wu',
      props: ['jungle', 'tents', 'spears', 'smoke'],
      summary: '刘备为关羽复仇，亲率大军伐吴，连营数百里。陆逊坚守七八月，待蜀军疲敝，以火攻破四十余营。刘备退守白帝城，次年病逝。',
      characters: ['luxun', 'liubei', 'sunquan'],
    },
    {
      id: 'nanzhong', name: '南征南中', year: '225', era: '建兴三年', place: '越嶲、益州、牂牁',
      sides: ['蜀汉军', '南中诸部'], commanders: ['诸葛亮', '孟获', '祝融夫人'],
      result: '南中平定，蜀汉后方稳定', record: '史实', scene: 'jungle', accent: 'shu',
      props: ['elephant', 'drums', 'spears', 'fire'],
      summary: '雍闿、孟获等南中豪族反蜀。诸葛亮率军南征，五月渡泸，采取“攻心为上”之策。传说七擒七纵孟获，南中遂定，终诸葛亮之世不复反。',
      characters: ['zhugeliang', 'menghuo', 'zhurong'],
      recordNote: '南征见史；“七擒七纵”细节出自《三国演义》与地方传说。',
    },
    {
      id: 'jieting', name: '街亭之战', year: '228', era: '建兴六年', place: '街亭',
      sides: ['蜀汉军', '曹魏军'], commanders: ['诸葛亮', '马谡', '张郃', '魏延'],
      result: '蜀军大败，首次北伐失利', record: '史实', scene: 'mountain', accent: 'wei',
      props: ['spears', 'tents', 'banners', 'rain'],
      summary: '诸葛亮首次北伐，命马谡守街亭。马谡舍水上山，张郃断其汲道、纵兵围山，蜀军溃散。诸葛亮拔西县千余家还汉中，挥泪斩马谡。',
      characters: ['zhanghe', 'zhugeliang', 'weiyan'],
    },
    {
      id: 'wuzhangyuan', name: '五丈原之战', year: '234', era: '建兴十二年', place: '五丈原',
      sides: ['蜀汉军', '曹魏军'], commanders: ['诸葛亮', '司马懿', '姜维'],
      result: '相持百日，诸葛亮病逝', record: '史实', scene: 'mountain', accent: 'shu',
      props: ['tents', 'spears', 'banners', 'lanterns'],
      summary: '诸葛亮最后一次北伐，出斜谷屯五丈原，与司马懿隔渭水相持。诸葛亮屡次挑战，司马懿坚守不出。八月，诸葛亮病逝军中，蜀军退走。',
      characters: ['zhugeliang', 'simayi', 'jiangwei'],
    },
    {
      id: 'gaopingling', name: '高平陵之变', year: '249', era: '嘉平元年', place: '洛阳、高平陵',
      sides: ['司马懿集团', '曹爽集团'], commanders: ['司马懿', '曹爽', '司马师'],
      result: '司马氏专权，魏室名存实亡', record: '史实', scene: 'court', accent: 'wei',
      props: ['city', 'spears', 'seal', 'lanterns'],
      summary: '曹爽奉少帝出城祭高平陵，司马懿趁机闭洛阳城门、据武库，以太后诏罢爽兵权。曹爽犹豫归罪，终被夷族，魏政尽归司马氏。',
      characters: ['simayi'],
    },
    {
      id: 'dongxing', name: '东兴之战', year: '252', era: '建兴二年', place: '东兴堤',
      sides: ['孙吴军', '曹魏军'], commanders: ['丁奉', '诸葛恪', '胡遵', '诸葛诞'],
      result: '吴军大胜，丁奉成名', record: '史实', scene: 'snow', accent: 'wu',
      props: ['spears', 'banners', 'city', 'dust'],
      summary: '魏军攻东兴，吴将诸葛恪率军拒之。天大雪，魏军饮酒取暖。丁奉率三千人脱甲持短兵缘堤而上，突入魏营，魏军大溃。',
      characters: ['dingfeng'],
    },
    {
      id: 'mieshu', name: '魏灭蜀之战', year: '263', era: '景耀六年', place: '剑阁、阴平、成都',
      sides: ['曹魏军', '蜀汉军'], commanders: ['钟会', '邓艾', '姜维', '刘禅'],
      result: '蜀汉灭亡', record: '史实', scene: 'mountain', accent: 'wei',
      props: ['city', 'spears', 'banners', 'rain'],
      summary: '魏军三路伐蜀，钟会攻剑阁，姜维死守。邓艾从阴平偷渡，破江油、绵竹，直取成都。刘禅出降，蜀汉亡；姜维诈降钟会，事败被杀。',
      characters: ['jiangwei', 'liushan'],
    },
  ];

  const FEMALE_IDS = ['zhenji', 'huangyueying', 'daqiao', 'xiaoqiao', 'sunshangxiang', 'diaochan', 'caiwenji', 'zhurong'];

  const ACHIEVEMENTS = [
    { id: 'first', name: '初入洛阳', seal: '洛', desc: '查看 3 位人物，推开图鉴的第一页。', progress: () => [progress.viewed.length, 3] },
    { id: 'twelve', name: '群雄并起', seal: '雄', desc: '查看 12 位人物，乱世轮廓初现。', progress: () => [progress.viewed.length, 12] },
    { id: 'balance', name: '三分天下', seal: '鼎', desc: '魏、蜀、吴、群四势力各查看 5 位人物。', progress: () => [Math.min(...Object.keys(FACTION).map((f) => countFaction(f))), 5] },
    { id: 'wei', name: '魏武遗风', seal: '魏', desc: '看尽曹魏 14 位人物。', progress: () => [countFaction('wei'), 14] },
    { id: 'shu', name: '汉室正统', seal: '蜀', desc: '看尽蜀汉 14 位人物。', progress: () => [countFaction('shu'), 14] },
    { id: 'wu', name: '江东基业', seal: '吴', desc: '看尽东吴 14 位人物。', progress: () => [countFaction('wu'), 14] },
    { id: 'qun', name: '乱世群像', seal: '群', desc: '看尽群雄 15 位人物。', progress: () => [countFaction('qun'), 15] },
    { id: 'all', name: '将星满卷', seal: '星', desc: '看尽全部 57 位人物。', progress: () => [progress.viewed.length, CHARACTERS.length] },
    { id: 'win1', name: '首战告捷', seal: '捷', desc: '在演武场赢得第一场胜利。', progress: () => [progress.wins, 1] },
    { id: 'win5', name: '五战之将', seal: '战', desc: '累计赢得 5 场演武。', progress: () => [progress.wins, 5] },
    { id: 'win10', name: '十战成名', seal: '名', desc: '累计赢得 10 场演武。', progress: () => [progress.wins, 10] },
    { id: 'rankS', name: '完胜', seal: '胜', desc: '以三人存活赢得一场演武，取得 S 评价。', progress: () => [progress.perfectWins, 1] },
    { id: 'fast', name: '速战速决', seal: '速', desc: '在 5 回合内赢得一场演武。', progress: () => [progress.fastWins, 1] },
    { id: 'taoyuan', name: '桃园之义', seal: '义', desc: '查看刘备、关羽、张飞三人。', progress: () => [countIds(['liubei', 'guanyu', 'zhangfei']), 3] },
    { id: 'jiangdong', name: '江东双璧', seal: '璧', desc: '查看孙策与周瑜。', progress: () => [countIds(['sunce', 'zhouyu']), 2] },
    { id: 'longfeng', name: '卧龙凤雏', seal: '龙', desc: '查看诸葛亮与庞统。', progress: () => [countIds(['zhugeliang', 'pangtong']), 2] },
    { id: 'que', name: '铜雀春深', seal: '雀', desc: '查看曹操、曹丕、甄宓。', progress: () => [countIds(['caocao', 'caopi', 'zhenji']), 3] },
    { id: 'women', name: '乱世红颜', seal: '红', desc: '查看全部 8 位女性人物。', progress: () => [countIds(FEMALE_IDS), FEMALE_IDS.length] },
    { id: 'history', name: '以史为鉴', seal: '史', desc: '阅读 13 场战役。', progress: () => [progress.battlesRead.length, 13] },
    { id: 'allbattles', name: '通览三国', seal: '鉴', desc: '阅读全部 26 场战役。', progress: () => [progress.battlesRead.length, BATTLES.length] },
  ];

  const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
  const BATTLE_BY_ID = Object.fromEntries(BATTLES.map((b) => [b.id, b]));
  const BATTLE_ORDER = BATTLES.map((b) => b.id);
  const CHAR_ORDER = CHARACTERS.map((c) => c.id);
  const RANK_VALUE = { C: 0, B: 1, A: 2, S: 3 };
  const KEY = 'jiangxing.codex.v1';

  function defaults() {
    return {
      viewed: [],
      battlesRead: [],
      unlocked: {},
      wins: 0,
      played: 0,
      perfectWins: 0,
      fastWins: 0,
      bestRank: 'C',
      lastSeen: 0,
    };
  }

  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw || typeof raw !== 'object') return defaults();
      const next = { ...defaults(), ...raw };
      next.viewed = Array.isArray(next.viewed) ? next.viewed.filter((id) => CHAR_BY_ID[id]) : [];
      next.battlesRead = Array.isArray(next.battlesRead) ? next.battlesRead.filter((id) => BATTLE_BY_ID[id]) : [];
      next.unlocked = next.unlocked && typeof next.unlocked === 'object' ? next.unlocked : {};
      return next;
    } catch {
      return defaults();
    }
  }

  let progress = loadProgress();
  let saveTimer = 0;

  function saveProgress() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(progress));
      } catch {
        /* 存档不可用时，图鉴仍可浏览 */
      }
    }, 120);
  }

  const ui = {
    tab: 'chars',
    faction: 'all',
    query: '',
    detailType: null,
    detailId: null,
  };

  const els = {};

  function cacheEls() {
    els.screen = $('#screen-codex');
    els.tabs = $$('[data-cx-tab]');
    els.panels = $$('[data-cx-panel]');
    els.filters = $('#cx-filters');
    els.search = $('#cx-search');
    els.clear = $('#cx-search-clear');
    els.charGroups = $('#cx-char-groups');
    els.charEmpty = $('#cx-char-empty');
    els.battleList = $('#cx-battle-list');
    els.battleEmpty = $('#cx-battle-empty');
    els.achGrid = $('#cx-ach-grid');
    els.achCount = $('#cx-ach-count');
    els.seen = $('#cx-seen');
    els.total = $('#cx-total');
    els.bar = $('#cx-progress-bar');
    els.live = $('#cx-live');
    els.detail = $('#cx-detail');
    els.detailBody = $('#cx-detail-body');
    els.detailLive = $('#cx-detail-live');
  }

  /* ---------------- 工具 ---------------- */

  function esc(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  function mark(text, query) {
    const safe = esc(text);
    const q = query.trim();
    if (!q) return safe;
    const needle = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return safe.replace(new RegExp(needle, 'gi'), (hit) => `<mark>${hit}</mark>`);
    } catch {
      return safe;
    }
  }

  function countFaction(faction) {
    return CHARACTERS.filter((c) => c.faction === faction && progress.viewed.includes(c.id)).length;
  }

  function countIds(ids) {
    return ids.filter((id) => progress.viewed.includes(id)).length;
  }

  function totalOfFaction(faction) {
    return CHARACTERS.filter((c) => c.faction === faction).length;
  }

  function hasZi(c) {
    return Boolean(c.zi) && !['无', '不详', '未知'].includes(c.zi);
  }

  function charArt(c, context) {
    const art = c.art;
    if (art.kind === 'plate') {
      const color = art.color ? ' is-color' : '';
      const print = art.fit === 'print' ? ' is-print' : '';
      const src = context === 'card' && art.cardSrc ? art.cardSrc : art.src;
      return `<span class="cx-art cx-art--plate${color}${print}">
        <img src="assets/codex/${esc(src)}" alt="" loading="${context === 'card' ? 'lazy' : 'eager'}" decoding="async" style="object-position:${esc(art.pos || '50% 50%')}">
        <span class="cx-art-tone" aria-hidden="true"></span>
      </span>`;
    }
    const scene = window.CodexArt
      ? window.CodexArt.sceneSVG(art.scene, c.faction, c.id, art.props || [])
      : '';
    const figure = window.CodexArt
      ? window.CodexArt.figureSVG(art.figure || 'warrior', art.weapon || 'spear', c.faction, { flip: Boolean(art.flip) })
      : '';
    return `<span class="cx-art cx-art--scene">
      ${scene}
      <span class="cx-figure-wrap" aria-hidden="true">${figure}</span>
      <span class="cx-art-tone" aria-hidden="true"></span>
    </span>`;
  }

  function recordClass(record) {
    return record === '演义' ? 'is-fic' : record === '传说' ? 'is-legend' : 'is-hist';
  }

  /* ---------------- 人物卡片 ---------------- */

  function skillList(c) {
    return c.skills.map(skillOf);
  }

  function skillHTML(s) {
    return `<li>
      <div class="cx-skill-head"><b>${esc(s.name)}</b><span>冷却 ${s.cd} 回合 · ${esc(TARGET_NAME[s.target] || '单体敌人')}</span></div>
      <p>${esc(s.desc)}</p>
    </li>`;
  }

  function charCard(c, query) {
    const seen = progress.viewed.includes(c.id);
    const f = FACTION[c.faction];
    const skills = skillList(c).map((s) => s.name).join('、');
    const label = `${c.name}${hasZi(c) ? `，字${c.zi}` : ''}，${f.full}${TYPE[c.type]}，${c.role}，生命${c.hp}，攻击${c.atk}，战法${skills}${seen ? '，已阅' : ''}`;
    return `<button type="button" class="cx-card${seen ? ' is-seen' : ''}" data-cx-char="${c.id}" style="--accent:${f.accent};--accent-2:${f.pale}" aria-label="${esc(label)}">
      <span class="cx-card-frame">
        <span class="cx-card-art">${charArt(c, 'card')}</span>
        <span class="cx-card-scrim" aria-hidden="true"></span>
        <span class="cx-card-no" aria-hidden="true">${String(CHAR_ORDER.indexOf(c.id) + 1).padStart(2, '0')}</span>
        <span class="cx-card-faction" aria-hidden="true">${f.name}</span>
        <span class="cx-card-record" aria-hidden="true">${esc(c.role.split('·')[0])}</span>
        <span class="cx-card-name" aria-hidden="true"><b>${mark(c.name, query)}</b>${hasZi(c) ? `<i>${mark(c.zi, query)}</i>` : ''}</span>
        <span class="cx-card-event"><em>${mark(c.title, query)}</em><small>生命 ${c.hp} · 攻击 ${c.atk}</small></span>
        <span class="cx-card-seen" aria-hidden="true">已阅</span>
      </span>
    </button>`;
  }

  function matchChar(c, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    const hay = [c.name, c.zi, c.title, c.role, FACTION[c.faction].full, FACTION[c.faction].name, TYPE[c.type]]
      .concat(c.tags)
      .concat(skillList(c).flatMap((s) => [s.name, s.desc]))
      .join(' ').toLowerCase();
    return hay.includes(q);
  }

  function renderChars() {
    const query = ui.query.trim();
    let list = CHARACTERS.filter((c) => (ui.faction === 'all' || c.faction === ui.faction) && matchChar(c, query));
    els.charEmpty.hidden = list.length > 0;
    els.charEmpty.textContent = query ? `没有找到与“${query}”相符的人物。` : '此势力暂无收录。';

    const order = ui.faction === 'all' ? ['wei', 'shu', 'wu', 'qun'] : [ui.faction];
    els.charGroups.innerHTML = order.map((fid) => {
      const group = list.filter((c) => c.faction === fid);
      if (!group.length) return '';
      const f = FACTION[fid];
      const seen = group.filter((c) => progress.viewed.includes(c.id)).length;
      return `<section class="cx-group" aria-labelledby="cx-group-${fid}">
        <header class="cx-group-head">
          <span class="cx-group-seal" aria-hidden="true">${f.name}</span>
          <div><h2 id="cx-group-${fid}">${f.full}</h2><p>${f.note}</p></div>
          <span class="cx-group-count">已阅 <b>${seen}</b> / ${group.length}</span>
        </header>
        <div class="cx-grid">${group.map((c) => charCard(c, query)).join('')}</div>
      </section>`;
    }).join('');

    const shown = list.length;
    els.live.textContent = `人物志，${ui.faction === 'all' ? '全部势力' : FACTION[ui.faction].full}，共 ${shown} 人${query ? `，搜索 ${query}` : ''}。`;
  }

  /* ---------------- 战役 ---------------- */

  function battleCard(b, query) {
    const seen = progress.battlesRead.includes(b.id);
    const f = FACTION[b.accent] || FACTION.qun;
    const scene = window.CodexArt
      ? window.CodexArt.sceneSVG(b.scene, b.accent, b.id, b.props || [])
      : '';
    return `<article class="cx-battle${seen ? ' is-seen' : ''}" data-cx-battle="${b.id}" role="button" tabindex="0" style="--accent:${f.accent};--accent-2:${f.pale}" aria-label="${esc(`${b.name}，${b.year}年，${b.sides.join('对')}，${b.result}${seen ? '，已阅' : ''}`)}">
      <span class="cx-battle-year" aria-hidden="true"><b>${b.year}</b><i>${b.era}</i></span>
      <span class="cx-battle-art" aria-hidden="true">
        ${scene}
        <span class="cx-battle-seal">战</span>
        <span class="cx-battle-mark ${recordClass(b.record)}">${b.record}</span>
      </span>
      <span class="cx-battle-body">
        <span class="cx-battle-kicker">${esc(b.place)}</span>
        <h3>${mark(b.name, query)}</h3>
        <p>${mark(b.summary, query)}</p>
        <span class="cx-battle-meta"><b>${esc(b.sides[0])}</b><i>×</i><b>${esc(b.sides[1])}</b><em>${esc(b.result)}</em></span>
        <span class="cx-battle-chips">${b.characters.slice(0, 6).map((id) => `<span>${esc(CHAR_BY_ID[id] ? CHAR_BY_ID[id].name : id)}</span>`).join('')}</span>
      </span>
      <span class="cx-battle-seen" aria-hidden="true">已阅</span>
    </article>`;
  }

  function matchBattle(b, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    const hay = [b.name, b.year, b.era, b.place, b.summary, b.result, b.record, ...b.sides, ...b.commanders]
      .join(' ').toLowerCase();
    return hay.includes(q);
  }

  function renderBattles() {
    const query = ui.query.trim();
    const list = BATTLES.filter((b) => matchBattle(b, query));
    els.battleEmpty.hidden = list.length > 0;
    els.battleEmpty.textContent = query ? `没有找到与“${query}”相符的战役。` : '暂无战役。';
    els.battleList.innerHTML = list.map((b) => battleCard(b, query)).join('');
    els.live.textContent = `战役志，共 ${list.length} 场${query ? `，搜索 ${query}` : ''}。`;
  }

  /* ---------------- 成就 ---------------- */

  function achievementCount() {
    return ACHIEVEMENTS.filter((a) => progress.unlocked[a.id]).length;
  }

  function renderAchievements() {
    els.achGrid.innerHTML = ACHIEVEMENTS.map((a) => {
      const [have, need] = a.progress();
      const done = Boolean(progress.unlocked[a.id]);
      const pct = Math.min(100, Math.round((have / Math.max(1, need)) * 100));
      const date = done && progress.unlocked[a.id] !== true
        ? new Date(progress.unlocked[a.id]).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
        : '';
      return `<article class="cx-ach${done ? ' is-done' : ''}">
        <span class="cx-ach-seal" aria-hidden="true">${a.seal}</span>
        <div class="cx-ach-body">
          <h3>${a.name}</h3>
          <p>${a.desc}</p>
          <span class="cx-ach-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${Math.min(have, need)}" aria-label="${a.name}进度"><i style="width:${pct}%"></i></span>
          <small>${done ? `已达成${date ? ` · ${date}` : ''}` : `${Math.min(have, need)} / ${need}`}</small>
        </div>
      </article>`;
    }).join('');
    const done = achievementCount();
    if (els.achCount) els.achCount.textContent = `已达成 ${done} / ${ACHIEVEMENTS.length}。`;
    els.live.textContent = `成就录，已达成 ${done} / ${ACHIEVEMENTS.length}。`;
  }

  function evaluateAchievements(silent = false) {
    const newly = [];
    ACHIEVEMENTS.forEach((a) => {
      if (progress.unlocked[a.id]) return;
      const [have, need] = a.progress();
      if (have >= need) {
        progress.unlocked[a.id] = Date.now();
        newly.push(a);
      }
    });
    if (newly.length) {
      saveProgress();
      renderAchievements();
      if (!silent) {
        const names = newly.map((a) => a.name).join('、');
        announce(`成就达成：${names}`);
        if (typeof toast === 'function') toast(`成就达成 · ${newly[0].name}${newly.length > 1 ? ` 等 ${newly.length} 项` : ''}`);
        sfx('skill');
      }
    }
    return newly;
  }

  function announce(text) {
    if (els.live) els.live.textContent = text;
  }

  function sfx(name) {
    try {
      if (typeof audio !== 'undefined' && audio && typeof audio[name] === 'function') audio[name]();
    } catch {
      /* 音频不可用时静默 */
    }
  }

  /* ---------------- 页头 / 筛选 ---------------- */

  function renderProgress() {
    const seen = progress.viewed.length;
    els.seen.textContent = seen;
    els.total.textContent = CHARACTERS.length;
    els.bar.style.width = `${(seen / CHARACTERS.length) * 100}%`;
    els.bar.parentElement?.setAttribute('aria-valuenow', String(seen));
    renderFilters();
  }

  function renderFilters() {
    const defs = [{ id: 'all', name: '全部', full: '全部', accent: '#b98a3e' }, ...Object.entries(FACTION).map(([id, f]) => ({ id, name: f.name, full: f.full, accent: f.accent }))];
    els.filters.innerHTML = defs.map((f) => {
      const total = f.id === 'all' ? CHARACTERS.length : totalOfFaction(f.id);
      const seen = f.id === 'all' ? progress.viewed.length : countFaction(f.id);
      const pressed = ui.faction === f.id;
      return `<button type="button" class="cx-filter${pressed ? ' is-on' : ''}" data-cx-filter="${f.id}" aria-pressed="${pressed}" style="--accent:${f.accent}">
        <b>${f.name}</b><span>${seen}/${total}</span>
      </button>`;
    }).join('');
  }

  function setTab(tab, opts = {}) {
    if (!['chars', 'battles', 'achievements'].includes(tab)) tab = 'chars';
    ui.tab = tab;
    els.tabs.forEach((btn) => {
      const on = btn.dataset.cxTab === tab;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    els.panels.forEach((panel) => {
      const on = panel.dataset.cxPanel === tab;
      panel.classList.toggle('is-on', on);
      panel.hidden = !on;
    });
    els.filters.hidden = tab !== 'chars';
    els.search.placeholder = tab === 'battles'
      ? '搜战役：名称、年份、主将…'
      : tab === 'achievements'
        ? '成就无需搜索，去读人物与战役吧'
        : '搜人物：姓名、势力、战法…';
    els.search.disabled = tab === 'achievements';
    els.clear.hidden = !ui.query || tab === 'achievements';
    if (!opts.keepHash) {
      const path = tab === 'chars' ? '#codex' : `#codex/${tab}`;
      if (location.hash !== path) history.replaceState(null, '', path);
    }
    if (tab === 'achievements') renderAchievements();
    if (opts.focus) els.search.focus({ preventScroll: true });
  }

  /* ---------------- 详情 ---------------- */

  function characterDetailHTML(c) {
    const f = FACTION[c.faction];
    const battle = c.battle ? BATTLE_BY_ID[c.battle] : null;
    const idx = CHAR_ORDER.indexOf(c.id);
    const prev = CHARACTERS[(idx - 1 + CHARACTERS.length) % CHARACTERS.length];
    const next = CHARACTERS[(idx + 1) % CHARACTERS.length];
    const isPlate = c.art.kind === 'plate';
    const source = isPlate ? c.art.source : SCENE_SOURCE;
    return `<article class="cx-book" role="dialog" aria-modal="true" aria-labelledby="cx-d-name" style="--accent:${f.accent};--accent-2:${f.pale}">
      <button type="button" class="cx-detail-close" data-cx-close aria-label="关闭人物详情">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-close"/></svg>
      </button>
      <div class="cx-book-page cx-book-art">
        <figure class="cx-detail-figure">
          ${charArt(c, 'detail')}
          <span class="cx-detail-seal" aria-hidden="true">${c.name[0]}</span>
          <figcaption>
            <b>${esc(c.title)}</b>
            <span>${f.full} · ${TYPE[c.type]}</span>
            <small>${esc(source)}</small>
          </figcaption>
        </figure>
        <p class="cx-art-caption">${isPlate ? '古版画 / 彩绘 · 公有领域' : '原创纸雕剪影 · 非古画'}</p>
      </div>
      <div class="cx-book-page cx-book-text">
        <p class="cx-d-kicker">${f.full} · ${TYPE[c.type]} · ${esc(c.role)}</p>
        <h2 id="cx-d-name">${esc(c.name)}<small>${hasZi(c) ? `字 ${esc(c.zi)}` : ''}</small></h2>
        <p class="cx-d-title">${esc(c.title)}</p>
        <p class="cx-d-blurb">${esc(c.blurb)}</p>
        <h3>属性</h3>
        <dl class="cx-d-stats">
          ${STAT_ROWS.map(({ key, label, max }) => `<div>
            <dt>${label}</dt>
            <dd><b class="cx-stat-val">${c[key]}</b><span class="cx-stat-bar" aria-hidden="true"><i style="width:${Math.round(Math.min(100, (c[key] / max) * 100))}%"></i></span></dd>
          </div>`).join('')}
        </dl>
        <h3>战法</h3>
        <ul class="cx-d-skills">${skillList(c).map(skillHTML).join('')}</ul>
        <p class="cx-d-meta">
          <span>势力 · ${f.full}</span>
          <span>定位 · ${esc(c.role)}</span>
          ${battle ? `<span>战役 · <button type="button" class="cx-link" data-cx-battle="${battle.id}">${esc(battle.name)}</button></span>` : ''}
        </p>
        <div class="cx-d-tags">${c.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <p class="cx-d-source">图版：${esc(source)}</p>
        <nav class="cx-d-nav" aria-label="人物翻页">
          <button type="button" data-cx-char="${prev.id}" class="cx-nav-btn"><small>上一位</small><b>${esc(prev.name)}</b></button>
          <button type="button" data-cx-char="${next.id}" class="cx-nav-btn cx-nav-btn--next"><small>下一位</small><b>${esc(next.name)}</b></button>
        </nav>
      </div>
    </article>`;
  }

  function battleDetailHTML(b) {
    const f = FACTION[b.accent] || FACTION.qun;
    const idx = BATTLE_ORDER.indexOf(b.id);
    const prev = BATTLES[(idx - 1 + BATTLES.length) % BATTLES.length];
    const next = BATTLES[(idx + 1) % BATTLES.length];
    const scene = window.CodexArt
      ? window.CodexArt.sceneSVG(b.scene, b.accent, b.id, b.props || [])
      : '';
    return `<article class="cx-book cx-book--battle" role="dialog" aria-modal="true" aria-labelledby="cx-d-name" style="--accent:${f.accent};--accent-2:${f.pale}">
      <button type="button" class="cx-detail-close" data-cx-close aria-label="关闭战役详情">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-close"/></svg>
      </button>
      <div class="cx-book-page cx-book-art">
        <figure class="cx-detail-figure cx-detail-figure--battle">
          <span class="cx-art cx-art--scene">${scene}<span class="cx-art-tone" aria-hidden="true"></span></span>
          <span class="cx-detail-seal cx-detail-seal--battle" aria-hidden="true">战</span>
          <figcaption>
            <b>${esc(b.name)}</b>
            <span>${esc(b.era)} · ${esc(b.year)}</span>
            <small>战役图 · 本项目纸雕剪影，非古画</small>
          </figcaption>
        </figure>
        <p class="cx-art-caption">${esc(b.place)}</p>
      </div>
      <div class="cx-book-page cx-book-text">
        <p class="cx-d-kicker">${esc(b.year)} · ${esc(b.era)} · ${esc(b.place)}</p>
        <h2 id="cx-d-name">${esc(b.name)}</h2>
        <p class="cx-d-title">${esc(b.sides[0])} × ${esc(b.sides[1])}</p>
        <h3>战局</h3>
        <p>${esc(b.summary)}</p>
        <p class="cx-d-record ${recordClass(b.record)}"><b>${b.record}</b>${b.recordNote ? ` · ${esc(b.recordNote)}` : ''}</p>
        <dl class="cx-d-facts">
          <div><dt>时间</dt><dd>${esc(b.era)}（${esc(b.year)}）</dd></div>
          <div><dt>地点</dt><dd>${esc(b.place)}</dd></div>
          <div><dt>主将</dt><dd>${b.commanders.map(esc).join('、')}</dd></div>
          <div><dt>结果</dt><dd>${esc(b.result)}</dd></div>
        </dl>
        <h3>相关人物</h3>
        <div class="cx-d-chars">${b.characters.map((id) => {
          const c = CHAR_BY_ID[id];
          return c ? `<button type="button" class="cx-char-chip" data-cx-char="${c.id}" style="--accent:${FACTION[c.faction].accent}"><span>${c.name[0]}</span>${esc(c.name)}</button>` : '';
        }).join('')}</div>
        <nav class="cx-d-nav" aria-label="战役翻页">
          <button type="button" data-cx-battle="${prev.id}" class="cx-nav-btn"><small>上一战</small><b>${esc(prev.name)}</b></button>
          <button type="button" data-cx-battle="${next.id}" class="cx-nav-btn cx-nav-btn--next"><small>下一战</small><b>${esc(next.name)}</b></button>
        </nav>
      </div>
    </article>`;
  }

  function openCharacter(id, opts = {}) {
    const c = CHAR_BY_ID[id];
    if (!c) return;
    if (!progress.viewed.includes(id)) {
      progress.viewed.push(id);
      saveProgress();
      syncSeen();
      evaluateAchievements();
    }
    ui.detailType = 'char';
    ui.detailId = id;
    els.detailBody.innerHTML = characterDetailHTML(c);
    showDetail();
    history.replaceState(null, '', `#codex/char/${id}`);
    announce(`人物详情：${c.name}，${c.role}，战法${skillList(c).map((s) => s.name).join('、')}。`);
    sfx('open');
    if (opts.focusClose !== false) {
      requestAnimationFrame(() => {
        const close = $('.cx-detail-close', els.detailBody);
        if (close) close.focus({ preventScroll: true });
      });
    }
  }

  function openBattle(id, opts = {}) {
    const b = BATTLE_BY_ID[id];
    if (!b) return;
    if (!progress.battlesRead.includes(id)) {
      progress.battlesRead.push(id);
      saveProgress();
      syncSeen();
      evaluateAchievements();
    }
    ui.detailType = 'battle';
    ui.detailId = id;
    els.detailBody.innerHTML = battleDetailHTML(b);
    showDetail();
    history.replaceState(null, '', `#codex/battle/${id}`);
    announce(`战役详情：${b.name}，${b.year}年。`);
    sfx('open');
    if (opts.focusClose !== false) {
      requestAnimationFrame(() => {
        const close = $('.cx-detail-close', els.detailBody);
        if (close) close.focus({ preventScroll: true });
      });
    }
  }

  function showDetail() {
    const wasOpen = !els.detail.hidden;
    els.detail.hidden = false;
    if (!wasOpen && typeof openOverlay === 'function') {
      openOverlay(els.detail, { focus: '.cx-detail-close' });
    }
  }

  function closeDetail(opts = {}) {
    if (typeof closeOverlay === 'function' && activeOverlay === els.detail) {
      closeOverlay(els.detail, opts.restore !== false);
    } else {
      els.detail.hidden = true;
    }
    ui.detailType = null;
    ui.detailId = null;
    announce('已收起详情。');
    if (!opts.keepHash) {
      const path = ui.tab === 'chars' ? '#codex' : `#codex/${ui.tab}`;
      if (location.hash !== path) history.replaceState(null, '', path);
    }
  }

  function syncSeen() {
    renderProgress();
    const seen = progress.viewed;
    $$('.cx-card', els.charGroups).forEach((card) => {
      const on = seen.includes(card.dataset.cxChar);
      card.classList.toggle('is-seen', on);
      if (on) card.setAttribute('aria-label', `${card.getAttribute('aria-label').replace(/，已阅$/, '')}，已阅`);
    });
    $$('.cx-battle', els.battleList).forEach((card) => {
      card.classList.toggle('is-seen', progress.battlesRead.includes(card.dataset.cxBattle));
    });
  }

  /* ---------------- 路由 ---------------- */

  function route(hash) {
    const raw = (hash || '').replace(/^#/, '');
    if (!raw.startsWith('codex')) return;
    const parts = raw.split('/').filter(Boolean);
    if (parts[1] === 'char' && parts[2]) {
      setTab('chars', { keepHash: true });
      openCharacter(parts[2], { focusClose: false });
      return;
    }
    if (parts[1] === 'battle' && parts[2]) {
      setTab('battles', { keepHash: true });
      openBattle(parts[2], { focusClose: false });
      return;
    }
    if (ui.detailType) closeDetail({ keepHash: true, restore: false });
    if (parts[1] === 'battles') {
      setTab('battles', { keepHash: true });
      return;
    }
    if (parts[1] === 'achievements') {
      setTab('achievements', { keepHash: true });
      return;
    }
    setTab('chars', { keepHash: true });
  }

  /* ---------------- 事件 ---------------- */

  function bind() {
    els.tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        setTab(btn.dataset.cxTab);
        sfx('select');
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const idx = els.tabs.indexOf(btn);
        const next = els.tabs[(idx + (e.key === 'ArrowRight' ? 1 : -1) + els.tabs.length) % els.tabs.length];
        if (next) {
          setTab(next.dataset.cxTab);
          next.focus();
          sfx('select');
        }
      });
    });

    els.filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cx-filter]');
      if (!btn) return;
      ui.faction = btn.dataset.cxFilter;
      renderFilters();
      renderChars();
      sfx('select');
      const panel = $('[data-cx-panel="chars"]');
      if (panel) panel.scrollTop = 0;
    });

    els.search.addEventListener('input', () => {
      ui.query = els.search.value;
      els.clear.hidden = !ui.query;
      if (ui.tab === 'battles') renderBattles();
      else renderChars();
    });

    els.clear.addEventListener('click', () => {
      ui.query = '';
      els.search.value = '';
      els.clear.hidden = true;
      els.search.focus();
      if (ui.tab === 'battles') renderBattles();
      else renderChars();
    });

    document.addEventListener('click', (e) => {
      if (!stateCodexActive()) return;
      const close = e.target.closest('[data-cx-close]');
      if (close) {
        closeDetail();
        sfx('close');
        return;
      }
      const charBtn = e.target.closest('[data-cx-char]');
      if (charBtn) {
        e.preventDefault();
        openCharacter(charBtn.dataset.cxChar);
        return;
      }
      const battleBtn = e.target.closest('[data-cx-battle]');
      if (battleBtn) {
        e.preventDefault();
        openBattle(battleBtn.dataset.cxBattle);
        return;
      }
      if (e.target === els.detail) {
        closeDetail();
        sfx('close');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!stateCodexActive()) return;
      if (e.key === 'Escape' && ui.detailType) {
        e.preventDefault();
        closeDetail();
        sfx('close');
        return;
      }
      const active = document.activeElement;
      if ((e.key === 'Enter' || e.key === ' ') && active && active.classList && active.classList.contains('cx-battle') && active.getAttribute('role') === 'button') {
        e.preventDefault();
        openBattle(active.dataset.cxBattle);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (!ui.detailType) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        const order = ui.detailType === 'char' ? CHAR_ORDER : BATTLE_ORDER;
        const idx = order.indexOf(ui.detailId);
        if (idx < 0) return;
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const nextId = order[(idx + delta + order.length) % order.length];
        if (ui.detailType === 'char') openCharacter(nextId);
        else openBattle(nextId);
      }
    });

    if (els.detail) {
      els.detail.addEventListener('click', (e) => {
        if (e.target === els.detail) {
          closeDetail();
          sfx('close');
        }
      });
    }

    document.addEventListener('codex:battle', (e) => {
      const d = e.detail || {};
      progress.played += 1;
      if (d.win) {
        progress.wins += 1;
        if (d.rank === 'S') progress.perfectWins += 1;
        if (Number(d.round) <= 5) progress.fastWins += 1;
      }
      if (RANK_VALUE[d.rank] > RANK_VALUE[progress.bestRank]) progress.bestRank = d.rank;
      progress.lastSeen = Date.now();
      saveProgress();
      evaluateAchievements();
    });
  }

  function stateCodexActive() {
    return Boolean(els.screen && els.screen.classList.contains('is-active'));
  }

  /* ---------------- 初始化 ---------------- */

  function init() {
    cacheEls();
    if (!els.screen) return;
    bind();
    renderFilters();
    renderChars();
    renderBattles();
    renderAchievements();
    renderProgress();
    evaluateAchievements(true);
    setTab('chars', { keepHash: true });
  }

  window.Codex = { route, openCharacter, openBattle, closeDetail };
  init();
})();
