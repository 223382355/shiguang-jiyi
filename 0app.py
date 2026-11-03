# -*- coding: utf-8 -*-
"""
鏃跺厜璁板繂 - 閫傝€佸寲澶氬獟浣撴棩璁扮敓鎴愮郴缁?
鍚庣鏈嶅姟锛欶lask + 鏅鸿氨AI API
"""
import os
import io
import base64
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

# ============== 閰嶇疆鍖?==============
# 鏅鸿氨 API Key锛堟斁鍦ㄥ悗绔紝涓嶆毚闇茬粰鍓嶇锛?
ZHIPU_API_KEY = "03fe6d36dbaa49de8b40bf978624fadb.cjaoXy1RJaHH27NG"

# 鏅鸿氨 API 鍦板潃
ZHIPU_VLM_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
ZHIPU_ASR_URL = "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions"
ZHIPU_CHAT_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 妯″瀷鍚嶇О
MODEL_VLM = "glm-4v-plus"        # 瑙嗚鐞嗚В
MODEL_ASR = "glm-asr-2512"       # 璇煶璇嗗埆锛堟敮鎸佹柟瑷€锛?
MODEL_CHAT = "glm-4-flash"       # 鏂囨湰鐢熸垚

# 鏈嶅姟绔彛
PORT = 5000
HOST = "0.0.0.0"

# 鏂囦欢涓婁紶閰嶇疆
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/static")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ============== 棣栭〉 ==============
@app.route("/")
def index():
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    return send_from_directory(templates_dir, "index.html")

# ============== API 1: 鍥剧墖璇嗗埆锛堣瑙夌悊瑙ｏ級 ==============
@app.route("/api/analyze_image", methods=["POST"])
def analyze_image():
    try:
        data = request.get_json()
        image_base64 = data.get("image_base64", "")
        if not image_base64:
            return jsonify({"ok": False, "error": "娌℃湁鏀跺埌鍥剧墖"}), 400

        # 鍘绘帀鍙兘鐨勫墠缂€ data:image/xxx;base64,
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        # 鍒ゆ柇鍥剧墖鏍煎紡
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
                    "content": "浣犳槸涓€浣嶈创蹇冪殑AI鍔╂墜锛屾搮闀垮府鍔╄€佸勾浜鸿褰曠敓娲汇€傝鐢ㄧ畝娲併€佹俯鏆栫殑璇█鎻忚堪鍥剧墖鍐呭銆?
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "璇锋弿杩拌繖寮犵収鐗囬噷鏈変粈涔堬紵鍖呮嫭锛?) 涓昏浜虹墿/鐗╀綋 2) 鍦烘櫙鍦扮偣 3) 澶╂皵/鏃堕棿 4) 鏁翠綋鎯呯华姘涘洿锛堝紑蹇冦€佸畞闈欍€佺儹闂广€佹€€鏃х瓑锛夈€傜敤绠€鐭殑鍑犲彞璇濊銆?
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

