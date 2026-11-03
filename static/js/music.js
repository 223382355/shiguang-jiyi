// Web Audio API 鐢熸垚鑳屾櫙闊充箰
const STYLE_CHORDS = {
    classical: {
        name: "鍙ゅ吀", bpm: 60,
        chords: [
            ["C4","E4","G4"],["G4","B4","D5"],["A4","C5","E5"],["F4","A4","C5"],
            ["C4","E4","G4"],["G4","B4","D5"],["C5","E5","G5"],["C5","E5","G5"]
        ],
        melody: ["C5","E5","G5","E5","C5","G4","E4","C4"]
    },
    happy: {
        name: "鍠滃簡", bpm: 100,
        chords: [
            ["C4","E4","G4"],["F4","A4","C5"],["G4","B4","D5"],["C4","E4","G4"],
            ["F4","A4","C5"],["G4","B4","D5"],["C4","E4","G4"],["C5","E5","G5"]
        ],
        melody: ["C5","D5","E5","G5","E5","D5","C5","A4"]
    },
    nature: {
        name: "缇庝附", bpm: 55,
        chords: [
            ["D4","F#4","A4"],["G4","B4","D5"],["A4","C5","E5"],["D4","F#4","A4"],
            ["F#4","A4","C#5"],["B4","D5","F#5"],["D5","F#5","A5"],["D5","F#5","A5"]
        ],
        melody: ["D5","F#5","A5","F#5","D5","B4","F#4","D4"]
    },
    nostalgia: {
        name: "鎬€鏃?, bpm: 50,
        chords: [
            ["Am","C","E"],["G","B","D"],["F","A","C"],["E","G#","B"],
            ["Am","C","E"],["Dm","F","A"],["G","B","D"],["Am","C","E"]
        ],
        melody: ["A4","C5","E5","C5","A4","E4","C4","A3"]
    }
};

const NOTE_FREQ = {
    "C3":130.81,"C#3":138.59,"D3":146.83,"D#3":155.56,"E3":164.81,"F3":174.61,
    "F#3":185.00,"G3":196.00,"G#3":207.65,"A3":220.00,"A#3":233.08,"B3":246.94,
    "C4":261.63,"C#4":277.18,"D4":293.66,"D#4":311.13,"E4":329.63,"F4":349.23,
    "F#4":369.99,"G4":392.00,"G#4":415.30,"A4":440.00,"A#4":466.16,"B4":493.88,
    "C5":523.25,"C#5":554.37,"D5":587.33,"D#5":622.25,"E5":659.25,"F5":698.46,
    "F#5":739.99,"G5":783.99,"G#5":830.61,"A5":880.00,"A#5":932.33,"B5":987.77,
    "C6":1046.50,"Am":220.00,"C":261.63,"E":329.63,"G":392.00,"F":349.23,
    "A":440.00,"B":493.88,"D":293.66
};

class MusicGenerator {
    constructor(style = "classical", videoDuration = 15) {
        this.style = style;
        this.duration = videoDuration;
        this.audioCtx = null;
        this.nodes = [];
    }
    async start() {
        if (this.audioCtx) return;
        try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
        if (this.audioCtx.state === "suspended") await this.audioCtx.resume();
        this.scheduleMusic();
    }
    stop() { this.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); this.nodes = []; }
    scheduleMusic() {
        const ctx = this.audioCtx;
        const style = STYLE_CHORDS[this.style] || STYLE_CHORDS.classical;
        const beatDur = 60 / style.bpm;
        const totalBeats = Math.ceil(this.duration / beatDur);
        for (let i = 0; i < totalBeats; i += 2) {
            const chordIdx = (i / 2) % style.chords.length;
            const chord = style.chords[chordIdx];
            const startT = ctx.currentTime + i * beatDur;
            const endT = startT + beatDur * 2;
            chord.forEach((note, j) => {
                const freq = NOTE_FREQ[note]; if (!freq) return;
                this.playNote(freq, startT + j * 0.15, endT - startT - j * 0.15, 0.08);
            });
        }
        for (let i = 0; i < totalBeats; i++) {
            const melIdx = i % style.melody.length;
            const note = style.melody[melIdx];
            const freq = NOTE_FREQ[note]; if (!freq) continue;
            this.playNote(freq, ctx.currentTime + i * beatDur, beatDur * 0.8, 0.15);
        }
    }
    playNote(freq, startTime, duration, volume) {
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.15);
        gain.gain.setValueAtTime(volume * 0.6, startTime + duration - 0.3);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(startTime); osc.stop(startTime + duration + 0.1);
        this.nodes.push(osc);
    }
}