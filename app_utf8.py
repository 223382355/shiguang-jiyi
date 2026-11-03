# -*- coding: utf-8 -*-
"""
时锟斤拷锟斤拷锟?- 锟斤拷锟较伙拷锟斤拷媒锟斤拷锟秸硷拷锟斤拷锟斤拷系统
锟斤拷朔锟斤拷锟紽lask + 锟斤拷锟斤拷AI API
"""
import os
import io
import base64
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

# ============== 锟斤拷锟斤拷锟斤拷 ==============
# 锟斤拷锟斤拷 API Key锟斤拷锟斤拷锟节猴拷耍锟斤拷锟斤拷锟铰讹拷锟角帮拷耍锟?
ZHIPU_API_KEY = "03fe6d36dbaa49de8b40bf978624fadb.cjaoXy1RJaHH27NG"

# 锟斤拷锟斤拷 API 锟斤拷址
ZHIPU_VLM_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
ZHIPU_ASR_URL = "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions"
ZHIPU_CHAT_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 模锟斤拷锟斤拷锟斤拷
MODEL_VLM = "glm-4v-plus"        # 锟接撅拷锟斤拷锟?
MODEL_ASR = "glm-asr-2512"       # 锟斤拷锟斤拷识锟斤拷支锟街凤拷锟皆ｏ拷
MODEL_CHAT = "glm-4-flash"       # 锟侥憋拷锟斤拷锟斤拷

# 锟斤拷锟斤拷丝锟?
PORT = 5000
HOST = "0.0.0.0"

# 锟侥硷拷锟较达拷锟斤拷锟斤拷
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/static")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ============== 锟斤拷页 ==============
@app.route("/")
def index():
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    return send_from_directory(templates_dir, "index.html")

# ============== API 1: 图片识锟斤拷锟接撅拷锟斤拷猓?==============
@app.route("/api/analyze_image", methods=["POST"])
def analyze_image():
    try:
        data = request.get_json()
        image_base64 = data.get("image_base64", "")
        if not image_base64:
            return jsonify({"ok": False, "error": "没锟斤拷锟秸碉拷图片"}), 400

        # 去锟斤拷锟斤拷艿锟角白?data:image/xxx;base64,
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        # 锟叫讹拷图片锟斤拷式
        image_format = "jpeg"
        if image_base64[:20].startswith("iVBOR"):
            image_format = "png"

        headers = {
            "Authorization": f"Bearer {ZHIPU_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": MODEL_VLM,
            "messages": [
                {
                    "role": "system",
                    "content": "锟斤拷锟斤拷一位锟斤拷锟侥碉拷AI锟斤拷锟街ｏ拷锟矫筹拷锟斤拷锟斤拷锟斤拷锟斤拷锟剿硷拷录锟斤拷锟筋。锟斤拷锟矫硷拷唷拷锟脚拷锟斤拷锟斤拷锟斤拷锟斤拷锟酵计拷锟斤拷荨锟?
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷片锟斤拷锟斤拷什么锟斤拷锟斤拷锟斤拷锟斤拷1) 锟斤拷要锟斤拷锟斤拷/锟斤拷锟斤拷 2) 锟斤拷锟斤拷锟截碉拷 3) 锟斤拷锟斤拷/时锟斤拷 4) 锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷围锟斤拷锟斤拷锟侥★拷锟斤拷锟斤拷锟斤拷锟斤拷锟街★拷锟斤拷锟缴等ｏ拷锟斤拷锟矫硷拷痰募锟斤拷浠八碉拷锟?
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{image_format};base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 512
        }

        resp = requests.post(ZHIPU_VLM_URL, headers=headers, json=payload, timeout=30)
        resp_data = resp.json()

        if resp.status_code == 200 and "choices" in resp_data:
            description = resp_data["choices"][0]["message"]["content"]
            return jsonify({"ok": True, "description": description})
        else:
            print(f"[VLM Error] {resp.status_code}: {resp_data}")
            return jsonify({"ok": False, "error": str(resp_data)}), 500

    except Exception as e:
        print(f"[analyze_image Exception] {e}")
        return jsonify({"ok": False, "error": str(e)}), 500

# ============== API 2: 锟斤拷锟斤拷转锟斤拷锟斤拷 ==============
@app.route("/api/speech_to_text", methods=["POST"])
def speech_to_text():
    try:
        if "audio" not in request.files:
            return jsonify({"ok": False, "error": "没锟斤拷锟秸碉拷锟斤拷频锟侥硷拷"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"ok": False, "error": "锟侥硷拷锟斤拷为锟斤拷"}), 400

        filename = secure_filename(audio_file.filename) or "speech.webm"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        audio_file.save(filepath)

        headers = {"Authorization": f"Bearer {ZHIPU_API_KEY}"}

        with open(filepath, "rb") as f:
            files = {
                "model": (None, MODEL_ASR),
                "stream": (None, "false"),
                "file": (filename, f, "audio/webm")
            }
            resp = requests.post(ZHIPU_ASR_URL, headers=headers, files=files, timeout=30)

        try:
            os.remove(filepath)
        except:
            pass

        resp_data = resp.json()

        if resp.status_code == 200 and "text" in resp_data:
            return jsonify({"ok": True, "text": resp_data["text"]})
        else:
            print(f"[ASR Error] {resp.status_code}: {resp_data}")
            return jsonify({"ok": True, "text": "锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷"})

    except Exception as e:
        print(f"[speech_to_text Exception] {e}")
        return jsonify({"ok": True, "text": "锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷"})

