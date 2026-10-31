"""Generate the 57 codex portraits with Doubao Seedream via Volcengine Ark.

Reads the prompt table from gen-portraits.py so both backends stay in sync.
The API key is read from ARK_API_KEY only; it is never written to disk.

Usage:
  ARK_API_KEY=... python -I _art/gen-ark.py --only guanyu
  ARK_API_KEY=... python -I _art/gen-ark.py            # all missing
"""
import argparse
import base64
import importlib.util
import io
import json
import os
import sys
import time
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_art", "out")
MODEL = "doubao-seedream-5-0-pro-260628"
SIZE = "864x1152"
ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations"

spec = importlib.util.spec_from_file_location(
    "portraits", os.path.join(ROOT, "_art", "gen-portraits.py"))
portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portraits)

STYLE = portraits.STYLE
PROMPTS = portraits.PROMPTS


def seed_for(cid):
    return 1000 + sorted(PROMPTS).index(cid) * 7


def generate(cid, prompt):
    key = os.environ.get("ARK_API_KEY")
    if not key:
        raise SystemExit("ARK_API_KEY is not set")
    payload = {
        "model": MODEL,
        "prompt": f"{STYLE}: {prompt}",
        "size": SIZE,
        "response_format": "b64_json",
        "watermark": False,
        "seed": seed_for(cid),
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        body = json.loads(r.read())
    if "data" not in body:
        raise RuntimeError(str(body)[:300])
    return base64.b64decode(body["data"][0]["b64_json"])


def save_webp(blob, path):
    im = Image.open(io.BytesIO(blob)).convert("RGB")
    if im.size != (864, 1152):
        im = im.resize((864, 1152), Image.LANCZOS)
    im.save(path, "WEBP", quality=92, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--retries", type=int, default=3)
    ap.add_argument("--delay", type=float, default=1.0)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    ids = [s.strip() for s in args.only.split(",") if s.strip()] or sorted(PROMPTS)
    manifest_path = os.path.join(OUT, "manifest.json")
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)

    failed = []
    for cid in ids:
        out = os.path.join(OUT, f"{cid}.webp")
        if os.path.exists(out) and not args.force:
            print(cid, "exists", flush=True)
            continue
        prompt = PROMPTS[cid]
        for attempt in range(1, args.retries + 1):
            try:
                started = time.time()
                blob = generate(cid, prompt)
                save_webp(blob, out)
                manifest[cid] = {
                    "model": MODEL,
                    "size": SIZE,
                    "seed": seed_for(cid),
                    "prompt": prompt,
                    "seconds": round(time.time() - started, 1),
                }
                with open(manifest_path, "w", encoding="utf-8") as f:
                    json.dump(manifest, f, ensure_ascii=False, indent=1)
                print(cid, "ok", round(time.time() - started, 1), flush=True)
                break
            except urllib.error.HTTPError as exc:  # noqa: PERF203 - show body
                detail = exc.read().decode("utf-8", "replace")[:400]
                print(cid, f"attempt {attempt}: HTTP {exc.code} {detail}", file=sys.stderr, flush=True)
                time.sleep(8 * attempt)
            except Exception as exc:  # noqa: BLE001 - report and retry
                print(cid, f"attempt {attempt}: {exc}"[:300], file=sys.stderr, flush=True)
                time.sleep(8 * attempt)
        else:
            failed.append(cid)
        time.sleep(args.delay)

    if failed:
        print("FAILED:", ",".join(failed), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
