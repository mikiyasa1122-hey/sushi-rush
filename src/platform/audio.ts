import { Effect } from 'effect';

type Sound = 'correct' | 'wrong' | 'rush' | 'start';
type AudioContextLike = AudioContext;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

const createBrowserAudioContext = () => {
  const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error('Web Audio is not supported');
  return new AudioContextConstructor();
};

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
    _createAudio = (src: string) => new Audio(src),
    private readonly speak = speakInBrowser,
    private readonly createContext = createBrowserAudioContext,
  ) {}
  setVoiceEnabled(value: boolean) { this.voiceEnabled = value; }
  setEffectsEnabled(value: boolean) { this.effectsEnabled = value; }
  unlock() {
    let resume: Promise<void>;
    try {
      this.context ??= this.createContext();
      resume = this.context.state === 'running' ? Promise.resolve() : this.context.resume();
    } catch {
      return Promise.resolve(false);
    }
    return Effect.runPromise(Effect.tryPromise({
      try: () => resume.then(() => this.context?.state !== 'suspended'),
      catch: () => false,
    }).pipe(
      Effect.catchAll(() => Effect.succeed(false)),
    ));
  }
  playVoice() {
    if (!this.voiceEnabled) return false;
    return Effect.runSync(Effect.try({
      try: () => { this.speak('Hey Omachi!'); return true; },
      catch: () => false,
    }).pipe(Effect.catchAll(() => Effect.succeed(false))));
  }
  playEffect(sound: Sound) {
    if (!this.effectsEnabled) return false;
    return Effect.runSync(Effect.try({ try: () => {
      this.context ??= this.createContext();
      if (this.context.state === 'suspended' || this.context.state === 'closed') return false;
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
      return true;
    }, catch: () => false }).pipe(Effect.catchAll(() => Effect.succeed(false))));
  }

  playEffectAfterUnlock(sound: Sound) {
    if (this.playEffect(sound)) return Promise.resolve(true);
    return this.unlock().then((unlocked) => unlocked && this.playEffect(sound));
  }
}