# ============== API 3: 锟斤拷锟缴讹拷媒锟斤拷锟侥帮拷 ==============
@app.route("/api/generate_content", methods=["POST"])
def generate_content():
    try:
        data = request.get_json()
        image_desc = data.get("image_desc", "")
        speech_text = data.get("speech_text", "")
        style = data.get("style", "锟斤拷锟斤拷")

        style_prompts = {
            "锟斤拷锟斤拷": "锟斤拷锟秸碉拷锟脚ｏ拷锟斤拷锟斤拷诗锟斤拷",
            "喜锟斤拷": "锟斤拷锟斤拷锟斤拷锟街ｏ拷锟斤拷锟斤拷喜锟斤拷",
            "锟斤拷锟斤拷": "锟斤拷锟斤拷锟界景锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷",
            "锟斤拷锟斤拷": "锟斤拷馨锟斤拷锟缴ｏ拷锟斤拷锟铰革拷"
        }
        music_map = {
            "锟斤拷锟斤拷": "classical", "喜锟斤拷": "happy",
            "锟斤拷锟斤拷": "nature", "锟斤拷锟斤拷": "nostalgia"
        }

        prompt = f"""锟斤拷锟斤拷锟斤拷锟斤拷锟揭伙拷锟斤拷屎锟斤拷锟斤拷锟斤拷朔锟斤拷锟侥硷拷庭锟斤拷媒锟斤拷锟秸硷拷锟侥帮拷锟斤拷

图片锟斤拷锟斤拷锟斤拷{image_desc}
锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟絳speech_text}
选锟斤拷锟斤拷{style}锟斤拷{style_prompts.get(style, '')}锟斤拷

锟诫返锟斤拷 JSON 锟斤拷式锟斤拷锟斤拷要锟斤拷 ```锟斤拷锟斤拷
{{
  "title": "一锟戒话锟斤拷锟解（锟斤拷锟斤拷锟斤拷15锟街ｏ拷",
  "subtitle": "锟斤拷锟斤拷锟斤拷/锟斤拷锟斤拷一锟戒话锟斤拷锟斤拷锟斤拷锟斤拷20锟街ｏ拷",
  "captions": ["锟斤拷幕锟教撅拷1", "锟斤拷幕锟教撅拷2", "锟斤拷幕锟教撅拷3"],
  "music": "{music_map.get(style, 'classical')}"
}}

要锟斤拷
- 锟斤拷锟斤拷要锟斤拷锟斤拷锟斤拷暖锟斤拷锟斤拷写锟秸硷拷一锟斤拷
- 锟斤拷幕锟教撅拷每锟戒不锟斤拷锟斤拷12锟街ｏ拷锟绞合达拷锟斤拷展示
- 锟斤拷锟斤拷锟斤拷"锟斤拷锟斤拷"锟斤拷"XX锟斤拷XX锟斤拷"锟斤拷锟斤拷"""

        headers = {
            "Authorization": f"Bearer {ZHIPU_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": MODEL_CHAT,
            "messages": [
                {"role": "system", "content": "锟斤拷锟斤拷一位锟斤拷锟侥碉拷AI锟斤拷锟街ｏ拷锟矫筹拷锟斤拷锟斤拷锟斤拷锟剿帮拷锟斤拷锟斤拷锟轿憋拷锟斤拷锟脚拷亩锟矫斤拷锟斤拷占恰锟斤拷细锟絁SON锟斤拷式锟斤拷锟斤拷锟?},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1024,
            "temperature": 0.7
        }

        resp = requests.post(ZHIPU_CHAT_URL, headers=headers, json=payload, timeout=30)
        resp_data = resp.json()

        if resp.status_code == 200 and "choices" in resp_data:
            content = resp_data["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1].rsplit("```", 1)[0]
            try:
                result = json.loads(content.strip())
                result["ok"] = True
                return jsonify(result)
            except json.JSONDecodeError:
                print(f"[JSON parse fail] raw: {content[:200]}")

        fallback = {
            "ok": True,
            "title": speech_text[:10] or "锟斤拷锟矫碉拷一锟斤拷",
            "subtitle": "锟斤拷锟斤拷锟斤拷锟斤拷没锟斤拷锟?,
            "captions": [speech_text[:10] or "时锟解缓锟斤拷锟斤拷锟斤拷", "锟斤拷一锟斤拷值锟斤拷锟斤拷锟?, "愿锟斤拷锟斤拷锟斤拷锟斤拷锟皆达拷"],
            "music": music_map.get(style, "classical")
        }
        return jsonify(fallback)

    except Exception as e:
        print(f"[generate_content Exception] {e}")
        return jsonify({
            "ok": True, "title": "锟斤拷锟矫伙拷锟斤拷", "subtitle": "锟斤拷锟斤拷募锟铰?,
            "captions": ["锟斤拷锟铰撅拷锟斤拷", "锟斤拷暖锟斤拷锟?, "锟斤拷锟角此匡拷"], "music": "classical"
        })

# ============== 锟斤拷锟斤拷锟斤拷锟?==============
if __name__ == "__main__":
    print("=" * 50)
    print("  时锟斤拷锟斤拷锟?锟斤拷 锟斤拷锟较伙拷锟斤拷媒锟斤拷锟秸硷拷锟斤拷锟斤拷系统")
    print("=" * 50)
    print(f"  锟斤拷锟斤拷锟斤拷锟斤拷锟?.. 锟斤拷锟斤拷 {HOST}:{PORT}")
    print(f"  锟斤拷锟斤拷锟街伙拷锟斤拷锟斤拷锟斤拷蚩锟絟ttp://<锟斤拷锟斤拷缘锟絀P>:{PORT}")
    print("=" * 50)
    app.run(host=HOST, port=PORT, debug=False)
