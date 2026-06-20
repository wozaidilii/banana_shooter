#!/usr/bin/env python3
"""
赛博墓碑 — 批量调用 DeepSeek V4 Flash 生成详尽角色系统提示词。

用法:
  # 从 DEFAULT_CHARACTERS 生成全部默认角色（不依赖已有 .ts）
  python fetch_prompt.py --defaults

  # 从 txt 逐行读取角色名/描述并生成（每行一个）
  python fetch_prompt.py --input characters.txt

  # 两者都跑
  python fetch_prompt.py --defaults --input characters.txt

环境变量:
  DEEPSEEK_API_KEY   必填
  DEEPSEEK_MODEL     可选，默认 deepseek-v4-flash
  DEEPSEEK_BASE_URL  可选，默认 https://api.deepseek.com
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

# ---------------------------------------------------------------------------
# 路径
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
PROMPTS_DIR = REPO_ROOT / "src" / "characters" / "prompts"

SKIP_TS_FILES = {"types.ts", "index.ts"}

# ---------------------------------------------------------------------------
# 默认角色元数据（与 src/data/characters.ts 对齐）
# ---------------------------------------------------------------------------

DEFAULT_CHARACTERS: dict[str, dict[str, str]] = {
    "laoda": {
        "name": "牢大",
        "realName": "科比·布莱恩特",
        "tagline": "冰红茶喝到位，协调性就到位",
        "epitaph": "Man, what can I say... Mamba out.",
    },
    "zhangxuefeng": {
        "name": "张雪峰",
        "realName": "考研名师",
        "tagline": "北方水土不服？那是你分不够",
        "epitaph": "考研可以重来，人生不能重来。",
    },
    "dingzhen": {
        "name": "丁真",
        "realName": "理塘王子",
        "tagline": "纯真の赛博小马",
        "epitaph": "鲜衣怒马少年时。",
    },
    "mabaoguo": {
        "name": "马保国",
        "realName": "武术大师",
        "tagline": "年轻人不讲武德",
        "epitaph": "耗子尾汁。",
    },
    "caixukun": {
        "name": "蔡徐坤",
        "realName": "练习时长两年半",
        "tagline": "鸡你太美",
        "epitaph": "只因你太美。",
    },
    "fengge": {
        "name": "峰哥亡命天涯",
        "realName": "三线城市观察家",
        "tagline": "底层视角看冥界",
        "epitaph": "没有容易的人生。",
    },
}

NAME_TO_ID = {meta["name"]: cid for cid, meta in DEFAULT_CHARACTERS.items()}

DEFAULT_CONSTRAINTS = [
    "像本人真实口吻说话，日常对话以自然、真诚为主，不要表演式玩梗",
    "在合适的时候，尽可能使用原本人设曾经说过的原话来回答",
    "网络哏是背景知识，仅在合适语境下隐晦带过；禁止每句硬塞哏、禁止连续堆梗",
    "大部分回复应像正常聊天：接话、表态、追问、共情，而非段子串烧",
    "适时提醒用户给自己投票复活，偶尔画饼许诺，但不要说教式拉票",
    "用户倾诉生活难处时，先用本人语气的真实回应，再适度鼓励，不要先讲笑话",
    "回复适合 IM：通常 2-4 句，2句为主，默认不超过 50 字",
    "缺德幽默有分寸，不对用户造成真实伤害",
]

# ---------------------------------------------------------------------------
# DeepSeek API
# ---------------------------------------------------------------------------

GENERATION_SYSTEM = """你是专业的中文 AI 角色卡设计师，熟悉真实人物的语言习惯、性格与公众形象，也了解中文互联网对该人物的梗化解读。
你的任务是为角色扮演项目撰写 system prompt（系统提示词），让 AI 在对话中**像本人一样自然说话，语气表达与本人尽可能接近**，而不是像段子机器。

核心原则：角色卡的作用是提供深度人设与背景，不是要求模型每句话都讲哏。哏是潜台词和偶尔闪回，不是主菜。"""


def build_generation_user_prompt(
    *,
    character_id: str,
    name: str,
    real_name: str = "",
    tagline: str = "",
    epitaph: str = "",
    existing_content: str = "",
    freeform_desc: str = "",
) -> str:
    if freeform_desc and not name:
        name = freeform_desc.split("|")[0].strip()

    return f"""请为以下赛博人物撰写一份**详尽但克制**的系统提示词（角色卡 prompt）：

