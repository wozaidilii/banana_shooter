# 赛博墓碑 · Cyber Tombstone

> 人物复活投票 + AI亡灵对话 + 梗图皮肤共创 + 专属称号激励

把「赛博墓碑」做成一个带有黑色幽默和抽象梗文化的病毒式传播产品。

## 核心玩法

### ⚡ 复活赛投票
- 带倒计时的复活赛，**2026年7月31日**截止
- 投票决定哪些赛博人物能够「复活」
- 初始英雄：**牢大**、**张雪峰**、丁真、马保国、蔡徐坤、峰哥亡命天涯

### 💬 AI 亡灵对话
- 每个人物配有完整人设和关键词回复库
- 聊天内容贴合人物身份、视角、语气
- 支持接入真实 LLM API（见下方配置）

### 🎨 梗图皮肤共创
- 官方提供冰红茶战神、考研圣体等初始皮肤方向
- 用户可自由上传创作史诗级抽象皮肤
- 点赞互动，出圈赢称号

### 👑 称号奖励
- 冥界选民、梗图炼金术士、史诗级造梗王、官方认证抽象大师……
- 稀缺头衔满足成就感和参与感

## 本地开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 启动本地服务
npm run dev
# 打开 http://127.0.0.1:5174/
```

开发时可直接用 ES Module 方式调试（需本地服务器）。

## 部署

项目配置为 Vercel 静态部署，`npm run build` 输出到 `public/` 目录。

## LLM API 接入（可选）

在页面加载前配置：

```html
<script>
  window.CYBER_TOMB_API = {
    endpoint: "https://your-api.com/chat",
    key: "your-api-key"
  };
</script>
```

未配置时使用内置人设模板引擎。

## 技术栈

- 原生 HTML / CSS / JavaScript
- esbuild 打包
- localStorage 本地持久化
- Vercel 静态托管

## 后续扩展

- [ ] 复活赛第二季 / 第三季
- [ ] 皮肤合成系统
- [ ] 成就系统
- [ ] 复活名人堂
- [ ] 后端 API + 真实投票统计
- [ ] 用户登录与社交分享

## 调试

```js
// 浏览器控制台
window.__cyberTomb.navigate("vote")
window.__cyberTomb.getLeaderboard()
```

---

*抽象梗文化实验品 · 仅供娱乐*
