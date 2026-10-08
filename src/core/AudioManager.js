export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this._cachedNoiseBuffer = null;
    this._hum = null;
  }

  resume() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  _noiseBuffer() {
    if (!this._cachedNoiseBuffer) {
      const length = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this._cachedNoiseBuffer = buffer;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = this._cachedNoiseBuffer;
    return source;
  }

  startKeyholeHum() {
    if (!this.ctx) return;
    if (this._hum) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 180;

    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);

    this._hum = { osc, gain, lfo };
  }

  stopKeyholeHum() {
    if (!this.ctx) return;
    if (!this._hum) return;

    const { osc, gain, lfo } = this._hum;
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.08);
    osc.stop(now + 0.1);
    lfo.stop(now + 0.1);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      lfo.disconnect();
    };

    this._hum = null;
  }

  playArcZap() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  playPlasmaBurst() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const noise = this._noiseBuffer();
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    const body = this.ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(90, now);
    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.08, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    body.connect(bodyGain);
    bodyGain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.15);
    body.start(now);
    body.stop(now + 0.15);
    noise.onended = () => {
      noise.disconnect();
      noiseGain.disconnect();
    };
    body.onended = () => {
      body.disconnect();
      bodyGain.disconnect();
    };
  }

  playImpact() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    const noise = this._noiseBuffer();
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
    noise.start(now);
    noise.stop(now + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    noise.onended = () => {
      noise.disconnect();
      noiseGain.disconnect();
    };
  }

  playOverheatAlarm() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "square";
    const gain = this.ctx.createGain();

    const beepLen = 0.075;
    for (let i = 0; i < 4; i++) {
      const t = now + i * beepLen;
      const freq = i % 2 === 0 ? 880 : 660;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.setValueAtTime(0.0001, t + beepLen * 0.8);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  playDoorCut() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    const noise = this._noiseBuffer();
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
    noise.start(now);
    noise.stop(now + 0.25);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    noise.onended = () => {
      noise.disconnect();
      noiseGain.disconnect();
    };
  }

  playAllyBark() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(700, now);
    osc.frequency.setValueAtTime(950, now + 0.06);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.07);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  playHealChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [660, 880, 1100];
    const noteLen = 0.07;

    notes.forEach((freq, i) => {
      const t = now + i * noteLen;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + noteLen + 0.02);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }

  playLowHpHeartbeat() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [0, 0.08].forEach((offset) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.07);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }
}
