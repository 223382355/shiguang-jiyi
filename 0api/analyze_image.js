const ZHIPU_API_KEY = "03fe6d36dbaa49de8b40bf978624fadb.cjaoXy1RJaHH27NG";
const MODEL_VLM = "glm-4v-plus";
const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export async function POST(request) {
  try {
    const data = await request.json();
    let imageBase64 = data.image_base64 || "";
    if (!imageBase64) {
      return Response.json({ ok: false, error: "没有收到图片" }, { status: 400 });
    }
    if (imageBase64.includes(",")) {
      imageBase64 = imageBase64.split(",", 2)[1];
    }
    const imageFormat = imageBase64.startsWith("iVBOR") ? "png" : "jpeg";
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_VLM,
        messages: [
          { role: "system", content: "你是一位贴心的AI助手，擅长帮助老年人记录生活。请用简洁、温暖的语言描述图片内容。" },
          {
            role: "user",
            content: [
              { type: "text", text: "请描述这张照片里有什么？包括：1) 主要人物/物体 2) 场景地点 3) 天气/时间 4) 整体情绪氛围（开心、宁静、热闹、怀旧等）。用简短的几句话说。" },
              { type: "image_url", image_url: { url: `data:image/${imageFormat};base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 512
      })
    });
    const respData = await resp.json();
    if (resp.ok && respData.choices) {
      return Response.json({ ok: true, description: respData.choices[0].message.content });
    }
    return Response.json({ ok: false, error: JSON.stringify(respData) }, { status: 500 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
export function GET() { return Response.json({ ok: true }); }