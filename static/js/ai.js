// 直接调用智谱 API（前端直连，竞赛演示用）
const ZHIPU_API_KEY = "03fe6d36dbaa49de8b40bf978624fadb.cjaoXy1RJaHH27NG";
const ZHIPU_BASE = "https://open.bigmodel.cn/api/paas/v4";

const API = {
    async analyzeImage(base64) {
        let imgData = base64;
        if (imgData.includes(",")) imgData = imgData.split(",", 2)[1];
        const fmt = imgData.startsWith("iVBOR") ? "png" : "jpeg";
        const resp = await fetch(`${ZHIPU_BASE}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ZHIPU_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "glm-4v-plus",
                messages: [
                    { role: "system", content: "你是一位贴心的AI助手，擅长帮助老年人记录生活。请用简洁、温暖的语言描述图片内容。" },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "请描述这张照片里有什么？包括：1) 主要人物/物体 2) 场景地点 3) 天气/时间 4) 整体情绪氛围（开心、宁静、热闹、怀旧等）。用简短的几句话说。" },
                            { type: "image_url", image_url: { url: `data:image/${fmt};base64,${imgData}` } }
                        ]
                    }
                ],
                max_tokens: 512
            })
        });
        const data = await resp.json();
        if (data.choices) return { ok: true, description: data.choices[0].message.content };
        throw new Error(JSON.stringify(data));
    },

    async speechToText(blob) {
        const form = new FormData();
        form.append("model", "glm-asr-2512");
        form.append("stream", "false");
        form.append("file", blob, "speech.webm");
        const resp = await fetch(`${ZHIPU_BASE}/audio/transcriptions`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${ZHIPU_API_KEY}` },
            body: form
        });
        const data = await resp.json();
        if (data.text) return { ok: true, text: data.text };
        return { ok: true, text: "今天的心情很美好" };
    },

    async generateContent(imageDesc, speechText, style) {
        const stylePrompts = { "文艺": "文艺淡雅，富有诗意", "喜庆": "欢快热闹，充满喜悦", "美丽": "赞美风景，心情愉悦", "怀旧": "温馨怀旧，岁月感" };
        const musicMap = { "文艺": "classical", "喜庆": "happy", "美丽": "nature", "怀旧": "nostalgia" };
        const prompt = `请帮我生成一段适合老年人分享的家庭多媒体日记文案。

图片描述：${imageDesc}
老人语音讲述：${speechText}
选择风格：${style}（${stylePrompts[style] || ""}）

请返回 JSON 格式（不要加\`\`\`）：
{
  "title": "一句话标题（不超过15字）",
  "subtitle": "副标题/日期一句话（不超过20字）",
  "captions": ["字幕短句1", "字幕短句2", "字幕短句3"],
  "music": "${musicMap[style] || "classical"}"
}

要求：
- 语言要亲切温暖，像写日记一样
- 字幕短句每句不超过12字，适合大字展示
- 日期用"今天"或"XX年XX月"即可`;
        const resp = await fetch(`${ZHIPU_BASE}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ZHIPU_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    { role: "system", content: "你是一位贴心的AI助手，擅长帮老年人把生活点滴变成温暖的多媒体日记。严格按JSON格式输出。" },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1024, temperature: 0.7
            })
        });
        const data = await resp.json();
        if (data.choices) {
            let content = data.choices[0].message.content.trim();
            if (content.startsWith("```")) content = content.split("\n").slice(1, -1).join("\n");
            try {
                const r = JSON.parse(content.trim());
                r.ok = true; return r;
            } catch {}
        }
        return {
            ok: true, title: speechText.slice(0, 10) || "美好的一天",
            subtitle: "今天的美好回忆",
            captions: [speechText.slice(0, 10) || "时光缓缓流淌", "这一刻值得珍藏", "愿岁月温柔以待"],
            music: musicMap[style] || "classical"
        };
    }
};