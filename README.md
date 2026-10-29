# 老子 · 道德经

> 道可道，非常道；名可名，非常名。

一个安静的《道德经》阅读页，也可以和「老子」说几句话。

**在线**　<https://ohhhqz-star.github.io/laozi/>  
**全文**　[道德经.md](道德经.md)（八十一章，六千余言）

![首页](docs/preview.jpg)

![与老子对话](docs/chat.jpg)

---

## 这是什么

- **一份整理好的《道德经》**：八十一章全文，简体、现代标点，附目录与「关于此本」说明。
- **一个纯静态网页**：无框架、无构建依赖、无 CDN、无第三方字体与统计。全部资源都在仓库里，国内网络可直接打开。
- **一次对话**：填入任意 OpenAI 兼容接口的密钥，就能向「老子」提问。请求从浏览器直接发往所选服务商，支持流式输出、停止、重试与多轮对话。
- **一个引文约束**：每一答，先引一句经文，再略说几句。不是随机抽签，也不是把整章译文贴给你。

## 页面

| 页面 | 能做什么 |
| --- | --- |
| 首页 | 水墨老子像、今日一句、开卷或问道 |
| 经文 | 八十一章、全文搜索、字号切换、复制本章、键盘左右翻章 |
| 问道 | 多轮对话、流式输出、停止/重试/新对话；可把当前章带入对话 |
| 设置 | 15 个服务商预设、自定义接口、三种语气、额外请求头与参数 |

移动端另有横向章目条；打印时只留正文。

## 每一答，先引一句经文

这是这个项目最在意的一件事。

1. 从正文中整理出 **55 句**可用经文，逐字校验，确保每一句都是原文的完整子串。
2. 提问时按关键词、当前阅读章节与上一轮引文打分：相关者优先，刚引过的不重复，当前章加权。
3. 取三句候选写进系统提示，要求模型**只引一句、原样引用、单独成行、不加「老子说」、不标出处**。
4. 其后只作一点化：一二十字到七八十字，只点一层意思，不逐字翻译，不列点，不把话说满。
5. 若模型没有遵守，前端会自动补上第一句候选，保证形式不破。

一段示意：

> **问**：最近很焦虑，夜里总是醒。
>
> **老子**：「致虚极，守静笃。」
>
> 心像一盆水，搅久了就浑。先不搅，让它自己澄一会儿。

引文是原文；阐释由模型生成，刻意留白，不是学术注解。

## 接入模型

打开「设置」，选服务商，填密钥，保存并测试即可。所有请求都发往 OpenAI 兼容的 `/chat/completions`，按 SSE 流式读回。

| 服务商 | 预设 Base URL | 默认模型 | 浏览器直连 |
| --- | --- | --- | --- |
| DeepSeek 深度求索 | `https://api.deepseek.com/v1` | `deepseek-chat` | 可以 |
| Kimi · 月之暗面 | `https://api.moonshot.cn/v1` | `kimi-latest` | 可以 |
| 通义千问 · 阿里云 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | 可以 |
| 百度千帆 · 文心 | `https://qianfan.baidubce.com/v2` | `ernie-4.5-turbo-128k` | 可以 |
| 硅基流动 | `https://api.siliconflow.cn/v1` | `deepseek-ai/DeepSeek-V3.2-Exp` | 可以 |
| MiniMax | `https://api.minimaxi.com/v1` | `MiniMax-M2` | 可以 |
| 百川智能 | `https://api.baichuan-ai.com/v1` | `Baichuan4` | 可以 |
| 阶跃星辰 | `https://api.stepfun.com/v1` | `step-2-16k` | 可以 |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | 需转发 |
| 豆包 · 火山方舟 | `https://ark.cn-beijing.volces.com/api/v3` | `doubao-seed-1-6-250615` | 视接口而定 |
| 腾讯混元 | `https://api.hunyuan.cloud.tencent.com/v1` | `hunyuan-turbos-latest` | 需转发 |
| 讯飞星火 | `https://spark-api-open.xf-yun.com/v1` | `generalv3.5` | 需转发 |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | 境外，通常需转发 |
| Ollama · 本地 | `http://localhost:11434/v1` | `qwen2.5:7b` | 本机 |
| 自定义 | 任意兼容接口 | 自填 | 视接口而定 |

