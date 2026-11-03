// 椋庢牸閫夋嫨 + AI 璋冪敤 + 瑙嗛鐢熸垚涓绘祦绋?
function initStyleSelect() {
    document.querySelectorAll(".style-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".style-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            AppState.selectedStyle = btn.dataset.style;
            generateEverything();
        });
    });
}

async function generateEverything() {
    try {
        goStep(3.5);
        const hint = document.getElementById("generateHint");

        hint.textContent = "?? 姝ｅ湪璇嗗埆鐓х墖閲岀殑鍐呭鈥?;
        let imageDesc = "鐢ㄦ埛鐨勭敓娲绘棩甯?;
        try {
            const r = await API.analyzeImage(AppState.imageBase64);
            imageDesc = r.description || imageDesc;
        } catch (e) { console.warn("鍥剧墖璇嗗埆澶辫触锛堝厹搴曪級锛?, e); }
        AppState.imageDesc = imageDesc;

        hint.textContent = "?? 姝ｅ湪涓轰綘娑﹁壊鎴愭俯鏆栫殑鏃ヨ鈥?;
        let aiContent;
        try {
            aiContent = await API.generateContent(imageDesc, AppState.speechText, AppState.selectedStyle);
        } catch (e) {
            console.warn("鏂囨鐢熸垚澶辫触锛堝厹搴曪級锛?, e);
            aiContent = {
                ok: true,
                title: AppState.speechText?.slice(0, 10) || "缇庡ソ鍥炲繂",
                subtitle: "浠婂ぉ鐨勬俯鏆栬褰?,
                captions: ["鏃跺厜缂撶紦娴佹穼", "杩欎竴鍒诲€煎緱鐝嶈棌", "鎰垮瞾鏈堟俯鏌斾互寰?],
                music: "classical"
            };
        }
        AppState.aiContent = aiContent;

        hint.textContent = "?? 姝ｅ湪鍚堟垚瑙嗛鐢婚潰鈥?;
        await loadVideoImage();

        document.getElementById("videoTitle").textContent = aiContent.title || "缇庡ソ鍥炲繂";
        document.getElementById("videoSubtitle").textContent = aiContent.subtitle || "";

        goStep(4);
        drawFirstFrame();
        toast("鍋氬ソ鍟︼紒鐐瑰嚮??鎾斁鐪嬬湅~");

    } catch (err) {
        console.error("鐢熸垚澶辫触锛?, err);
        toast("鍑轰簡鐐归棶棰橈紝璇曡瘯閲嶆柊鏉ヤ竴娆★紵");
        goStep(1);
    }
}