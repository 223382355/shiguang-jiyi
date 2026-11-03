// Canvas 瑙嗛鍚堟垚 + MediaRecorder 褰曞埗
let videoAnimId = null;
let videoStartTime = 0;
let isVideoPlaying = false;
let currentMusicGen = null;

async function initVideo() {
    const playBtn = document.getElementById("playBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const shareBtn = document.getElementById("shareBtn");
    playBtn.addEventListener("click", toggleVideoPlay);
    downloadBtn.addEventListener("click", downloadVideo);
    shareBtn.addEventListener("click", async () => {
        toast("璇峰厛"淇濆瓨鍒版墜鏈?锛屽啀浠庣浉鍐屽垎浜粰瀹朵汉鍚");
    });
    const recPlayer = document.getElementById("recordingPlayer");
    recPlayer.volume = 0.7;
}

async function toggleVideoPlay() {
    const playBtn = document.getElementById("playBtn");
    if (isVideoPlaying) { stopVideoPlayback(); playBtn.textContent = "?? 鎾斁瑙嗛"; return; }

    if (currentMusicGen) currentMusicGen.stop();
    const musicStyle = AppState.aiContent?.music || "classical";
    currentMusicGen = new MusicGenerator(musicStyle, 12);
    await currentMusicGen.start();

    const recPlayer = document.getElementById("recordingPlayer");
    if (AppState.speechBlob) {
        recPlayer.src = URL.createObjectURL(AppState.speechBlob);
        try { await recPlayer.play(); } catch (e) {}
    }

    isVideoPlaying = true;
    videoStartTime = performance.now();
    animateVideo();
    playBtn.textContent = "?? 鏆傚仠";
}

function stopVideoPlayback() {
    isVideoPlaying = false;
    if (videoAnimId) cancelAnimationFrame(videoAnimId);
    videoAnimId = null;
    if (currentMusicGen) { currentMusicGen.stop(); currentMusicGen = null; }
    const recPlayer = document.getElementById("recordingPlayer");
    try { recPlayer.pause(); } catch (e) {}
    document.getElementById("playBtn").textContent = "?? 鎾斁瑙嗛";
}

function animateVideo() {
    if (!isVideoPlaying) return;
    const canvas = document.getElementById("videoCanvas");
    const ctx = canvas.getContext("2d");
    const elapsed = (performance.now() - videoStartTime) / 1000;
    const totalDuration = 12;
    renderFrame(ctx, canvas, elapsed, totalDuration);
    if (elapsed < totalDuration + 0.5) {
        videoAnimId = requestAnimationFrame(animateVideo);
    } else {
        stopVideoPlayback();
        setTimeout(() => drawFirstFrame(), 300);
    }
}

function drawFirstFrame() {
    const canvas = document.getElementById("videoCanvas");
    const ctx = canvas.getContext("2d");
    renderFrame(ctx, canvas, 0, 12);
}

function renderFrame(ctx, canvas, elapsed, totalDuration) {
    const W = canvas.width, H = canvas.height;
    const style = AppState.selectedStyle || "鏂囪壓";
    const bgColors = {
        "鏂囪壓": ["#fce4ec", "#f8bbd9"],
        "鍠滃簡": ["#ffe0b2", "#ff7043"],
        "缇庝附": ["#e1f5fe", "#4fc3f7"],
        "鎬€鏃?: ["#efebe9", "#a1887f"]
    };
    const colors = bgColors[style] || bgColors["鏂囪壓"];
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const img = AppState._videoImage || null;
    if (img) {
        const imgAspect = img.width / img.height;
        const canvasAspect = W / H;
        const progress = elapsed / totalDuration;
        const scale = 1.0 + 0.15 * progress;
        const tx = Math.sin(progress * Math.PI * 2) * 20;
        const ty = Math.cos(progress * Math.PI * 2) * 15;
        let drawW, drawH, offsetX, offsetY;
        if (imgAspect > canvasAspect) {
            drawH = H * scale; drawW = drawH * imgAspect;
            offsetX = (W - drawW) / 2 + tx; offsetY = (H - drawH) / 2 + ty;
        } else {
            drawW = W * scale; drawH = drawW / imgAspect;
            offsetX = (W - drawW) / 2 + tx; offsetY = (H - drawH) / 2 + ty;
        }
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, W, H);
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(W * (0.15 + i * 0.2), H * 0.4, 40 + i * 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const content = AppState.aiContent || {};
    ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (content.subtitle) {
        ctx.font = "bold 32px 'Microsoft YaHei', sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
        ctx.fillText(content.subtitle, W / 2, 100);
    }
    if (content.title) {
        ctx.font = "bold 52px 'Microsoft YaHei', sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 12;
        ctx.fillText(content.title, W / 2, 160);
    }

    const captions = content.captions || [];
    if (captions.length > 0) {
        const captionDuration = totalDuration / captions.length;
        const captionIdx = Math.min(Math.floor(elapsed / captionDuration), captions.length - 1);
        const caption = captions[captionIdx];
        ctx.shadowBlur = 0;
        const boxW = W - 80, boxH = 120, boxX = 40, boxY = H - boxH - 80;
        roundRect(ctx, boxX, boxY, boxW, boxH, 20);
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 46px 'Microsoft YaHei', sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6;
        wrapText(ctx, caption, W / 2, boxY + boxH / 2, boxW - 20, 58);
    }

    ctx.shadowBlur = 0;
    ctx.font = "24px 'Microsoft YaHei', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "left";
    ctx.fillText("?? 鏃跺厜璁板繂", 30, H - 30);

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(40, 40, W - 80, 6);
    ctx.fillStyle = "white";
    ctx.fillRect(40, 40, (W - 80) * Math.min(elapsed / totalDuration, 1), 6);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx, text, centerX, centerY, maxWidth, lineHeight) {
    if (ctx.measureText(text).width <= maxWidth) { ctx.fillText(text, centerX, centerY); return; }
    let line = ""; const lines = [];
    for (let i = 0; i < text.length; i++) {
        const testLine = line + text[i];
        if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
            lines.push(line); line = text[i];
        } else { line = testLine; }
    }
    if (line) lines.push(line);
    const startY = centerY - (lines.length - 1) * lineHeight / 2;
    lines.forEach((l, i) => { ctx.fillText(l, centerX, startY + i * lineHeight); });
}

async function loadVideoImage() {
    if (!AppState.imageBase64) return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { AppState._videoImage = img; resolve(img); };
        img.onerror = () => resolve(null);
        img.src = "data:image/jpeg;base64," + AppState.imageBase64;
    });
}

async function downloadVideo() {
    const canvas = document.getElementById("videoCanvas");
    if (!isVideoPlaying) { toast("璇峰厛鎾斁瑙嗛鍝"); return; }
    toast("姝ｅ湪鐢熸垚瑙嗛鏂囦欢鈥?);
    try {
        const stream = canvas.captureStream(30);
        if (AppState.speechBlob) {
            const audioEl = new Audio();
            audioEl.src = URL.createObjectURL(AppState.speechBlob);
            audioEl.muted = false; audioEl.play();
            const audioStream = audioEl.captureStream();
            audioStream.getAudioTracks().forEach(t => stream.addTrack(t));
        }
        const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
        let mimeType = "video/webm";
        for (const t of mimeTypes) { if (MediaRecorder.isTypeSupported(t)) { mimeType = t; break; } }
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 });
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `鏃跺厜璁板繂_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.webm`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast("淇濆瓨鎴愬姛锛佽鍒扮浉鍐屾煡鐪???");
        };
        recorder.start();
        setTimeout(() => recorder.stop(), 12000);
    } catch (err) {
        console.error("褰曞埗澶辫触锛?, err);
        toast("瑙嗛褰曞埗澶辫触锛屼絾鍙互姝ｅ父鎾斁");
    }
}