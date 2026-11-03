// 鍏ㄥ眬鐘舵€?
const AppState = {
    step: 1,
    imageBase64: null,
    speechBlob: null,
    speechText: "",
    imageDesc: "",
    selectedStyle: null,
    aiContent: null,
    audioChunks: [],
    mediaRecorder: null,
};

function toast(msg, duration = 2500) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), duration);
}

function goStep(n) {
    AppState.step = n;
    document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
    let panelId = null;
    if (n === 1) panelId = "step1";
    else if (n === 2) panelId = "step2";
    else if (n === 3) panelId = "step3";
    else if (n === 3.5) panelId = "stepGenerating";
    else if (n === 4) panelId = "step4";
    if (panelId) document.getElementById(panelId).classList.add("active");

    document.querySelectorAll(".step").forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove("active", "done");
        if (n === 4) {
            if (stepNum <= 4) el.classList.add("done");
            if (stepNum === 4) el.classList.add("active");
        } else {
            if (stepNum < Math.ceil(n)) el.classList.add("done");
            if (stepNum === Math.ceil(n)) el.classList.add("active");
        }
    });
    document.querySelectorAll(".step-line").forEach((line, i) => {
        line.classList.remove("done");
        if (n >= 4) line.classList.add("done");
        else if (i + 1 < n) line.classList.add("done");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initCamera();
    initRecorder();
    initStyleSelect();
    initNavigation();
    initVideo();
});

function initNavigation() {
    document.getElementById("toStep2").addEventListener("click", () => goStep(2));
    document.getElementById("toStep3").addEventListener("click", () => goStep(3));
    document.getElementById("backToStep1").addEventListener("click", () => goStep(1));
    document.getElementById("backToStep2").addEventListener("click", () => goStep(2));

    document.getElementById("restartBtn").addEventListener("click", () => {
        AppState.imageBase64 = null;
        AppState.speechBlob = null;
        AppState.speechText = "";
        AppState.imageDesc = "";
        AppState.selectedStyle = null;
        AppState.aiContent = null;
        document.getElementById("imagePreview").style.display = "none";
        document.getElementById("cameraBtn").style.display = "flex";
        document.getElementById("toStep2").disabled = true;
        document.getElementById("transcriptBox").style.display = "none";
        document.getElementById("toStep3").disabled = true;
        document.querySelectorAll(".style-btn").forEach(b => b.classList.remove("selected"));
        stopVideoPlayback();
        goStep(1);
    });
}