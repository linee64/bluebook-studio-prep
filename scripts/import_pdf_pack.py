import argparse
import json
import os
import re
import sys
import time
import pymupdf

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUSTOM_PACKS_JSON = os.path.join(WORKSPACE, "src", "data", "customPacks.json")
OUT_FIG_DIR = os.path.join(WORKSPACE, "public", "figures")
os.makedirs(OUT_FIG_DIR, exist_ok=True)


def parse_answer_key(pdf_path):
    doc = pymupdf.open(pdf_path)
    text = "\n".join(p.get_text("text") for p in doc)
    pairs = re.findall(r"\b(\d+)\s+([ABCD])\b", text)
    answers = {}
    for num_str, ans in pairs:
        answers[int(num_str)] = ans
    return answers


def is_type3_font_italic(doc, font_name_str):
    m = re.search(r"(\d+)\s+0\s+R", font_name_str)
    if not m:
        return False
    xref = int(m.group(1))
    obj = doc.xref_object(xref)
    cp_refs = re.findall(r"/g[0-9A-Fa-f]+\s+(\d+)\s+0\s+R", obj)
    if len(cp_refs) < 3:
        return False
    slanted = 0
    vertical = 0
    for ref in cp_refs[:16]:
        try:
            stream = doc.xref_stream(int(ref)).decode("latin1", errors="ignore")
        except Exception:
            continue
        coords = re.findall(r"([-.\d]+)\s+([-.\d]+)\s+(m|l)", stream)
        for i in range(len(coords) - 1):
            x1, y1, op1 = float(coords[i][0]), float(coords[i][1]), coords[i][2]
            x2, y2, op2 = float(coords[i + 1][0]), float(coords[i + 1][1]), coords[i + 1][2]
            if op1 in ("m", "l") and op2 == "l":
                dx = x2 - x1
                dy = y2 - y1
                if abs(dy) > 15000:
                    ratio = abs(dx) / abs(dy)
                    if ratio < 0.02:
                        vertical += 1
                    elif 0.10 <= ratio <= 0.30:
                        slanted += 1
    return slanted >= 3 and slanted >= vertical


def extract_visual_lines(doc, page, italic_cache):
    rd = page.get_text("rawdict")
    chars = []
    for b in rd["blocks"]:
        if "lines" not in b:
            continue
        for l in b["lines"]:
            for s in l["spans"]:
                fname = s["font"]
                if fname not in italic_cache:
                    italic_cache[fname] = is_type3_font_italic(doc, fname)
                is_it = italic_cache[fname]
                for c in s["chars"]:
                    ch = c["c"]
                    bx0, by0, bx1, by1 = c["bbox"]
                    if ch == " " and (bx1 - bx0) < 1.0:
                        continue
                    if ch == "\xa0":
                        ch = " "
                    chars.append({
                        "c": ch,
                        "x0": bx0,
                        "y0": by0,
                        "x1": bx1,
                        "y1": by1,
                        "yc": (by0 + by1) / 2.0,
                        "italic": is_it,
                    })

    if not chars:
        return []

    chars.sort(key=lambda c: (c["yc"], c["x0"]))
    rows = []
    for ch in chars:
        placed = False
        for row in reversed(rows):
            if abs(ch["yc"] - row["yc"]) <= 4.5:
                row["chars"].append(ch)
                n = len(row["chars"])
                row["yc"] = (row["yc"] * (n - 1) + ch["yc"]) / n
                placed = True
                break
        if not placed:
            rows.append({"yc": ch["yc"], "chars": [ch]})

    rows.sort(key=lambda r: r["yc"])
    result_lines = []
    for r in rows:
        rchars = sorted(r["chars"], key=lambda c: c["x0"])
        while rchars and rchars[0]["c"] == " ":
            rchars.pop(0)
        while rchars and rchars[-1]["c"] == " ":
            rchars.pop()
        if not rchars:
            continue
        result_lines.append({
            "x0": min(c["x0"] for c in rchars),
            "y0": min(c["y0"] for c in rchars),
            "x1": max(c["x1"] for c in rchars),
            "y1": max(c["y1"] for c in rchars),
            "yc": r["yc"],
            "text": "".join(c["c"] for c in rchars),
            "chars": rchars,
        })
    return result_lines


