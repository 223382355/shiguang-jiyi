// 褰曢煶妯″潡
function initRecorder() {
    const recordBtn = document.getElementById("recordBtn");
    const recordIcon = recordBtn.querySelector(".record-icon");
    const recordText = recordBtn.querySelector(".record-text");
    const recordHint = document.getElementById("recordHint");
    const transcriptText = document.getElementById("transcriptText");
    const transcriptBox = document.getElementById("transcriptBox");
    const toStep3Btn = document.getElementById("toStep3");
    const rerecordBtn = document.getElementById("rerecordBtn");

    let isRecording = false;
    let stream = null;

    const startRecord = async () => {
        if (isRecording) return;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error("楹﹀厠椋庢潈闄愰敊璇細", err);
            toast("璇峰厑璁镐娇鐢ㄩ害鍏嬮鍝");
            return;
        }
        isRecording = true;
        AppState.audioChunks = [];

        const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"];
        let mimeType = "";
        for (const t of mimeTypes) {
            if (MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
        }
        try {
            AppState.mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
        } catch (e) {
            AppState.mediaRecorder = new MediaRecorder(stream);
        }

        AppState.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) AppState.audioChunks.push(e.data);
        };

        AppState.mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(AppState.audioChunks, { type: mimeType || "audio/webm" });
            AppState.speechBlob = blob;
            isRecording = false;

            recordBtn.classList.remove("recording");
            recordIcon.textContent = "??";
            recordText.textContent = "鎸変綇璇磋瘽";
            recordHint.textContent = "褰曢煶缁撴潫锛屾鍦ㄨ瘑鍒綘璇寸殑璇濃€?;
            transcriptBox.style.display = "block";
            transcriptText.textContent = "锛堣瘑鍒腑鈥︼級";

            try {
                const result = await API.speechToText(blob, mimeType || "audio/webm");
                AppState.speechText = result.text || "缇庡ソ鐨勪竴澶?;
                transcriptText.textContent = AppState.speechText;
                toStep3Btn.disabled = false;
                toast("璇嗗埆瀹屾垚 ?");
            } catch (err) {
                console.error("ASR 澶辫触锛?, err);
                AppState.speechText = "浠婂ぉ蹇冩儏寰堝ソ";
                transcriptText.textContent = AppState.speechText;
                toStep3Btn.disabled = false;
            }
        };

        AppState.mediaRecorder.start();
        recordBtn.classList.add("recording");
        recordIcon.textContent = "??";
        recordText.textContent = "鏉惧紑缁撴潫";
        recordHint.textContent = "姝ｅ湪褰曢煶鈥?鏉惧紑鎸夐挳鍋滄";
    };

    const stopRecord = () => {
        if (!isRecording || !AppState.mediaRecorder) return;
        try { AppState.mediaRecorder.stop(); } catch (e) {}
    };

    recordBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startRecord(); });
    recordBtn.addEventListener("touchend", (e) => { e.preventDefault(); stopRecord(); });
    recordBtn.addEventListener("touchcancel", (e) => { e.preventDefault(); stopRecord(); });
    recordBtn.addEventListener("mousedown", startRecord);
    recordBtn.addEventListener("mouseup", stopRecord);
    recordBtn.addEventListener("mouseleave", () => { if (isRecording) stopRecord(); });

    rerecordBtn.addEventListener("click", () => {
        transcriptBox.style.display = "none";
        toStep3Btn.disabled = true;
        AppState.speechBlob = null;
        AppState.speechText = "";
    });
}