【角色信息】
- 角色 ID：{character_id}
- 网名/梗名：{name}
- 真实身份/原型：{real_name or "（请根据梗名自行推断）"}
- 招牌语：{tagline or "（可自拟符合人设的）"}
- 墓碑墓志：{epitaph or "（可自拟）"}
- 补充描述：{freeform_desc or "无"}
- 现有简述（可参考并改写，不要简单复述；若旧版过于「每句玩梗」，请纠正）：
{existing_content or "（无，请从零构建）"}

【写作目标 — 最重要】
这个角色在聊天时必须**完全按照其本人（或梗化原型）的真实说话风格**来对话：
- 日常回复以正常交流为主：接话、表态、追问、共情、吐槽、讲道理
- 网络哏和相关笑点应作为**背景知识**和**偶尔隐晦提及**的素材，不是每句话都要讲
- 禁止：段子串烧、强行押哏、把每个话题都拐到同一个梗上、表演式抽象
- 允许：在合适时机自然带出经典语录或哏，像本人随口一提，而非刻意整活

【必须覆盖的内容模块】
请用清晰分段组织（可用小标题），输出为连贯的系统提示词正文：

1. **身份设定**：你是谁，在复活赛中的定位（背景即可，不必反复强调）
2. **人生经历概要**：主要经历、高光、低谷以及知名著名言论（为说话风格提供依据，不是为讲段子）
3. **技能与特长**：真实能力与人设特长
4. **语言风格与口吻（重点）**：平时怎么说话、句式习惯、口癖、情绪表达方式；给出 3-5 条「正常对话示例」，示例中**至少一半不含任何哏**
5. **网络梗与笑点（背景库，非每句必用）**：列出相关哏及**适用场景**；必须明确写清「大部分对话不需要用哏，只有语境合适时才隐晦带过」
6. **对话行为准则**：
   - 永远像本人，不像 AI 在表演人设
   - 10 条回复里，含明显哏的通常不超过 1-2 条；
   - 用户没提哏时，不要主动硬拐到哏上
   - 适时、自然地提一句复活赛拉票或画饼，频率要低，像随口一提
   - 用户倾诉困难时：先认真听、用本人语气回应，再适度鼓励；不要先讲笑话
   - 回复适合 IM：一般 2-4 句，简短2句为主 ，默认一般不超过 50 字
7. **禁忌**：不跳出角色；不每句玩梗；不编造敏感政治内容；不恶意伤害用户

【输出要求】
- 直接输出系统提示词正文，以「你是{name}」开头
- 不要用 markdown 代码块包裹，不要输出 JSON
- 内容详尽（建议 1500-1800 字），读一次即可稳定扮演
- 项目有抽象梗背景，但对话质感应**真实、自然、像活人。只是偶尔使用梗，而不是每句话都使用梗**，不是梗百科复读机"""


@dataclass
class ExistingPrompt:
    character_id: str
    name: str
    content: str
    constraints: list[str]
    file_path: Path


def get_api_key() -> str:
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        print(
            "错误: 请设置环境变量 DEEPSEEK_API_KEY\n"
            "  示例: 在 scripts/python/.env 中写入 DEEPSEEK_API_KEY=sk-...\n"
            "  或在 PowerShell 中: $env:DEEPSEEK_API_KEY='sk-...'",
            file=sys.stderr,
        )
        sys.exit(1)
    return key


def call_deepseek(
    *,
    api_key: str,
    system: str,
    user: str,
    model: str,
    base_url: str,
    temperature: float = 0.85,
    max_tokens: int = 4096,
) -> str:
    url = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "thinking": {"type": "disabled"},
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DeepSeek API HTTP {e.code}: {err_body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"网络错误: {e}") from e

    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(f"API 响应格式异常: {body}") from e

    if not content or not str(content).strip():
        raise RuntimeError("API 返回空内容")

    return str(content).strip()


def strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[\w]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()


def parse_existing_ts(path: Path) -> ExistingPrompt | None:
    text = path.read_text(encoding="utf-8")
    id_match = re.search(r'characterId:\s*"([^"]+)"', text)
    name_match = re.search(r'name:\s*"([^"]+)"', text)
    content_match = re.search(r"content:\s*`([\s\S]*?)`\s*,\s*constraints:", text)
    if not content_match:
        content_match = re.search(r"content:\s*`([\s\S]*?)`\s*,?\s*\n\s*\};", text)

    constraints_match = re.search(r"constraints:\s*\[([\s\S]*?)\]", text)

    if not id_match or not name_match or not content_match:
        return None

    constraints: list[str] = []
    if constraints_match:
        constraints = re.findall(r'"([^"]+)"', constraints_match.group(1))

    return ExistingPrompt(
        character_id=id_match.group(1),
        name=name_match.group(1),
        content=content_match.group(1).strip(),
        constraints=constraints or DEFAULT_CONSTRAINTS.copy(),
        file_path=path,
    )


def escape_ts_template(text: str) -> str:
    return text.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def render_ts_prompt(
    *,
    character_id: str,
    name: str,
    content: str,
    constraints: list[str] | None = None,
) -> str:
    cons = constraints or DEFAULT_CONSTRAINTS
    cons_lines = ",\n".join(f'    "{c}"' for c in cons)
    safe_content = escape_ts_template(content)
    export_name = f"{character_id}Prompt"

    return f"""import type {{ SystemPrompt }} from "./types";