def apply_formatting(chars, underlines):
    segments = []
    for ch in chars:
        cx = (ch["x0"] + ch["x1"]) / 2.0
        u_hit = False
        if ch["c"] != " ":
            for u in underlines:
                if (u.x0 - 0.3) <= cx <= (u.x1 + 0.3) and abs(ch["y1"] - u.y0) <= 5.5:
                    u_hit = True
                    break
        it = ch["italic"] and ch["c"] != " "
        if not segments or segments[-1]["u"] != u_hit or segments[-1]["i"] != it:
            segments.append({"t": ch["c"], "u": u_hit, "i": it})
        else:
            segments[-1]["t"] += ch["c"]

    for idx in range(1, len(segments) - 1):
        if segments[idx]["t"].strip() in ("", "’", "‘", "“", "”", "'"):
            if segments[idx - 1]["u"] and segments[idx + 1]["u"]:
                segments[idx]["u"] = True
            if segments[idx - 1]["i"] and segments[idx + 1]["i"]:
                segments[idx]["i"] = True

    merged = []
    for s in segments:
        if merged and merged[-1]["u"] == s["u"] and merged[-1]["i"] == s["i"]:
            merged[-1]["t"] += s["t"]
        else:
            merged.append(s)
    return merged


def merge_segments(seg_lists):
    out = []
    for idx, segs in enumerate(seg_lists):
        if idx > 0 and out and segs:
            prev_t = out[-1]["t"]
            if not prev_t.endswith((" ", "\n", "—", "-")):
                out.append({
                    "t": " ",
                    "u": out[-1]["u"] and segs[0]["u"],
                    "i": out[-1]["i"] and segs[0]["i"],
                })
        for s in segs:
            if out and out[-1]["u"] == s["u"] and out[-1]["i"] == s["i"]:
                out[-1]["t"] += s["t"]
            else:
                out.append(dict(s))
    return out


def classify_subskill(prompt, passage_text):
    p = prompt.lower()
    if "conforms to the conventions of standard english" in p:
        return "Standard English Conventions"
    if "rhetorical" in p or "notes" in passage_text.lower() and "student wants to" in p:
        return "Rhetorical Synthesis"
    if "most logical transition" in p:
        return "Transitions"
    if "logical and precise word or phrase" in p or "most nearly mean" in p:
        return "Words in Context"
    if "text 1" in passage_text.lower() and "text 2" in passage_text.lower():
        return "Cross-Text Connections"
    if "graph" in p or "table" in p:
        return "Command of Evidence (Quantitative)"
    if "most logically completes the text" in p:
        return "Inferences"
    if "support" in p or "weaken" in p or "quotation" in p or "illustrate" in p:
        return "Command of Evidence (Textual)"
    if "main idea" in p:
        return "Central Ideas and Details"
    if "purpose" in p or "structure" in p or "function" in p:
        return "Text Structure and Purpose"
    return "Reading & Writing"


