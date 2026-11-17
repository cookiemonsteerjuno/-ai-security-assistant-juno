class AudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted = false;
  public speechRate = 1.05;
  public speechVolume = 1.0;

  public playChime(isCritical = false) {
    if (this.isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isCritical ? 'sawtooth' : 'sine';
      if (isCritical) {
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.08);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.2);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.16 * this.speechVolume, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(1120, now + 0.12);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.14 * this.speechVolume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      }
    } catch {
      // Safe fallback prior to user gesture
    }
  }

  public speak(text: string, isCritical = false) {
    this.playChime(isCritical);
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = this.speechRate;
      u.volume = this.speechVolume;
      u.pitch = isCritical ? 1.12 : 1.0;
      window.speechSynthesis.speak(u);
    } catch {
      // Ignore synthesis error
    }
  }
}

export const audioEngine = new AudioEngine();