「需转发」不是密钥或网络的问题，而是这些厂商的官方接口没有给出浏览器可用的 CORS 响应。仓库内置了一个不依赖第三方库的小转发，见下一节。模型名更新很快，若提示不存在，请以服务商控制台为准。

## 自建转发（可选）

`server/proxy.mjs` 是一个极简的 OpenAI 兼容转发，需要 Node.js 18+，没有依赖。

```bash
node server/proxy.mjs
# 转发已启动：http://127.0.0.1:8787
```

然后把 Base URL 写成「转发地址 + 原接口地址」：

```text
http://127.0.0.1:8787/https://open.bigmodel.cn/api/paas/v4
```

网页会自动补上 `/chat/completions`。转发只做路径解析与流式透传，不记录密钥。

可用的环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8787` | 监听端口 |
| `ALLOW_ORIGIN` | `*` | 允许的网页来源，公开部署时建议改成你的站点 |
| `PROXY_TOKEN` | 空 | 设置后，请求须带 `x-proxy-token` 头（可在「高级」里加） |
| `ALLOW_EXTRA_HOSTS` | 空 | 额外允许的域名，逗号分隔 |

已有的保护：只允许 `https:443`、内置域名白名单、请求体不超过 2MB、180 秒超时。若要放到公网，请置于 HTTPS 反向代理之后，并同时设置 `ALLOW_ORIGIN` 与 `PROXY_TOKEN`，不要留下一个谁都能用的开放代理。

## 本地运行

```bash
git clone https://github.com/ohhhqz-star/laozi.git
cd laozi
python3 -m http.server 8000
```

打开 <http://localhost:8000/>。

- 仅阅读时，直接双击 `index.html` 也可以（脚本是普通脚本，不依赖模块服务器）。
- 对话建议用 `http://localhost` 打开；部分浏览器与接口对 `file://` 来源的限制更严。

重新生成全文与网页数据（只改 `data/daodejing.json`，不要手改生成物）：

```bash
node scripts/build.mjs   # 生成 assets/js/data.js 与 道德经.md
```

## 文本与校勘

- **底本**：王弼《老子道德经注》本；参校通行本。
- **规模**：八十一章，6433 字（含标点）。
- **体例**：简体字、现代标点；每章独立成节，章次一仍其旧。
- **径改**：明显的讹字、异体字与羼入的重复句直接改正，不另出校记。例如第九章「揣而棁之」改为「揣而锐之」，第二十八章「谿」作「溪」，第四十五章删去重复的「其用不……」，第五十八章「燿」作「耀」，第七十三章「𦈎然」作「繟然」。
- **来源**：正文据维基文库王弼本整理，并与通行本对读。

《道德经》文本属公有领域。引文逐字取自正文；对话中的阐释是模型生成的个人化解读，不代表唯一的读法。

## 项目结构

```text
.
├── index.html              页面
├── assets/
│   ├── css/style.css       版式
│   ├── js/app.js           阅读、目录、对话、设置
│   ├── js/data.js          由 JSON 生成，勿手改
│   └── img/                老子像、头像、分享图、图标
├── data/daodejing.json     八十一章正文（唯一数据源）
├── scripts/build.mjs       生成 data.js 与 道德经.md
├── server/proxy.mjs        可选转发
├── docs/                   README 配图
├── 道德经.md               整理版全文
└── .github/workflows/      自动发布 GitHub Pages
```

## 部署

推送到 `main` 后，GitHub Actions 会重新生成全文，并把 `index.html` 与 `assets/` 发布到 Pages。仓库的 Pages 来源需设为 **GitHub Actions**。

也可以部署到任意静态托管：运行时只需要 `index.html` 与 `assets/`，不需要 Node.js、数据库或环境变量。

## 隐私

- 密钥保存在浏览器 `localStorage`，只随请求发往你选择的服务商（或你自己的转发），不会进入仓库，也不会经过本项目作者的服务器。
- 对话记录同样只在本机浏览器里，可随时「新对话」清空。
- 页面不加载外部字体、脚本、图片或统计代码。
- 在公用电脑上使用后，请清空站点数据。

## 许可

代码、版式与整理文本以 [MIT](LICENSE) 许可开源。《道德经》原文属公有领域。老子像由 AI 生成，可自由替换。

---

> 知足不辱，知止不殆，可以长久。