# ============== API 2: 璇煶杞枃瀛?==============
@app.route("/api/speech_to_text", methods=["POST"])
def speech_to_text():
    try:
        if "audio" not in request.files:
            return jsonify({"ok": False, "error": "娌℃湁鏀跺埌闊抽鏂囦欢"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"ok": False, "error": "鏂囦欢鍚嶄负绌?}), 400

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
            return jsonify({"ok": True, "text": "浠婂ぉ鐨勫績鎯呭緢缇庡ソ"})

    except Exception as e:
        print(f"[speech_to_text Exception] {e}")
        return jsonify({"ok": True, "text": "浠婂ぉ鐨勫績鎯呭緢缇庡ソ"})

# ============== API 3: 鐢熸垚澶氬獟浣撴枃妗?==============
@app.route("/api/generate_content", methods=["POST"])
def generate_content():
    try:
        data = request.get_json()
        image_desc = data.get("image_desc", "")
        speech_text = data.get("speech_text", "")
        style = data.get("style", "鏂囪壓")

        style_prompts = {
            "鏂囪壓": "鏂囪壓娣￠泤锛屽瘜鏈夎瘲鎰?,
            "鍠滃簡": "娆㈠揩鐑椆锛屽厖婊″枩鎮?,
            "缇庝附": "璧炵編椋庢櫙锛屽績鎯呮剦鎮?,
            "鎬€鏃?: "娓╅Θ鎬€鏃э紝宀佹湀鎰?
        }
        music_map = {
            "鏂囪壓": "classical", "鍠滃簡": "happy",
            "缇庝附": "nature", "鎬€鏃?: "nostalgia"
        }

        prompt = f"""璇峰府鎴戠敓鎴愪竴娈甸€傚悎鑰佸勾浜哄垎浜殑瀹跺涵澶氬獟浣撴棩璁版枃妗堛€?

鍥剧墖鎻忚堪锛歿image_desc}
鑰佷汉璇煶璁茶堪锛歿speech_text}
閫夋嫨椋庢牸锛歿style}锛坽style_prompts.get(style, '')}锛?

璇疯繑鍥?JSON 鏍煎紡锛堜笉瑕佸姞 ```锛夛細
{{
  "title": "涓€鍙ヨ瘽鏍囬锛堜笉瓒呰繃15瀛楋級",
  "subtitle": "鍓爣棰?鏃ユ湡涓€鍙ヨ瘽锛堜笉瓒呰繃20瀛楋級",
  "captions": ["瀛楀箷鐭彞1", "瀛楀箷鐭彞2", "瀛楀箷鐭彞3"],
  "music": "{music_map.get(style, 'classical')}"
}}

瑕佹眰锛?
- 璇█瑕佷翰鍒囨俯鏆栵紝鍍忓啓鏃ヨ涓€鏍?
- 瀛楀箷鐭彞姣忓彞涓嶈秴杩?2瀛楋紝閫傚悎澶у瓧灞曠ず
- 鏃ユ湡鐢?浠婂ぉ"鎴?XX骞碭X鏈?鍗冲彲"""

        headers = {
            "Authorization": f"Bearer {ZHIPU_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": MODEL_CHAT,
            "messages": [
                {"role": "system", "content": "浣犳槸涓€浣嶈创蹇冪殑AI鍔╂墜锛屾搮闀垮府鑰佸勾浜烘妸鐢熸椿鐐规淮鍙樻垚娓╂殩鐨勫濯掍綋鏃ヨ銆備弗鏍兼寜JSON鏍煎紡杈撳嚭銆?},
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
            "title": speech_text[:10] or "缇庡ソ鐨勪竴澶?,
            "subtitle": "浠婂ぉ鐨勭編濂藉洖蹇?,
            "captions": [speech_text[:10] or "鏃跺厜缂撶紦娴佹穼", "杩欎竴鍒诲€煎緱鐝嶈棌", "鎰垮瞾鏈堟俯鏌斾互寰?],
            "music": music_map.get(style, "classical")
        }
        return jsonify(fallback)

    except Exception as e:
        print(f"[generate_content Exception] {e}")
        return jsonify({
            "ok": True, "title": "缇庡ソ鍥炲繂", "subtitle": "浠婂ぉ鐨勮褰?,
            "captions": ["宀佹湀闈欏ソ", "娓╂殩鐩镐即", "閾姝ゅ埢"], "music": "classical"
        })

# ============== 鍚姩鏈嶅姟 ==============
if __name__ == "__main__":
    print("=" * 50)
    print("  鏃跺厜璁板繂 路 閫傝€佸寲澶氬獟浣撴棩璁扮敓鎴愮郴缁?)
    print("=" * 50)
    print(f"  鏈嶅姟鍚姩涓?.. 鐩戝惉 {HOST}:{PORT}")
    print(f"  璇峰湪鎵嬫満娴忚鍣ㄦ墦寮€锛歨ttp://<浣犵數鑴戠殑IP>:{PORT}")
    print("=" * 50)
    app.run(host=HOST, port=PORT, debug=False)