#!/usr/bin/env python3
"""
使用 edge-tts 将笔记文本保存成 mp3。

用法示例：
1. 读文件转语音
   python scripts/edge_tts_notes.py --input 001projects/BioNote/1BioNote.md --output 1BioNote.mp3

2. 直接传文本
   python scripts/edge_tts_notes.py --text "你好，这是测试语音" --output test.mp3

3. 指定音色和语速
   python scripts/edge_tts_notes.py --input 001projects/BioNote/1BioNote.md --voice zh-CN-XiaoxiaoNeural --rate +10%

4. 按 Markdown 标题拆分多个 mp3
   python scripts/edge_tts_notes.py --input 001projects/BioNote/1BioNote.md --output out/BioNote.mp3 --split-by-heading
"""

from __future__ import annotations

import argparse
import asyncio
import subprocess
import re
from pathlib import Path

import edge_tts


DEFAULT_VOICE = "zh-CN-YunxiNeural"
DEFAULT_RATE = "+0%"
MAX_SEGMENT_CHARS = 2800
DEFAULT_INPUT_PATH = Path("/Users/fuying/01projects/frontend-notes/001projects/BioNote/1BioNote.md")
DEFAULT_OUTPUT_PATH = Path("/Users/fuying/01projects/frontend-notes/output.mp3")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="使用 edge-tts 将笔记转成 mp3。"
    )
    parser.add_argument(
        "--input",
        type=str,
        help="输入文件路径，支持 .md / .txt 等文本文件。",
    )
    parser.add_argument(
        "--text",
        type=str,
        help="直接传入要转语音的文本。",
    )
    parser.add_argument(
        "--output",
        type=str,
        help=f"输出 mp3 文件路径。默认 {DEFAULT_OUTPUT_PATH}",
    )
    parser.add_argument(
        "--voice",
        type=str,
        default=DEFAULT_VOICE,
        help=f"音色，默认 {DEFAULT_VOICE}",
    )
    parser.add_argument(
        "--rate",
        type=str,
        default=DEFAULT_RATE,
        help='语速，例如 "+10%%"、"-20%%"',
    )
    parser.add_argument(
        "--keep-markdown",
        action="store_true",
        help="默认会简单清洗 Markdown 标记；加上这个参数则保留原文。",
    )
    parser.add_argument(
        "--play",
        action="store_true",
        help="生成完成后自动播放音频（macOS 下使用 afplay）。",
    )
    parser.add_argument(
        "--split-by-heading",
        action="store_true",
        help="按 Markdown 标题拆分多个 mp3 文件，适合长笔记。",
    )
    parser.add_argument(
        "--heading-level",
        type=int,
        default=3,
        help="按几级标题拆分，默认 3，表示会按 ### 这一层拆分。",
    )
    return parser.parse_args()


def load_text(input_path: str | None, inline_text: str | None) -> str:
    if inline_text:
        return inline_text.strip()
    if input_path:
        return Path(input_path).read_text(encoding="utf-8").strip()
    if DEFAULT_INPUT_PATH.exists():
        return DEFAULT_INPUT_PATH.read_text(encoding="utf-8").strip()
    raise ValueError(f"未找到默认输入文件：{DEFAULT_INPUT_PATH}")


def clean_markdown(text: str) -> str:
    # 去掉代码块，避免把大量符号和代码逐字念出来。
    text = re.sub(r"```[\s\S]*?```", "\n", text)
    # 行内代码去掉反引号，保留内容本身。
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # 标题和列表符号做轻量清洗，保留正文。
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r">\s*", "", text)
    # 压缩多余空行，避免停顿过碎。
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def slugify_filename(text: str) -> str:
    text = text.strip()
    text = re.sub(r"[\\/:*?\"<>|]+", "-", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-") or "part"


def split_markdown_by_heading(text: str, heading_level: int) -> list[tuple[str, str]]:
    lines = text.splitlines()
    marker = "#" * max(1, heading_level)
    pattern = re.compile(rf"^\s*{re.escape(marker)}\s+(.+?)\s*$")

    sections: list[tuple[str, list[str]]] = []
    current_title = "preface"
    current_lines: list[str] = []

    for line in lines:
        match = pattern.match(line)
        if match:
            if current_lines:
                sections.append((current_title, current_lines))
            current_title = match.group(1).strip()
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_title, current_lines))

    result: list[tuple[str, str]] = []
    for title, section_lines in sections:
        body = "\n".join(section_lines).strip()
        if body:
            result.append((title, body))
    return result


