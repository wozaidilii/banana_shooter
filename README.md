# 赛博墓碑 · Cyber Tombstone

> 人物复活投票 + AI亡灵对话 + 梗图皮肤共创 + 专属称号激励

基于 **T3 Stack**（Next.js + TypeScript + tRPC + Tailwind CSS）构建的赛博梗文化实验品。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript（全项目，无传统 JavaScript 业务代码） |
| API | tRPC（类型安全，预留 LLM 服务端代理） |
| 样式 | Tailwind CSS + 赛博朋克自定义 CSS |
| 持久化 | localStorage（客户端） |

## 项目结构

```
src/
├── app/                    # Next.js App Router
├── characters/
│   ├── dialogue/           # 人物对话配置（关键词、兜底、引擎设置）
│   └── prompts/            # 系统提示词（供 LLM API 接入）
├── components/             # React UI 组件
├── data/                   # 角色元数据、称号、皮肤模板
├── lib/                    # 投票、皮肤、存储逻辑
├── server/api/             # tRPC 路由（含 chat 代理）
└── trpc/                   # tRPC 客户端配置
```

### 赛博人物目录说明

- **`src/characters/dialogue/`** — 对话引擎、关键词回复、兜底话术、开场白、打字延迟等配置
- **`src/characters/prompts/`** — 每个角色独立的 system prompt，下一步接入 LLM 时直接引用

## 本地开发

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

## 构建与部署

```bash
npm run build
npm start
```

项目配置为 Vercel 部署（Next.js 框架）。

## LLM API 接入

### 方式一：客户端直连

在浏览器控制台或页面脚本中配置：

```typescript
window.CYBER_TOMB_API = {
  endpoint: "https://your-api.com/chat",
  key: "your-api-key",
};
```

### 方式二：tRPC 服务端代理（推荐）

在 `.env` 中配置：

```env
LLM_API_ENDPOINT=https://your-api.com/chat
LLM_API_KEY=your-api-key
```

客户端可通过 tRPC `chat.generateReply` 调用，避免暴露 API Key。

### 修改系统提示词

编辑 `src/characters/prompts/` 下对应角色的 `.ts` 文件即可。

## 调试

```js
window.__cyberTomb.navigate("vote")
window.__cyberTomb.getLeaderboard()
```

---

*抽象梗文化实验品 · 仅供娱乐*
