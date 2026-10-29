(() => {
  'use strict';

  const CHAPTERS = window.DAODEJING || [];
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const STORE = { cfg: 'laozi.config.v1', chat: 'laozi.chat.v1' };

  const PROVIDERS = {
    deepseek: {
      label: 'DeepSeek 深度求索',
      base: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      note: '国内直连 · 在 platform.deepseek.com 申请密钥 · 也可填 deepseek-reasoner',
    },
    moonshot: {
      label: 'Kimi · 月之暗面',
      base: 'https://api.moonshot.cn/v1',
      model: 'kimi-latest',
      note: '国内直连 · platform.moonshot.cn',
    },
    zhipu: {
      label: '智谱 GLM',
      base: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-flash',
      note: '国内直连 · 官方接口不支持浏览器跨域，需用 server/proxy.mjs 转发 · glm-4-flash 有免费额度',
    },
    qwen: {
      label: '通义千问 · 阿里云',
      base: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      note: '国内直连 · bailian.console.aliyun.com',
    },
    ark: {
      label: '豆包 · 火山方舟',
      base: 'https://ark.cn-beijing.volces.com/api/v3',
      model: 'doubao-seed-1-6-250615',
      note: '国内直连 · 跨域受限，若失败请用 server/proxy.mjs 转发 · 可填模型名或接入点 ID',
    },
    hunyuan: {
      label: '腾讯混元',
      base: 'https://api.hunyuan.cloud.tencent.com/v1',
      model: 'hunyuan-turbos-latest',
      note: '国内直连 · 官方接口不支持浏览器跨域，需用 server/proxy.mjs 转发',
    },
    qianfan: {
      label: '百度千帆 · 文心',
      base: 'https://qianfan.baidubce.com/v2',
      model: 'ernie-4.5-turbo-128k',
      note: '国内直连 · console.bce.baidu.com/qianfan',
    },
    spark: {
      label: '讯飞星火',
      base: 'https://spark-api-open.xf-yun.com/v1',
      model: 'generalv3.5',
      note: '国内直连 · 官方接口不支持浏览器跨域，需用 server/proxy.mjs 转发',
    },
    siliconflow: {
      label: '硅基流动',
      base: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3.2-Exp',
      note: '国内直连 · cloud.siliconflow.cn · 可换任意开源模型',
    },
    minimax: {
      label: 'MiniMax',
      base: 'https://api.minimaxi.com/v1',
      model: 'MiniMax-M2',
      note: '国内直连 · platform.minimaxi.com',
    },
    baichuan: {
      label: '百川智能',
      base: 'https://api.baichuan-ai.com/v1',
      model: 'Baichuan4',
      note: '国内直连 · platform.baichuan-ai.com',
    },
    stepfun: {
      label: '阶跃星辰',
      base: 'https://api.stepfun.com/v1',
      model: 'step-2-16k',
      note: '国内直连 · platform.stepfun.com',
    },
    openai: {
      label: 'OpenAI',
      base: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      note: '境外接口 · 需要网络可达，通常也需自建转发 · platform.openai.com',
    },
    ollama: {
      label: 'Ollama · 本地',
      base: 'http://localhost:11434/v1',
      model: 'qwen2.5:7b',
      note: '本机运行 · 密钥可留空 · 需允许跨域（OLLAMA_ORIGINS=*）',
    },
    custom: {
      label: '自定义 OpenAI 兼容接口',
      base: '',
      model: '',
      note: '填写任意兼容 /chat/completions 的地址与模型',
    },
  };

  const STYLE_PROMPTS = {
    plain: '【此刻语气】冲淡。像秋日午后对坐，语速慢，句子短，留白多。',
    classical: '【此刻语气】简古。多用四言、对句与譬喻，略近先秦语感，但仍要让今人一读就懂。',
    warm: '【此刻语气】亲切。像一位温和的长者坐在对面，可用日常白话，但仍有分寸，不油滑，不卖弄。',
  };

  const PERSONA = `你名李耳，后世称你老子。你曾为周守藏室之史，见周室衰微，西出函谷，应关尹之请，留下五千言。此刻，一位今人坐在你对面，向你问事。

你说话的方式：
一、每次开口，先引一句《道德经》原文。只引一句，从本次给出的经句中择取，原样抄录，用「」括起，单独成行；不改写，不拼接，不说“老子说”，不标出处。
二、引完空一行，再说你的话。只点一层意思，一二十字到七八十字，最多百字上下。不逐字翻译，不列一二三，不给步骤，不举一串例子，不把话说满，留一点余地给对方。
三、简短、克制。不必每问都给答案，有时只把问题照见一下。结尾不必每次都发问；若问，只问一句。
四、不居高，不说教，不与人争。多用譬喻、对照、反问，少下断语。
五、用浅近的文言与白话相融。不要堆砌“之乎者也”，不要生僻字，不要写成现代论文。
六、不自称“本座”“老夫”“贫道”，不说自己是 AI、模型、程序或角色扮演，不跳出这个身份。
七、面对手机、公司、考试、房贷这些你未曾见过的事物，不必装作熟悉。可以说：“此物我未曾见。然其理，或与……相通。”
八、不议论现实政治与具体人物，不给医疗、法律、投资等专业建议。若对方身有疾患或处境危险，先温厚相待，再劝其寻可信之人、求专业之助。
九、若对方只是闲谈，就陪他闲谈；不必每句讲道，不必每次给答案。
十、对方称你“老子”“先生”“您”皆可，你称对方“你”即可，不用“阁下”“施主”。
十一、不要使用 Markdown 标题、列表或代码块，不要加括号里的旁白或动作描写。`;

  // 每答必引一句。经句均取自 data/daodejing.json，建库时逐条校验。
  const QUOTE_BANK = [
    { n: 1, text: '道可道，非常道；名可名，非常名。', tags: ['道', '名', '语言', '本质', '说', '定义', '真理'] },
    { n: 1, text: '玄之又玄，众妙之门。', tags: ['玄', '深', '奥', '神秘', '门'] },
    { n: 2, text: '有无相生，难易相成，长短相较，高下相倾，音声相和，前后相随。', tags: ['相对', '比较', '好坏', '难易', '有无', '标准'] },
    { n: 2, text: '是以圣人处无为之事，行不言之教；', tags: ['无为', '教育', '管理', '行动', '示范'] },
    { n: 8, text: '上善若水。水善利万物而不争，处众人之所恶，故几于道。', tags: ['水', '善', '柔', '争', '利他', '处下', '忍'] },
    { n: 9, text: '持而盈之，不如其已；', tags: ['满', '过度', '贪', '停', '知止', '累'] },
    { n: 9, text: '功遂身退，天之道。', tags: ['退', '放下', '功', '成', '离开', '结束'] },
    { n: 10, text: '专气致柔，能婴儿乎？', tags: ['柔', '呼吸', '婴儿', '松', '身体', '静'] },
    { n: 11, text: '有之以为利，无之以为用。', tags: ['空', '无', '用', '房间', '时间', '留白', '实用'] },
    { n: 12, text: '五色令人目盲，五音令人耳聋，五味令人口爽，驰骋畋猎令人心发狂，难得之货令人行妨。', tags: ['欲望', '信息', '手机', '消费', '感官', '多', '刺激'] },
    { n: 13, text: '宠辱若惊，贵大患若身。', tags: ['评价', '面子', '得失', '荣辱', '别人', '在意'] },
    { n: 16, text: '致虚极，守静笃。', tags: ['静', '焦虑', '烦', '心', '内耗', '压力', '失眠', '定', '空'] },
    { n: 16, text: '万物并作，吾以观复。', tags: ['循环', '变化', '观察', '周期', '回归'] },
    { n: 16, text: '知常曰明。不知常，妄作凶。', tags: ['规律', '常', '明', '妄', '冲动', '常识'] },
    { n: 19, text: '见素抱朴，少私寡欲。', tags: ['简单', '少', '朴', '欲望', '极简', '消费', '放下'] },
    { n: 22, text: '曲则全，枉则直，洼则盈，敝则新，少则得，多则惑。', tags: ['委屈', '弯曲', '低', '旧', '新', '退', '全', '转机'] },
    { n: 22, text: '夫唯不争，故天下莫能与之争。', tags: ['争', '竞争', '比较', '冲突', '人际', '职场', '赢'] },
    { n: 23, text: '飘风不终朝，骤雨不终日。', tags: ['情绪', '难过', '焦虑', '时间', '过去', '极端', '风暴', '低谷'] },
    { n: 24, text: '企者不立，跨者不行，自见者不明，自是者不彰，自伐者无功，自矜者不长。', tags: ['急', '快', '勉强', '坚持', '节奏', '用力'] },
    { n: 25, text: '人法地，地法天，天法道，道法自然。', tags: ['自然', '规律', '顺', '天人', '道', '生活'] },
    { n: 26, text: '重为轻根，静为躁君。', tags: ['静', '躁', '急', '根', '稳重', '轻浮'] },
    { n: 27, text: '善行无辙迹，善言无瑕谪；', tags: ['做事', '说话', '痕迹', '低调', '完美', '表达'] },
    { n: 28, text: '知其雄，守其雌，为天下溪。', tags: ['强弱', '守', '低调', '包容', '退让', '溪'] },
    { n: 30, text: '物壮则老，是谓不道，不道早已。', tags: ['极盛', '老', '衰退', '过度', '强', '结束'] },
    { n: 33, text: '知人者智，自知者明。', tags: ['自己', '认识', '别人', '自知', '明', '成长', '评价'] },
    { n: 33, text: '胜人者有力，自胜者强。', tags: ['胜', '强', '自己', '战胜', '自律', '竞争'] },
    { n: 33, text: '知足者富。强行者有志。', tags: ['知足', '富', '钱', '欲望', '志', '坚持'] },
    { n: 36, text: '柔弱胜刚强。', tags: ['柔', '弱', '强', '胜', '水', '忍', '冲突'] },
    { n: 37, text: '道常无为而无不为。', tags: ['无为', '做事', '控制', '顺其自然', '效率', '管理'] },
    { n: 40, text: '反者道之动，弱者道之用。', tags: ['反转', '失败', '低谷', '转机', '弱', '变化', '循环'] },
    { n: 41, text: '大器晚成，大音希声，大象无形，道隐无名。', tags: ['晚', '慢', '成长', '成功', '大', '无形', '耐心'] },
    { n: 44, text: '知足不辱，知止不殆，可以长久。', tags: ['知足', '知止', '长久', '欲望', '风险', '钱', '累'] },
    { n: 45, text: '大直若屈，大巧若拙，大辩若讷。', tags: ['笨', '聪明', '低调', '辩', '直', '巧'] },
    { n: 46, text: '祸莫大于不知足；咎莫大于欲得。', tags: ['欲望', '贪', '祸', '不知足', '得到', '风险'] },
    { n: 47, text: '不出户，知天下；不窥牖，见天道。', tags: ['信息', '远', '近', '内心', '观察', '旅行', '知识'] },
    { n: 48, text: '为学日益，为道日损。', tags: ['学习', '知识', '减', '放下', '成长', '简单', '信息'] },
    { n: 52, text: '见小曰明，守柔曰强。', tags: ['细节', '柔', '强', '明', '小', '观察'] },
    { n: 58, text: '祸兮福之所倚，福兮祸之所伏。', tags: ['祸福', '失败', '坏事', '好事', '得失', '变化', '转机'] },
    { n: 60, text: '治大国，若烹小鲜。', tags: ['管理', '领导', '团队', '教育', '干预', '折腾'] },
    { n: 63, text: '图难于其易，为大于其细；', tags: ['难', '大', '小事', '细节', '计划', '做事', '目标'] },
    { n: 63, text: '轻诺必寡信，多易必多难。', tags: ['承诺', '信任', '轻率', '容易', '说话'] },
    { n: 64, text: '千里之行，始于足下。', tags: ['开始', '行动', '坚持', '目标', '第一步', '拖延', '路'] },
    { n: 64, text: '慎终如始，则无败事。', tags: ['坚持', '结尾', '开始', '谨慎', '事', '完成'] },
    { n: 66, text: '江海所以能为百谷王者，以其善下之，故能为百谷王。', tags: ['领导', '低', '下', '包容', '管理', '谦', '江海'] },
    { n: 67, text: '我有三宝，持而保之。一曰慈，二曰俭，三曰不敢为天下先。', tags: ['慈', '俭', '谦', '宝', '做人', '领导', '简单'] },
    { n: 70, text: '知我者希，则我者贵。', tags: ['懂', '孤独', '理解', '别人', '自己', '珍贵'] },
    { n: 71, text: '知不知，上；不知知，病。', tags: ['知道', '无知', '谦虚', '学习', '认知'] },
    { n: 73, text: '天网恢恢，疏而不失。', tags: ['公平', '因果', '报应', '等待', '天道', '坏事'] },
    { n: 73, text: '天之道，不争而善胜，不言而善应，不召而自来，繟然而善谋。', tags: ['争', '胜', '沉默', '天道', '回应', '等待'] },
    { n: 76, text: '人之生也柔弱，其死也坚强。', tags: ['生', '死', '柔', '强', '生命', '身体'] },
    { n: 77, text: '天之道，损有余而补不足。', tags: ['公平', '分配', '有余', '不足', '天道', '贫富'] },
    { n: 78, text: '弱之胜强，柔之胜刚，天下莫不知莫能行。', tags: ['柔', '弱', '强', '刚', '水', '忍'] },
    { n: 81, text: '信言不美，美言不信。', tags: ['说话', '真话', '好听', '表达', '信任', '沟通'] },
    { n: 81, text: '善者不辩，辩者不善。', tags: ['争辩', '解释', '对错', '沟通', '沉默'] },
    { n: 81, text: '天之道，利而不害；圣人之道，为而不争。', tags: ['争', '天道', '做事', '利他', '为'] },
  ];

  const DEFAULT_QUOTE_CHAPTERS = [1, 8, 16, 22, 33, 40, 44, 48, 58, 64, 81];

  const QUOTES = [
    { n: 1, text: '道可道，非常道；名可名，非常名。' },
    { n: 8, text: '上善若水。水善利万物而不争，处众人之所恶，故几于道。' },
    { n: 11, text: '有之以为利，无之以为用。' },
    { n: 16, text: '致虚极，守静笃。' },
    { n: 22, text: '夫唯不争，故天下莫能与之争。' },
    { n: 33, text: '知人者智，自知者明。' },
    { n: 40, text: '反者道之动，弱者道之用。' },
    { n: 44, text: '知足不辱，知止不殆，可以长久。' },
    { n: 48, text: '为学日益，为道日损。' },
    { n: 58, text: '祸兮福之所倚，福兮祸之所伏。' },
    { n: 64, text: '千里之行，始于足下。' },
    { n: 81, text: '天之道，利而不害；圣人之道，为而不争。' },
  ];

  const cn = (n) => {
    const digits = '零一二三四五六七八九';
    if (n < 10) return digits[n];
    if (n === 10) return '十';
    if (n < 20) return '十' + digits[n % 10];
    return digits[Math.floor(n / 10)] + '十' + (n % 10 ? digits[n % 10] : '');
  };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 存储不可用时静默降级 */
    }
  };

  // ---------- config ----------

  function loadConfig() {
    const saved = readJSON(STORE.cfg, {}) || {};
    const provider = PROVIDERS[saved.provider] ? saved.provider : 'deepseek';
    const preset = PROVIDERS[provider];
    const fontSize = [0, 1, 2].includes(saved.fontSize) ? saved.fontSize : 1;
    return {
      provider,
      baseUrl: typeof saved.baseUrl === 'string' ? saved.baseUrl : preset.base,
      model: typeof saved.model === 'string' ? saved.model : preset.model,
      keys: saved.keys && typeof saved.keys === 'object' ? saved.keys : {},
      style: STYLE_PROMPTS[saved.style] ? saved.style : 'plain',
      extraHeaders: typeof saved.extraHeaders === 'string' ? saved.extraHeaders : '',
      extraBody: typeof saved.extraBody === 'string' ? saved.extraBody : '',
      fontSize,
    };
  }

  let cfg = loadConfig();

  const state = {
    chapter: 1,
    messages: [],
    context: null,
    streaming: false,
    abort: null,
    lastFocus: null,
    quoteIndex: 0,
    quoteCursor: 0,
  };

  const savedChat = readJSON(STORE.chat, {}) || {};
  if (Array.isArray(savedChat.messages)) {
    state.messages = savedChat.messages
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim()
      )
      .slice(-40)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
  }
  if (Number.isInteger(savedChat.context) && savedChat.context >= 1 && savedChat.context <= 81) {
    state.context = savedChat.context;
  }

  const currentKey = () => String(cfg.keys[cfg.provider] || '').trim();

  const isConfigured = () => {
    if (cfg.provider === 'ollama') return true;
    if (currentKey()) return true;
    return /api-key|authorization/i.test(cfg.extraHeaders || '');
  };

  const persistConfig = () => writeJSON(STORE.cfg, cfg);
  const persistChat = () =>
    writeJSON(STORE.chat, { messages: state.messages.slice(-40), context: state.context });

  // ---------- dom ----------

  const head = $('#site-head');
  const viewHome = $('#view-home');
  const viewRead = $('#view-read');
  const navRead = $('#nav-read');

  const quoteText = $('#quote-text');
  const quoteSrc = $('#quote-src');
  const quoteLink = $('#quote-link');

  const tocGrid = $('#toc-grid');
  const tocResults = $('#toc-results');
  const tocSearch = $('#toc-search');
  const tocEmpty = $('#toc-empty');
  const chapterEyebrow = $('#chapter-eyebrow');
  const chapterTitle = $('#chapter-title');
  const chapterText = $('#chapter-text');
  const chapterProgress = $('#chapter-progress');
  const prevChapter = $('#prev-chapter');
  const nextChapter = $('#next-chapter');
  const askChapter = $('#ask-chapter');
  const copyChapter = $('#copy-chapter');
  const fontSizeBtn = $('#font-size');

  const chat = $('#chat');
  const scrim = $('#chat-scrim');
  const chatBody = $('#chat-body');
  const messagesEl = $('#messages');
  const introEl = $('#chat-intro');
  const suggestsEl = $('#suggests');
  const chatStatus = $('#chat-status');
  const chatSetup = $('#chat-setup');
  const contextBar = $('#chat-context');
  const contextLabel = $('#chat-context-label');
  const input = $('#chat-input');
  const chatForm = $('#chat-form');
  const sendBtn = $('#chat-send');
  const errorBar = $('#chat-error');
  const errorText = $('#chat-error-text');
  const retryBtn = $('#chat-retry');

  const settings = $('#settings');
  const settingsForm = $('#settings-form');
  const providerSel = $('#provider');
  const providerNote = $('#provider-note');
  const baseInput = $('#base-url');
  const modelInput = $('#model');
  const keyInput = $('#api-key');
  const toggleKeyBtn = $('#toggle-key');
  const styleSel = $('#style');
  const extraHeadersInput = $('#extra-headers');
  const extraBodyInput = $('#extra-body');
  const testStatus = $('#test-status');

  // ---------- home ----------

  function setQuote(index) {
    state.quoteIndex = ((index % QUOTES.length) + QUOTES.length) % QUOTES.length;
    const q = QUOTES[state.quoteIndex];
    quoteText.textContent = q.text;
    quoteSrc.textContent = '第' + cn(q.n) + '章';
    quoteLink.href = '#/read/' + q.n;
  }

  const setDailyQuote = () => setQuote(Math.floor(Date.now() / 86400000) % QUOTES.length);
  setDailyQuote();
  $('#quote-next').addEventListener('click', () => setQuote(state.quoteIndex + 1));

  // ---------- routing ----------

  function showView(name) {
    const read = name === 'read';
    viewHome.hidden = read;
    viewRead.hidden = !read;
    navRead.textContent = read ? '目录' : '经文';
  }

  function route() {
    const match = location.hash.match(/^#\/read\/(\d{1,2})$/);
    if (match) {
      const n = Number(match[1]);
      if (!Number.isFinite(n) || n < 1 || n > CHAPTERS.length) {
        location.replace('#/read/1');
        return;
      }
      showView('read');
      renderChapter(n);
    } else {
      showView('home');
      document.title = '老子 · 道德经｜与老子对话';
    }
    window.scrollTo(0, 0);
  }

  function navigateChapter(n) {
    const target = Math.min(Math.max(n, 1), CHAPTERS.length);
    if (state.chapter === target && location.hash === '#/read/' + target) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    location.hash = '#/read/' + target;
  }

  navRead.addEventListener('click', (e) => {
    if (!viewRead.hidden) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navRead.href = '#/read/' + state.chapter;
    }
  });

  // ---------- toc ----------

  function buildToc() {
    const frag = document.createDocumentFragment();
    CHAPTERS.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(c.n);
      b.title = c.title;
      b.dataset.n = String(c.n);
      b.addEventListener('click', () => navigateChapter(c.n));
      frag.append(b);
    });
    tocGrid.append(frag);
  }

  function markToc(n) {
    $$('#toc-grid button').forEach((b) => {
      if (Number(b.dataset.n) === n) {
        b.setAttribute('aria-current', 'true');
        b.scrollIntoView({ block: 'nearest', inline: 'center' });
      } else {
        b.removeAttribute('aria-current');
      }
    });
    $$('#toc-results button').forEach((b) => {
      if (Number(b.dataset.n) === n) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function snippet(text, q) {
    const i = text.indexOf(q);
    if (i < 0) return escapeHtml(text.slice(0, 36)) + '…';
    const start = Math.max(0, i - 12);
    const end = Math.min(text.length, i + q.length + 22);
    return (
      (start > 0 ? '…' : '') +
      escapeHtml(text.slice(start, i)) +
      '<mark>' +
      escapeHtml(q) +
      '</mark>' +
      escapeHtml(text.slice(i + q.length, end)) +
      (end < text.length ? '…' : '')
    );
  }

  function runSearch() {
    const q = tocSearch.value.trim();
    if (!q) {
      tocGrid.hidden = false;
      tocResults.hidden = true;
      tocEmpty.hidden = true;
      tocResults.innerHTML = '';
      return;
    }
    const matches = CHAPTERS.filter(
      (c) => c.text.includes(q) || c.title.includes(q) || String(c.n) === q
    );
    tocGrid.hidden = true;
    tocEmpty.hidden = matches.length > 0;
    tocResults.hidden = matches.length === 0;
    tocResults.innerHTML = '';
    matches.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.n = String(c.n);
      const label = document.createElement('b');
      label.textContent = '第' + cn(c.n) + '章';
      const span = document.createElement('span');
      span.innerHTML = snippet(c.text, q);
      b.append(label, span);
      b.addEventListener('click', () => navigateChapter(c.n));
      tocResults.append(b);
    });
    markToc(state.chapter);
  }

  tocSearch.addEventListener('input', runSearch);

  // ---------- reader ----------

  function splitParagraphs(text) {
    const out = [];
    let buf = '';
    for (const ch of text) {
      buf += ch;
      if (/[。！？]/.test(ch) && buf.length >= 62) {
        out.push(buf);
        buf = '';
      }
    }
    if (buf) {
      if (out.length && buf.length < 18) out[out.length - 1] += buf;
      else out.push(buf);
    }
    return out;
  }

  function renderChapter(n) {
    const c = CHAPTERS[n - 1];
    if (!c) return;
    state.chapter = n;
    const prefix = n <= 37 ? '道经' : '德经';
    chapterEyebrow.textContent = prefix + ' · 第' + cn(n) + '章';
    chapterTitle.textContent = '第' + cn(n) + '章';
    chapterText.dataset.size = String(cfg.fontSize);
    chapterText.innerHTML = splitParagraphs(c.text)
      .map((p) => '<p>' + escapeHtml(p) + '</p>')
      .join('');
    chapterProgress.textContent = n + ' / ' + CHAPTERS.length;
    prevChapter.href = '#/read/' + Math.max(1, n - 1);
    nextChapter.href = '#/read/' + Math.min(CHAPTERS.length, n + 1);
    prevChapter.setAttribute('aria-disabled', n === 1 ? 'true' : 'false');
    nextChapter.setAttribute('aria-disabled', n === CHAPTERS.length ? 'true' : 'false');
    prevChapter.querySelector('span').textContent = n > 1 ? '第' + cn(n - 1) + '章' : '已是首章';
    nextChapter.querySelector('span').textContent =
      n < CHAPTERS.length ? '第' + cn(n + 1) + '章' : '已是末章';
    navRead.href = '#/read/' + n;
    markToc(n);
    document.title = '第' + cn(n) + '章 · 老子';
  }

  fontSizeBtn.addEventListener('click', () => {
    cfg.fontSize = (cfg.fontSize + 1) % 3;
    chapterText.dataset.size = String(cfg.fontSize);
    persistConfig();
  });

  copyChapter.addEventListener('click', async () => {
    const c = CHAPTERS[state.chapter - 1];
    const text = '第' + cn(c.n) + '章\n\n' + c.text + '\n\n——《道德经》';
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    const original = copyChapter.textContent;
    copyChapter.textContent = ok ? '已复制' : '复制失败';
    setTimeout(() => {
      copyChapter.textContent = original;
    }, 1600);
  });

  askChapter.addEventListener('click', () => {
    openChat({
      chapter: state.chapter,
      prefill: '第' + cn(state.chapter) + '章所言，于今日何用？',
    });
  });

  // ---------- chat shell ----------

  function setStatus() {
    if (!isConfigured()) {
      chatStatus.textContent = '未接入 · 点“设置”填入密钥';
      chatStatus.title = '';
      chatStatus.classList.add('is-off');
    } else {
      const label = PROVIDERS[cfg.provider].label;
      const short = label.split(' · ')[0].split(' ')[0];
      chatStatus.textContent = short + ' · ' + cfg.model;
      chatStatus.title = label + ' · ' + cfg.model;
      chatStatus.classList.remove('is-off');
    }
    chatSetup.hidden = isConfigured();
  }

  function hideIntro() {
    introEl.hidden = true;
  }

  function showIntroIfEmpty() {
    introEl.hidden = state.messages.length > 0;
  }

  function scrollChat(force) {
    if (!force) {
      const nearBottom =
        chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight < 180;
      if (!nearBottom) return;
    }
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function openChat(opts = {}) {
    state.lastFocus = document.activeElement;
    chat.classList.add('open');
    chat.setAttribute('aria-hidden', 'false');
    document.body.classList.add('chat-open');
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('show'));
    if (opts.chapter) setContext(opts.chapter);
    if (opts.prefill) {
      input.value = opts.prefill;
      resizeInput();
    }
    setStatus();
    showIntroIfEmpty();
    setTimeout(() => {
      scrollChat(true);
      input.focus({ preventScroll: true });
    }, 320);
  }

  function closeChat() {
    chat.classList.remove('open');
    chat.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('chat-open');
    scrim.classList.remove('show');
    setTimeout(() => {
      if (!chat.classList.contains('open')) scrim.hidden = true;
    }, 420);
    if (state.lastFocus && document.contains(state.lastFocus)) {
      state.lastFocus.focus({ preventScroll: true });
    }
  }

  $$('[data-open-chat]').forEach((b) =>
    b.addEventListener('click', () => openChat())
  );
  $('#chat-close').addEventListener('click', closeChat);
  scrim.addEventListener('click', closeChat);
  $('#chat-setup').addEventListener('click', openSettings);

  function setContext(n) {
    state.context = n;
    contextBar.hidden = false;
    contextLabel.textContent = '第' + cn(n) + '章';
    persistChat();
  }

  function clearContext() {
    state.context = null;
    contextBar.hidden = true;
    persistChat();
  }

  $('#clear-context').addEventListener('click', clearContext);

  // ---------- messages ----------

  function renderRich(text) {
    const clean = String(text).replace(/```[a-zA-Z]*\n?/g, '');
    const escaped = escapeHtml(clean)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`\n]+)`/g, '$1');
    const paras = escaped
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!paras.length) return '<p></p>';
    return paras
      .map((s, i) => {
        if (i === 0) {
          const m = s.match(/^「[^」]{1,160}」/);
          if (m) {
            const rest = s
              .slice(m[0].length)
              .replace(/^[\s—–\-:：,，。]+/, '')
              .replace(/^《道德经》[^。]*。?/, '')
              .trim();
            return '<p class="verse">' + m[0] + '</p>' + (rest ? '<p>' + rest + '</p>' : '');
          }
        }
        return '<p>' + s + '</p>';
      })
      .join('');
  }

  function pickQuoteCandidates(userText) {
    const text = String(userText || '').toLowerCase();
    const lastAssistant = [...state.messages].reverse().find((m) => m.role === 'assistant');
    const lastContent = lastAssistant ? lastAssistant.content : '';
    const scored = QUOTE_BANK.map((q, i) => {
      let score = 0;
      for (const tag of q.tags) {
        if (text.includes(tag)) score += tag.length > 1 ? 2 : 0.6;
      }
      if (state.context === q.n) score += 4;
      if (lastContent.includes(q.text)) score -= 8;
      return { q, score, i };
    });
    scored.sort((a, b) => b.score - a.score || a.i - b.i);

    const picked = scored
      .filter((s) => s.score > 0)
      .slice(0, 3)
      .map((s) => s.q);
    const used = new Set(picked.map((q) => q.text));
    const pool = DEFAULT_QUOTE_CHAPTERS.map((n) => QUOTE_BANK.find((q) => q.n === n)).filter(Boolean);
    const start = state.quoteCursor % Math.max(pool.length, 1);
    for (let k = 0; picked.length < 3 && k < pool.length; k += 1) {
      const q = pool[(start + k) % pool.length];
      if (q && !used.has(q.text)) {
        picked.push(q);
        used.add(q.text);
      }
    }
    state.quoteCursor += 1;
    return picked.slice(0, 3);
  }

  function ensureQuote(text, candidates) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return trimmed;
    if (/^「[^」]+」/.test(trimmed)) return trimmed;
    const firstLine = trimmed.split('\n')[0];
    const hit = candidates.find((c) => firstLine.includes(c.text));
    if (hit) {
      const rest = firstLine.replace(hit.text, '').replace(/^[」\s:：,，。—–-]+/, '').trim();
      const tail = trimmed.slice(firstLine.length).trim();
      return (
        '「' +
        hit.text +
        '」' +
        (rest ? '\n' + rest : '') +
        (tail ? '\n\n' + tail : '')
      );
    }
    if (!candidates.length) return trimmed;
    return '「' + candidates[0].text + '」\n\n' + trimmed;
  }

  function addUserBubble(text) {
    const el = document.createElement('div');
    el.className = 'msg msg-user';
    const body = document.createElement('div');
    body.className = 'msg-body';
    body.textContent = text;
    el.append(body);
    messagesEl.append(el);
    hideIntro();
    scrollChat(true);
    return el;
  }

  function addLaoziBubble(text, typing = false) {
    const el = document.createElement('div');
    el.className = 'msg msg-laozi' + (typing ? ' is-streaming' : '');
    el.innerHTML =
      '<div class="msg-mark" aria-hidden="true">道</div>' +
      '<div class="msg-body">' +
      (typing ? '<span class="dots"><i></i><i></i><i></i></span>' : renderRich(text)) +
      '</div>';
    messagesEl.append(el);
    hideIntro();
    scrollChat(true);
    return el;
  }

  function setError(message, canRetry = false) {
    if (!message) {
      errorBar.hidden = true;
      errorText.textContent = '';
      retryBtn.hidden = true;
      return;
    }
    errorBar.hidden = false;
    errorText.textContent = message;
    retryBtn.hidden = !canRetry;
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 132) + 'px';
  }

  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (state.streaming) return;
      sendMessage();
    }
  });
  input.addEventListener('compositionstart', () => {
    input.dataset.composing = '1';
  });
  input.addEventListener('compositionend', () => {
    delete input.dataset.composing;
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.streaming) {
      state.abort?.abort();
      return;
    }
    sendMessage();
  });

  // ---------- api ----------

  class ApiError extends Error {
    constructor(status, detail) {
      super('HTTP ' + status);
      this.name = 'ApiError';
      this.status = status;
      this.detail = detail;
    }
  }

  function parseJSONObject(value, what) {
    if (!value || !value.trim()) return {};
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(what + '不是合法的 JSON');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(what + '需要是一个 JSON 对象');
    }
    return parsed;
  }

  function endpointOf(baseUrl) {
    const base = String(baseUrl || '').trim();
    if (!base) throw new Error('请填写接口地址');
    if (/\/chat\/completions(\?|$)/.test(base)) return base;
    return base.replace(/\/+$/, '') + '/chat/completions';
  }

  function headersOf(conf) {
    const headers = { 'Content-Type': 'application/json' };
    const key = String(conf.apiKey || '').trim();
    if (key) headers.Authorization = 'Bearer ' + key;
    Object.assign(headers, parseJSONObject(conf.extraHeaders, '额外请求头'));
    return headers;
  }

  function bodyOf(conf, payload) {
    const body = {
      model: conf.model,
      messages: payload.messages,
      temperature: 0.8,
      stream: Boolean(payload.stream),
      ...parseJSONObject(conf.extraBody, '额外请求体'),
    };
    if (payload.maxTokens) body.max_tokens = payload.maxTokens;
    return body;
  }

  async function readError(res) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* ignore */
    }
    try {
      const json = JSON.parse(text);
      return json.error?.message || json.message || text.slice(0, 300);
    } catch {
      return text.slice(0, 300);
    }
  }

  function friendlyError(err) {
    if (err && err.name === 'AbortError') return '';
    if (err && err.status) {
      if (err.status === 401 || err.status === 403) {
        return '密钥无效、无权限，或该密钥不适用于这个接口。（' + err.status + '）';
      }
      if (err.status === 404) {
        return '接口地址或模型名不对。请核对 Base URL 与模型名称。（404）';
      }
      if (err.status === 429) {
        return '请求过于频繁，或额度已经用尽，稍后再试。（429）';
      }
      if (err.status >= 500) {
        return '服务商暂时不可用，请稍后再试。（' + err.status + '）';
      }
      const detail = err.detail ? '：' + String(err.detail).slice(0, 120) : '';
      return '请求失败（' + err.status + '）' + detail;
    }
    if (err && /Failed to fetch|NetworkError|Load failed|fetch failed/i.test(err.message || '')) {
      return '未能连上服务。请检查网络与 Base URL，或换一家服务商；部分接口不允许浏览器直接访问（跨域）。';
    }
    return (err && err.message) || '出了点问题，请稍后再试。';
  }

  async function streamCompletion(conf, messages, onDelta, signal) {
    const res = await fetch(endpointOf(conf.baseUrl), {
      method: 'POST',
      headers: headersOf(conf),
      body: JSON.stringify(bodyOf(conf, { messages, stream: true })),
      signal,
    });

    if (!res.ok) throw new ApiError(res.status, await readError(res));

    const type = res.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        onDelta(content);
        return;
      }
      throw new Error('模型没有返回文字，请检查模型名或额外请求参数。');
    }

    if (!res.body) throw new Error('当前浏览器不支持流式读取。');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let received = false;

    const handleLine = (raw) => {
      const line = raw.replace(/\r$/, '');
      if (!line.startsWith('data:')) return;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') return;
      let json;
      try {
        json = JSON.parse(payload);
      } catch {
        return;
      }
      if (json.error) {
        throw new ApiError(json.error.code || 0, json.error.message || '流式返回错误');
      }
      const choice = json.choices?.[0];
      const delta = choice?.delta || choice?.message || {};
      let piece = '';
      if (typeof delta.content === 'string') piece = delta.content;
      else if (Array.isArray(delta.content)) piece = delta.content.map((x) => x?.text || '').join('');
      if (piece) {
        received = true;
        onDelta(piece);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        handleLine(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
      if (done) break;
    }
    if (buffer) handleLine(buffer);
    if (!received) {
      throw new Error('模型没有返回文字。若用的是推理模型，请换用对话模型，或在“高级”里关闭思考。');
    }
  }

  function buildSystem(userText, candidates) {
    const parts = [PERSONA, STYLE_PROMPTS[cfg.style] || STYLE_PROMPTS.plain];
    if (state.context) {
      const c = CHAPTERS[state.context - 1];
      parts.push(
        '【眼前】问者正在读《道德经》第' +
          cn(state.context) +
          '章：「' +
          c.text +
          '」。他的问题由此章而起。可应他的问，也可指出他所执之处；不必通篇讲解。'
      );
    }
    const list = candidates
      .map((q, i) => i + 1 + '. 「' + q.text + '」（第' + cn(q.n) + '章）')
      .join('\n');
    parts.push(
      '【本次引文】回答的第一行必须是一句引文，只引一句。从下面三句中原样择一，用「」括起，单独成行；' +
        '不得改写、拼接、压缩，不要写“老子说”，不要标出处，也不要另引别句。\n' +
        list +
        (state.context
          ? '\n若上面三句都不合眼前这一章，也可改引第' + cn(state.context) + '章原文中的一句。'
          : '') +
        '\n\n【其后】空一行，再略作点化：一二十字到七八十字，最多百字上下。只点一层意思，不逐字翻译，不列点，不给步骤，不举一串例子，不把话说满。不要再重复这句引文。'
    );
    return parts.join('\n\n');
  }

  function buildMessages(userText, candidates) {
    const prior = state.messages.slice(0, -1);
    const history = [];
    let chars = 0;
    for (let i = prior.length - 1; i >= 0 && history.length < 12; i -= 1) {
      const m = prior[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (chars + m.content.length > 7000) break;
      history.unshift({ role: m.role, content: m.content });
      chars += m.content.length;
    }
    return [
      { role: 'system', content: buildSystem(userText, candidates) },
      ...history,
      { role: 'user', content: userText },
    ];
  }

  async function sendMessage(presetText) {
    const text = (typeof presetText === 'string' ? presetText : input.value).trim();
    if (!text || state.streaming) return;

    if (!isConfigured()) {
      setError('尚未填写 API 密钥。先接入一个服务商，再来说话。');
      openSettings();
      return;
    }

    setError('');
    input.value = '';
    resizeInput();
    state.messages.push({ role: 'user', content: text });
    persistChat();
    addUserBubble(text);

    const quoteCandidates = pickQuoteCandidates(text);
    const apiMessages = buildMessages(text, quoteCandidates);
    const bubble = addLaoziBubble('', true);
    const body = bubble.querySelector('.msg-body');
    let full = '';
    let first = true;

    state.streaming = true;
    chat.classList.add('is-streaming');
    sendBtn.setAttribute('aria-label', '停止');
    const controller = new AbortController();
    state.abort = controller;

    const conf = {
      ...cfg,
      apiKey: currentKey(),
      baseUrl: cfg.baseUrl,
      model: cfg.model,
    };

    try {
      await streamCompletion(
        conf,
        apiMessages,
        (delta) => {
          full += delta;
          if (first) {
            first = false;
            bubble.classList.remove('is-streaming');
          }
          body.innerHTML = renderRich(full);
          scrollChat(false);
        },
        controller.signal
      );

      if (!full.trim()) throw new Error('模型没有返回文字。');
      const finalText = ensureQuote(full, quoteCandidates);
      state.messages.push({ role: 'assistant', content: finalText });
      persistChat();
      bubble.classList.remove('is-streaming');
      body.innerHTML = renderRich(finalText);
      scrollChat(true);
    } catch (err) {
      bubble.classList.remove('is-streaming');
      if (err.name === 'AbortError') {
        if (full.trim()) {
          state.messages.push({ role: 'assistant', content: full.trim() });
          persistChat();
          body.innerHTML = renderRich(full);
        } else {
          bubble.remove();
        }
      } else {
        bubble.remove();
        setError(friendlyError(err), true);
      }
    } finally {
      state.streaming = false;
      state.abort = null;
      chat.classList.remove('is-streaming');
      sendBtn.setAttribute('aria-label', '发送');
      input.focus({ preventScroll: true });
    }
  }

  retryBtn.addEventListener('click', () => {
    const last = state.messages[state.messages.length - 1];
    if (!last || last.role !== 'user') {
      setError('');
      return;
    }
    state.messages.pop();
    const bubbles = $$('.msg-user', messagesEl);
    bubbles[bubbles.length - 1]?.remove();
    persistChat();
    setError('');
    sendMessage(last.content);
  });

  $('#chat-new').addEventListener('click', () => {
    if (state.streaming) state.abort?.abort();
    if (state.messages.length && !window.confirm('清空与老子的全部对话？')) return;
    state.messages = [];
    state.context = null;
    messagesEl.innerHTML = '';
    contextBar.hidden = true;
    showIntroIfEmpty();
    setError('');
    persistChat();
    input.value = '';
    resizeInput();
    input.focus();
  });

  suggestsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    sendMessage(btn.textContent.trim());
  });

  // ---------- settings ----------

  function buildProviderOptions() {
    const frag = document.createDocumentFragment();
    Object.entries(PROVIDERS).forEach(([id, p]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = p.label;
      frag.append(opt);
    });
    providerSel.append(frag);
  }

  function fillSettings() {
    providerSel.value = cfg.provider;
    baseInput.value = cfg.baseUrl;
    modelInput.value = cfg.model;
    keyInput.value = cfg.keys[cfg.provider] || '';
    styleSel.value = cfg.style;
    extraHeadersInput.value = cfg.extraHeaders;
    extraBodyInput.value = cfg.extraBody;
    setProviderNote();
    setTest('');
  }

  function setTest(msg, kind = '') {
    testStatus.textContent = msg;
    testStatus.className = kind;
  }

  function setProviderNote() {
    const p = PROVIDERS[providerSel.value];
    providerNote.textContent = p ? p.note : '';
  }

  providerSel.addEventListener('change', () => {
    const p = PROVIDERS[providerSel.value];
    if (!p) return;
    baseInput.value = p.base;
    modelInput.value = p.model;
    keyInput.value = cfg.keys[providerSel.value] || '';
    setProviderNote();
    setTest('');
  });

  toggleKeyBtn.addEventListener('click', () => {
    const show = keyInput.type === 'password';
    keyInput.type = show ? 'text' : 'password';
    toggleKeyBtn.textContent = show ? '隐藏' : '显示';
  });

  function openSettings() {
    if (settings.open) return;
    fillSettings();
    settings.showModal();
  }

  $$('[data-open-settings]').forEach((b) => b.addEventListener('click', openSettings));
  $('#settings-close').addEventListener('click', () => settings.close());
  settings.addEventListener('click', (e) => {
    if (e.target === settings) settings.close();
  });

  function readForm() {
    const provider = providerSel.value;
    const baseUrl = baseInput.value.trim();
    const model = modelInput.value.trim();
    const apiKey = keyInput.value.trim();
    const extraHeaders = extraHeadersInput.value.trim();
    const extraBody = extraBodyInput.value.trim();
    if (!baseUrl) {
      setTest('请填写接口地址。', 'err');
      baseInput.focus();
      return null;
    }
    if (!model) {
      setTest('请填写模型名。', 'err');
      modelInput.focus();
      return null;
    }
    try {
      parseJSONObject(extraHeaders, '额外请求头');
      parseJSONObject(extraBody, '额外请求体');
    } catch (err) {
      setTest(err.message, 'err');
      return null;
    }
    return {
      provider,
      baseUrl,
      model,
      apiKey,
      style: styleSel.value,
      extraHeaders,
      extraBody,
    };
  }

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = readForm();
    if (!form) return;
    cfg.provider = form.provider;
    cfg.baseUrl = form.baseUrl;
    cfg.model = form.model;
    cfg.style = form.style;
    cfg.extraHeaders = form.extraHeaders;
    cfg.extraBody = form.extraBody;
    if (form.apiKey) cfg.keys[form.provider] = form.apiKey;
    else delete cfg.keys[form.provider];
    cfg.fontSize = [0, 1, 2].includes(cfg.fontSize) ? cfg.fontSize : 1;
    persistConfig();
    setStatus();
    setError('');
    settings.close();
  });

  $('#test-btn').addEventListener('click', async () => {
    const form = readForm();
    if (!form) return;
    const btn = $('#test-btn');
    btn.disabled = true;
    setTest('正在连接…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(endpointOf(form.baseUrl), {
        method: 'POST',
        headers: headersOf(form),
        body: JSON.stringify(
          bodyOf(form, {
            messages: [{ role: 'user', content: '只回复两个字：善。' }],
            stream: false,
            maxTokens: 24,
          })
        ),
        signal: controller.signal,
      });
      if (!res.ok) throw new ApiError(res.status, await readError(res));
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('连接成功，但模型没有返回内容。');
      setTest('连接成功 · 模型回应：' + String(content).trim().slice(0, 24), 'ok');
    } catch (err) {
      setTest(
        err.name === 'AbortError' ? '连接超时，请检查网络或接口地址。' : friendlyError(err),
        'err'
      );
    } finally {
      clearTimeout(timer);
      btn.disabled = false;
    }
  });

  // ---------- init chat history ----------

  function renderStoredChat() {
    state.messages.forEach((m) => {
      if (m.role === 'user') addUserBubble(m.content);
      else addLaoziBubble(m.content);
    });
    showIntroIfEmpty();
    if (state.context) {
      contextBar.hidden = false;
      contextLabel.textContent = '第' + cn(state.context) + '章';
    }
  }

  function init() {
    buildProviderOptions();
    buildToc();
    renderStoredChat();
    setStatus();
    setStatusVisibility();
    route();
    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', () => {
      head.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });
    head.classList.toggle('scrolled', window.scrollY > 12);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && chat.classList.contains('open')) {
        closeChat();
        return;
      }
      if (chat.classList.contains('open') || settings.open) return;
      if (viewRead.hidden) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && t.matches && t.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft' && state.chapter > 1) navigateChapter(state.chapter - 1);
      if (e.key === 'ArrowRight' && state.chapter < CHAPTERS.length) {
        navigateChapter(state.chapter + 1);
      }
    });
  }

  function setStatusVisibility() {
    if (isConfigured()) chatSetup.hidden = true;
    else chatSetup.hidden = false;
  }

  // expose for debugging? keep the surface minimal
  init();
})();