def split_text(text: str, max_chars: int = MAX_SEGMENT_CHARS) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    paragraphs = [item.strip() for item in text.split("\n\n") if item.strip()]
    segments: list[str] = []
    current = ""

    for paragraph in paragraphs:
        # 单段过长时，再按句号、问号、感叹号切分。
        chunks = split_long_paragraph(paragraph, max_chars)
        for chunk in chunks:
            if not current:
                current = chunk
                continue

            candidate = f"{current}\n\n{chunk}"
            if len(candidate) <= max_chars:
                current = candidate
            else:
                segments.append(current)
                current = chunk

    if current:
        segments.append(current)
    return segments


def split_long_paragraph(paragraph: str, max_chars: int) -> list[str]:
    if len(paragraph) <= max_chars:
        return [paragraph]

    parts = re.split(r"(?<=[。！？!?；;])", paragraph)
    result: list[str] = []
    current = ""

    for part in parts:
        if not part:
            continue
        if len(part) > max_chars:
            # 实在太长时，按固定长度硬切，保证一定能处理。
            if current:
                result.append(current)
                current = ""
            for i in range(0, len(part), max_chars):
                result.append(part[i : i + max_chars])
            continue

        candidate = current + part
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                result.append(current)
            current = part

    if current:
        result.append(current)
    return result


async def synthesize_to_mp3(
    text: str,
    output_path: Path,
    voice: str,
    rate: str,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    segments = split_text(text)

    # 用 stream 逐段写入同一个 mp3 文件，适合长笔记。
    with output_path.open("wb") as fp:
        for index, segment in enumerate(segments, start=1):
            communicate = edge_tts.Communicate(segment, voice=voice, rate=rate)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    fp.write(chunk["data"])
            print(f"[{index}/{len(segments)}] 已完成一段语音合成")


def build_split_output_path(base_output: Path, index: int, title: str) -> Path:
    folder = base_output.parent / base_output.stem
    filename = f"{index:02d}-{slugify_filename(title)}.mp3"
    return folder / filename


def play_audio(output_path: Path) -> None:
    try:
        subprocess.run(["afplay", str(output_path)], check=True)
    except FileNotFoundError:
        print("未找到 afplay，无法自动播放。你可以手动打开该 mp3。")
    except subprocess.CalledProcessError:
        print("音频已生成，但自动播放失败。")


def main() -> None:
    args = parse_args()
    raw_text = load_text(args.input, args.text)
    final_text = raw_text if args.keep_markdown else clean_markdown(raw_text)

    if not final_text:
        raise ValueError("输入内容为空，无法生成语音")

    output_path = Path(args.output) if args.output else DEFAULT_OUTPUT_PATH

    if args.split_by_heading:
        if not args.input:
            raise ValueError("--split-by-heading 需要配合 --input 使用")

        sections = split_markdown_by_heading(raw_text, args.heading_level)
        if not sections:
            raise ValueError("没有识别到可拆分的标题内容")

        generated_files: list[Path] = []
        for index, (title, content) in enumerate(sections, start=1):
            final_section_text = content if args.keep_markdown else clean_markdown(content)
            if not final_section_text:
                continue
            part_output_path = build_split_output_path(output_path, index, title)
            asyncio.run(
                synthesize_to_mp3(
                    text=final_section_text,
                    output_path=part_output_path,
                    voice=args.voice,
                    rate=args.rate,
                )
            )
            generated_files.append(part_output_path)
            print(f"已生成分段 mp3: {part_output_path}")

        if args.play and generated_files:
            play_audio(generated_files[0])
        return

    asyncio.run(
        synthesize_to_mp3(
            text=final_text,
            output_path=output_path,
            voice=args.voice,
            rate=args.rate,
        )
    )
    print(f"已生成 mp3: {args.output}")

    if args.play:
        play_audio(output_path)


if __name__ == "__main__":
    main()
