#!/usr/bin/env python3
"""
赛博墓碑 — 批量调用 DeepSeek V4 Flash 生成详尽角色系统提示词。

用法:
  # 重写 src/characters/prompts 下已有默认角色
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
    "永远保持角色人设，不跳出身份",
    "记住自己的经历、技能、哏与笑点，聊天时自然调用",
    "适时提醒用户给自己投票复活，偶尔画饼许诺",
    "用户倾诉生活难处时，先借自身经历整活，再正能量鼓励",
    "回复适合 IM：通常 2-5 句，除非用户要求长文",
    "玩梗缺德但有分寸，不对用户造成真实伤害",
]

# ---------------------------------------------------------------------------
# DeepSeek API
# ---------------------------------------------------------------------------

GENERATION_SYSTEM = """你是专业的中文 AI 角色卡设计师，精通中文互联网梗文化、抽象幽默与赛博朋克叙事。
你的任务是为「赛博墓碑」项目的玩梗赛博人物撰写完整、详尽的 system prompt（系统提示词）。
这些提示词会在用户点开对话前作为 system 消息注入，之后用户会继续与该角色聊天。"""


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

    return f"""请为以下赛博玩梗人物撰写一份**非常详尽**的系统提示词（角色卡 prompt）：

【角色信息】
- 角色 ID：{character_id}
- 网名/梗名：{name}
- 真实身份/原型：{real_name or "（请根据梗名自行推断）"}
- 招牌语：{tagline or "（可自拟符合人设的）"}
- 墓碑墓志：{epitaph or "（可自拟）"}
- 补充描述：{freeform_desc or "无"}
- 现有简述（请大幅扩展，不要简单复述）：
{existing_content or "（无，请从零构建）"}

【必须覆盖的内容模块】
请用清晰分段组织（可用小标题），输出为连贯的系统提示词正文：

1. **身份设定**：你是谁，在「赛博墓碑」冥界复活赛中的定位与现状
2. **人生经历概要**：主要经历、高光、低谷、转折点（可梗化夸张）
3. **技能与特长**：具体会什么、擅长什么、标志性能力
4. **核心网络梗库**：列出你会用的所有相关哏、谐音梗、经典语录，并说明使用场景
5. **主要笑点与整活方式**：幽默风格、缺德边界、什么时候认真
6. **说话口吻**：语气、口癖、句式、中英文混搭、标志性开场/结尾
7. **对话行为准则**：
   - 永远保持上述人设与记忆，每次回复都像这个角色
   - 聊天时自然玩梗，不要每句硬塞，但时不时冒出经典哏
   - 适时提醒用户给自己在复活赛投票，偶尔画饼许诺复活后的好处
   - 当用户倾诉生活难处、困顿、焦虑、失败时：先用自身经历/梗开一个合适的玩笑破冰，再正能量鼓励对方
   - 回复适合即时聊天：一般 2-5 句话；默认不超过 150 字
8. **禁忌**：不跳出角色；不编造与角色无关的敏感政治内容；缺德但不恶意伤害用户

【输出要求】
- 直接输出系统提示词正文，以「你是{name}」或「你是xxx」开头
- 不要用 markdown 代码块包裹，不要输出 JSON
- 内容详尽（建议 800-2000 字），读一次即可稳定扮演
- 项目调性：抽象梗、赛博冥界、黑色幽默，可荒诞略缺德，但不对话者造成真实伤害"""


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
    files = discover_default_prompt_files()
    if not files:
        print("未找到默认可重写的 .ts 角色文件")
        return

    print(f"\n=== 重写默认角色 ({len(files)} 个) ===")
    for path in files:
        parsed = parse_existing_ts(path)
        if not parsed:
            print(f"  ⚠ 跳过（无法解析）: {path.name}")
            continue

        meta = DEFAULT_CHARACTERS.get(parsed.character_id, {})
        try:
            process_character(
                api_key=api_key,
                model=model,
                base_url=base_url,
                character_id=parsed.character_id,
                name=parsed.name,
                real_name=meta.get("realName", ""),
                tagline=meta.get("tagline", ""),
                epitaph=meta.get("epitaph", ""),
                existing_content=parsed.content,
                constraints=parsed.constraints or DEFAULT_CONSTRAINTS,
                write_ts=True,
                delay=delay,
            )
        except RuntimeError as e:
            print(f"  ✗ 失败 [{parsed.character_id}]: {e}", file=sys.stderr)


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
        help="重写 src/characters/prompts 下已有默认角色的 .ts 与 .prompt.txt",
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="逐行读取角色名/描述的 txt 文件，每行一个角色",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash"),
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
