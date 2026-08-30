type Sound = 'correct' | 'wrong' | 'rush' | 'start';
type AudioContextLike = AudioContext;

const speakInBrowser = (text: string) => {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 1.05;
  utterance.pitch = 1.05;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
};

export class AudioController {
  private voiceEnabled = true;
  private effectsEnabled = true;
  private context?: AudioContextLike;
  constructor(
    private readonly createAudio = (src: string) => new Audio(src),
    private readonly speak = speakInBrowser,
    private readonly createContext = () => new AudioContext(),
  ) {}
  setVoiceEnabled(value: boolean) { this.voiceEnabled = value; }
  setEffectsEnabled(value: boolean) { this.effectsEnabled = value; }
  unlock() {
    try { this.context ??= this.createContext(); void this.context.resume(); return true; }
    catch { return false; }
  }
  playVoice() {
    if (!this.voiceEnabled) return false;
    void this.createAudio(`${import.meta.env.BASE_URL}assets/hey-omachi.mp3`).play().catch(() => this.speak('Hey Omachi!'));
    return true;
  }
  playEffect(sound: Sound) {
    if (!this.effectsEnabled) return false;
    try {
      this.context ??= this.createContext();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const frequencies: Record<Sound, [number, number]> = { correct: [660, 990], wrong: [180, 120], rush: [440, 880], start: [330, 660] };
      const [from, to] = frequencies[sound];
      const now = this.context.currentTime;
      oscillator.type = sound === 'wrong' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(to, now + .14);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.16, now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .2);
      oscillator.connect(gain); gain.connect(this.context.destination);
      oscillator.start(now); oscillator.stop(now + .21);
    } catch { return false; }
    return true;
  }
}