def parse_pack(pack_id, title, qpdf_path, apdf_path):
    answers = parse_answer_key(apdf_path)
    doc = pymupdf.open(qpdf_path)
    if len(doc) != len(answers):
        raise ValueError(
            f"Question count ({len(doc)} pages) does not match Answer Key count ({len(answers)} answers)."
        )

    questions = []
    for page_idx, page in enumerate(doc):
        q_num = page_idx + 1
        italic_cache = {}
        drawings = page.get_drawings()
        underlines = [d["rect"] for d in drawings if d["rect"].height <= 2.5 and d["rect"].width >= 5]
        has_figure = len(drawings) > 10

        all_lines = extract_visual_lines(doc, page, italic_cache)
        qid_line = next((l for l in all_lines if l["text"].startswith("Question ID:")), None)
        qid = qid_line["text"].replace("Question ID:", "").strip() if qid_line else f"{pack_id}-{q_num}"

        q_header_idx = next(i for i, l in enumerate(all_lines) if l["text"] == "Question")
        ans_header_idx = next(i for i, l in enumerate(all_lines) if l["text"] == "Answer")
        q_y1 = all_lines[q_header_idx]["y1"]

        figure_url = None
        body_y_min = q_y1 + 1
        if has_figure:
            d_rects = [d["rect"] for d in drawings]
            u_rect = pymupdf.Rect(d_rects[0])
            for r in d_rects[1:]:
                u_rect |= r
            passage_candidates = [
                l for l in all_lines[q_header_idx + 1 : ans_header_idx]
                if l["x0"] < 30 and l["y0"] > u_rect.y1 - 5
            ]
            p_y0 = passage_candidates[0]["y0"] if passage_candidates else u_rect.y1 + 10
            fig_rect = pymupdf.Rect(u_rect)
            for l in all_lines[q_header_idx + 1 : ans_header_idx]:
                if l["y0"] > q_y1 + 1 and l["y1"] < p_y0 - 2:
                    fig_rect |= pymupdf.Rect(l["x0"], l["y0"], l["x1"], l["y1"])
            clip = pymupdf.Rect(
                max(0, fig_rect.x0 - 12),
                max(q_y1 + 2, fig_rect.y0 - 8),
                min(page.rect.width, fig_rect.x1 + 12),
                min(p_y0 - 4, fig_rect.y1 + 8),
            )
            pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), clip=clip, alpha=False)
            fig_filename = f"{pack_id}_q{q_num}_{qid}.png"
            pix.save(os.path.join(OUT_FIG_DIR, fig_filename))
            figure_url = f"/figures/{fig_filename}"
            body_y_min = p_y0 - 1

        content_lines = [l for l in all_lines[q_header_idx + 1 : ans_header_idx] if l["y0"] >= body_y_min]
        prompt_start = len(content_lines) - 1
        while prompt_start > 0:
            gap = content_lines[prompt_start]["y0"] - content_lines[prompt_start - 1]["y0"]
            if gap > 18:
                break
            prompt_start -= 1

        passage_lines = content_lines[:prompt_start]
        prompt_lines = content_lines[prompt_start:]

        attribution = None
        filtered_passage_lines = []
        for l in passage_lines:
            if l["x0"] > 350 and l["text"].startswith("©"):
                attribution = l["text"]
            else:
                filtered_passage_lines.append(l)

        blocks = []
        cur_lines = []
        cur_indented = False

        def flush_lines(lines_buf, indented):
            if not lines_buf:
                return
            non_last = lines_buf[:-1]
            is_poem = indented and len(lines_buf) >= 3 and all(ln["x1"] < 465 for ln in non_last)
            if is_poem:
                segs = []
                for li, ln in enumerate(lines_buf):
                    if li > 0:
                        segs.append({"t": "\n", "u": False, "i": False})
                    segs.extend(apply_formatting(ln["chars"], underlines))
                blocks.append({"type": "poem", "segments": segs})
            else:
                segs = merge_segments([apply_formatting(ln["chars"], underlines) for ln in lines_buf])
                blocks.append({"type": "quote" if indented else "paragraph", "segments": segs})

        for idx_l, l in enumerate(filtered_passage_lines):
            txt = l["text"]
            if txt in ("Text 1", "Text 2"):
                flush_lines(cur_lines, cur_indented)
                cur_lines = []
                blocks.append({"type": "heading", "text": txt})
                continue
            is_indented = l["x0"] >= 44.0
            gap = (l["y0"] - filtered_passage_lines[idx_l - 1]["y0"]) if idx_l > 0 else 0
            max_gap = 29.0 if (is_indented and cur_indented and l["x1"] < 465) else 19.0
            if not cur_lines:
                cur_lines = [l]
                cur_indented = is_indented
            elif gap > max_gap or is_indented != cur_indented:
                flush_lines(cur_lines, cur_indented)
                cur_lines = [l]
                cur_indented = is_indented
            else:
                cur_lines.append(l)
        flush_lines(cur_lines, cur_indented)

        prompt_segs = merge_segments([apply_formatting(l["chars"], underlines) for l in prompt_lines])
        prompt_text = "".join(s["t"] for s in prompt_segs)

        ans_lines = all_lines[ans_header_idx + 1 :]
        choices = {}
        cur_choice_key = None
        cur_choice_lines = []
        for l in ans_lines:
            m = re.match(r"^([ABCD])\.\s*(.*)$", l["text"])
            if m:
                if cur_choice_key:
                    choices[cur_choice_key] = cur_choice_lines
                cur_choice_key = m.group(1)
                prefix_len = len(m.group(1)) + 1
                trimmed_chars = l["chars"][prefix_len:]
                while trimmed_chars and trimmed_chars[0]["c"] == " ":
                    trimmed_chars = trimmed_chars[1:]
                cur_choice_lines = [trimmed_chars]
            else:
                if cur_choice_key:
                    cur_choice_lines.append(l["chars"])
        if cur_choice_key:
            choices[cur_choice_key] = cur_choice_lines

        formatted_choices = {}
        for k in ["A", "B", "C", "D"]:
            segs = merge_segments([apply_formatting(cl, underlines) for cl in choices.get(k, [])])
            formatted_choices[k] = segs

        passage_plain = " ".join(
            "".join(s["t"] for s in b["segments"]) if "segments" in b else b["text"]
            for b in blocks
        )

        questions.append({
            "id": qid,
            "uid": f"{pack_id}-{q_num}",
            "number": q_num,
            "section": pack_id,
            "sectionTitle": title,
            "subSkill": classify_subskill(prompt_text, passage_plain),
            "figure": figure_url,
            "blocks": blocks,
            "attribution": attribution,
            "prompt": prompt_segs,
            "choices": formatted_choices,
            "correctAnswer": answers[q_num],
        })

    return questions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", choices=["import", "delete"], required=True)
    parser.add_argument("--pack-id")
    parser.add_argument("--title")
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--theme", default="blue")
    parser.add_argument("--questions-pdf")
    parser.add_argument("--answers-pdf")
    args = parser.parse_args()

    if os.path.exists(CUSTOM_PACKS_JSON):
        with open(CUSTOM_PACKS_JSON, "r", encoding="utf-8") as f:
            packs = json.load(f)
    else:
        packs = []

    if args.action == "delete":
        packs = [p for p in packs if p["id"] != args.pack_id]
        with open(CUSTOM_PACKS_JSON, "w", encoding="utf-8") as f:
            json.dump(packs, f, ensure_ascii=False, indent=2)
        print(json.dumps({"ok": True, "packs": packs}, ensure_ascii=False))
        return

    pack_id = args.pack_id or f"custom_{int(time.time())}"
    qs = parse_pack(pack_id, args.title, args.questions_pdf, args.answers_pdf)
    new_pack = {
        "id": pack_id,
        "title": args.title,
        "subtitle": args.subtitle or f"{len(qs)} imported SAT Verbal questions",
        "theme": args.theme,
        "createdAt": int(time.time() * 1000),
        "questions": qs,
    }
    packs.append(new_pack)
    with open(CUSTOM_PACKS_JSON, "w", encoding="utf-8") as f:
        json.dump(packs, f, ensure_ascii=False, indent=2)
    print(json.dumps({"ok": True, "pack": new_pack, "packs": packs}, ensure_ascii=False))


if __name__ == "__main__":
    main()