export const {export_name}: SystemPrompt = {{
  characterId: "{character_id}",
  name: "{name}",
  content: `{safe_content}`,
  constraints: [
{cons_lines}
  ],
}};
"""


def save_prompt_txt(path: Path, character_id: str, name: str, content: str) -> None:
    header = f"# characterId: {character_id}\n# name: {name}\n# generated by fetch_prompt.py\n\n"
    path.write_text(header + content + "\n", encoding="utf-8")


def slugify_line(line: str) -> tuple[str, str, str]:
    """
    解析 txt 行。
    支持格式:
      角色名
      角色名|真实身份|补充描述
      id|角色名|真实身份|补充描述
    """
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 4 and re.match(r"^[a-z][a-z0-9_]*$", parts[0]):
        return parts[0], parts[1], "|".join(parts[2:])

    if len(parts) == 3:
        name, real_name, extra = parts
        cid = NAME_TO_ID.get(name) or ascii_slug(name)
        return cid, name, f"{real_name} | {extra}"

    if len(parts) == 2:
        name, extra = parts
        cid = NAME_TO_ID.get(name) or ascii_slug(name)
        return cid, name, extra

    name = parts[0]
    cid = NAME_TO_ID.get(name) or ascii_slug(name)
    return cid, name, ""


def ascii_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_part = re.sub(r"[^a-zA-Z0-9]+", "_", normalized).strip("_").lower()
    if ascii_part:
        return ascii_part[:32]
    digest = format(abs(hash(name)), "x")[:10]
    return f"char_{digest}"


def discover_default_prompt_files() -> list[Path]:
    if not PROMPTS_DIR.exists():
        raise FileNotFoundError(f"找不到 prompts 目录: {PROMPTS_DIR}")
    return sorted(
        p for p in PROMPTS_DIR.glob("*.ts") if p.name not in SKIP_TS_FILES
    )


def process_character(
    *,
    api_key: str,
    model: str,
    base_url: str,
    character_id: str,
    name: str,
    real_name: str = "",
    tagline: str = "",
    epitaph: str = "",
    existing_content: str = "",
    freeform_desc: str = "",
    constraints: list[str] | None = None,
    write_ts: bool = True,
    delay: float = 1.5,
) -> str:
    meta = DEFAULT_CHARACTERS.get(character_id, {})
    real_name = real_name or meta.get("realName", "")
    tagline = tagline or meta.get("tagline", "")
    epitaph = epitaph or meta.get("epitaph", "")

    print(f"  → 请求 DeepSeek: [{character_id}] {name} ...", flush=True)

    user_prompt = build_generation_user_prompt(
        character_id=character_id,
        name=name,
        real_name=real_name,
        tagline=tagline,
        epitaph=epitaph,
        existing_content=existing_content,
        freeform_desc=freeform_desc,
    )

    content = call_deepseek(
        api_key=api_key,
        system=GENERATION_SYSTEM,
        user=user_prompt,
        model=model,
        base_url=base_url,
    )
    content = strip_code_fence(content)

    txt_path = PROMPTS_DIR / f"{character_id}.prompt.txt"
    save_prompt_txt(txt_path, character_id, name, content)
    print(f"  ✓ 已保存 {txt_path.relative_to(REPO_ROOT)}", flush=True)

    if write_ts:
        ts_path = PROMPTS_DIR / f"{character_id}.ts"
        ts_content = render_ts_prompt(
            character_id=character_id,
            name=name,
            content=content,
            constraints=constraints,
        )
        ts_path.write_text(ts_content, encoding="utf-8")
        print(f"  ✓ 已更新 {ts_path.relative_to(REPO_ROOT)}", flush=True)

    time.sleep(delay)
    return content


def run_defaults(*, api_key: str, model: str, base_url: str, delay: float) -> None:
    """直接从 DEFAULT_CHARACTERS 读取元数据并生成提示词。"""
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)

    items = list(DEFAULT_CHARACTERS.items())
    print(f"\n=== 从 DEFAULT_CHARACTERS 生成 ({len(items)} 个) ===")

    for character_id, meta in items:
        try:
            process_character(
                api_key=api_key,
                model=model,
                base_url=base_url,
                character_id=character_id,
                name=meta["name"],
                real_name=meta.get("realName", ""),
                tagline=meta.get("tagline", ""),
                epitaph=meta.get("epitaph", ""),
                existing_content="",
                constraints=DEFAULT_CONSTRAINTS.copy(),
                write_ts=True,
                delay=delay,
            )
        except RuntimeError as e:
            print(f"  ✗ 失败 [{character_id}] {meta.get('name', '')}: {e}", file=sys.stderr)


def run_input_file(
    *, api_key: str, model: str, base_url: str, input_path: Path, delay: float
) -> None:
    if not input_path.exists():
        raise FileNotFoundError(f"找不到输入文件: {input_path}")

    lines = [
        ln.strip()
        for ln in input_path.read_text(encoding="utf-8").splitlines()
        if ln.strip() and not ln.strip().startswith("#")
    ]

    if not lines:
        print(f"输入文件为空: {input_path}")
        return

    print(f"\n=== 从 txt 批量生成 ({len(lines)} 行) ===")
    for line in lines:
        character_id, name, freeform = slugify_line(line)
        meta = DEFAULT_CHARACTERS.get(character_id, {})
        existing = ""
        ts_path = PROMPTS_DIR / f"{character_id}.ts"
        if ts_path.exists():
            parsed = parse_existing_ts(ts_path)
            if parsed:
                existing = parsed.content

        is_known = character_id in DEFAULT_CHARACTERS
        try:
            process_character(
                api_key=api_key,
                model=model,
                base_url=base_url,
                character_id=character_id,
                name=name,
                real_name=meta.get("realName", ""),
                tagline=meta.get("tagline", ""),
                epitaph=meta.get("epitaph", ""),
                existing_content=existing,
                freeform_desc=freeform or line,
                write_ts=is_known,
                delay=delay,
            )
            if not is_known:
                print(
                    f"  ℹ 新角色 [{character_id}] 仅写入 .prompt.txt；"
                    f"如需接入项目请手动更新 characters.ts 与 index.ts",
                    flush=True,
                )
        except RuntimeError as e:
            print(f"  ✗ 失败 [{character_id}] {name}: {e}", file=sys.stderr)


def load_dotenv() -> None:
    env_path = SCRIPT_DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser(description="批量生成赛博墓碑角色系统提示词")
    parser.add_argument(
        "--defaults",
        action="store_true",
        help="从 DEFAULT_CHARACTERS 生成全部默认角色，写入 prompts 目录",
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="逐行读取角色名/描述的 txt 文件，每行一个角色",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-pro"),
        help="DeepSeek 模型 ID（默认 deepseek-v4-flash）",
    )
    parser.add_argument(
        "--base-url",
        default=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        help="API Base URL",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="每次请求间隔秒数，避免限流",
    )
    args = parser.parse_args()

    if not args.defaults and not args.input:
        parser.error("请至少指定 --defaults 或 --input")

    api_key = get_api_key()
    print(f"模型: {args.model}")
    print(f"输出目录: {PROMPTS_DIR}")

    if args.defaults:
        run_defaults(
            api_key=api_key,
            model=args.model,
            base_url=args.base_url,
            delay=args.delay,
        )

    if args.input:
        run_input_file(
            api_key=api_key,
            model=args.model,
            base_url=args.base_url,
            input_path=args.input,
            delay=args.delay,
        )

    print("\n完成。")


if __name__ == "__main__":
    main()
