// 鎷嶇収妯″潡
function initCamera() {
    const cameraBtn = document.getElementById("cameraBtn");
    const cameraInput = document.getElementById("cameraInput");
    const retakeBtn = document.getElementById("retakeBtn");
    const previewImg = document.getElementById("previewImg");
    const previewBox = document.getElementById("imagePreview");
    const toStep2Btn = document.getElementById("toStep2");

    cameraBtn.addEventListener("click", () => { cameraInput.click(); });

    retakeBtn.addEventListener("click", () => {
        cameraInput.value = "";
        previewBox.style.display = "none";
        cameraBtn.style.display = "flex";
        AppState.imageBase64 = null;
        toStep2Btn.disabled = true;
    });

    cameraInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            const base64 = await fileToBase64(file);
            AppState.imageBase64 = base64;
            previewImg.src = "data:image/jpeg;base64," + base64;
            previewBox.style.display = "block";
            cameraBtn.style.display = "none";
            toStep2Btn.disabled = false;
            toast("鐓х墖鎷嶅ソ鍟︼紒");
        } catch (err) {
            console.error("璇诲彇鍥剧墖澶辫触锛?, err);
            toast("鐓х墖璇诲彇澶辫触锛岃閲嶆媿");
        }
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const full = reader.result;
            const commaIdx = full.indexOf(",");
            resolve(commaIdx >= 0 ? full.substring(commaIdx + 1) : full);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}