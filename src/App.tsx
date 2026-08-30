import { useEffect, useState } from 'react';
import { useGame } from './hooks/use-game';
import { SUSHI, sushiById } from './game/sushi';
import type { GameSnapshot, SushiId } from './game/types';
import { LeaderboardRepository, type LeaderboardEntry } from './platform/leaderboard';
import { AudioController } from './platform/audio';
import { safeShare, safeVibrate } from './platform/capabilities';
import { SushiArt } from './components/SushiArt';

type Screen = 'title' | 'howTo' | 'game' | 'ranking' | 'settings';
const repository = new LeaderboardRepository();
const audio = new AudioController();

const BackButton = ({ onBack }: { onBack: () => void }) => <button className="secondary" type="button" onClick={onBack}>もどる</button>;

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [name, setName] = useState('すし職人');
  const [saved, setSaved] = useState(false);
  const [voice, setVoice] = useState(true);
  const [effects, setEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [celebration, setCelebration] = useState(false);
  const game = useGame();

  useEffect(() => { if (screen === 'ranking') void repository.list().then(setEntries); }, [screen]);
  useEffect(() => {
    if (game.snapshot.lastEvent !== 'served') return;
    setCelebration(true); audio.setVoiceEnabled(voice); audio.playVoice();
    if (vibration) safeVibrate([20, 30, 40]);
    const timer = window.setTimeout(() => setCelebration(false), 700);
    return () => window.clearTimeout(timer);
  }, [game.snapshot.served, game.snapshot.lastEvent, voice, vibration]);

  const start = () => { setSaved(false); audio.unlock(); audio.playEffect('start'); game.start(); setScreen('game'); };
  const back = () => setScreen('title');
  const save = async () => { await repository.save({ name, score: game.snapshot.score, playedAt: Date.now() }); setEntries(await repository.list()); setSaved(true); };

  let content: React.ReactNode;
  if (screen === 'howTo') content = <HowTo onBack={back} />;
  else if (screen === 'ranking') content = <Ranking entries={entries} onBack={back} />;
  else if (screen === 'settings') content = <Settings voice={voice} effects={effects} vibration={vibration} setVoice={setVoice} setEffects={setEffects} setVibration={setVibration} onBack={back} />;
  else if (screen === 'game' && game.snapshot.status === 'finished') content = <Result snapshot={game.snapshot} name={name} setName={setName} saved={saved} save={save} retry={start} title={back} />;
  else if (screen === 'game') content = <Game game={game} celebration={celebration} title={back} />;
  else content = <Title start={start} navigate={setScreen} />;

  return <div className="viewport"><div className="landscape-note">縦向きにしてください</div><main className="cabinet">{content}</main></div>;
}

function Title({ start, navigate }: { start: () => void; navigate: (s: Screen) => void }) {
  return <section className="title-screen">
    <div className="lanterns" aria-hidden="true">●　●　●　●　●</div>
    <h1 className="logo" aria-label="SUSHI RUSH"><span>SUSHI</span><strong>RUSH</strong><small>寿司ラッシュ！</small></h1>
    <img className="chef hero-chef" src={`${import.meta.env.BASE_URL}assets/chef.png`} alt="寿司を持って応援する寿司職人" />
    <div className="title-copy"><b>60秒、一本勝負。</b><span>注文どおりに握って、最高の一皿を！</span></div>
    <button className="start-button" type="button" onClick={start}>ゲームスタート</button>
    <div className="menu-grid"><button onClick={() => navigate('howTo')}>遊び方</button><button onClick={() => navigate('ranking')}>ランキング</button><button onClick={() => navigate('settings')}>設定</button></div>
    <p className="catchphrase">＼ Hey Omachi! ／</p>
  </section>;
}

function HowTo({ onBack }: { onBack: () => void }) {
  return <section className="panel-screen"><h1>遊び方</h1><ol className="steps"><li><b>注文を見る</b><span>1〜3貫の注文が3つ並ぶよ</span></li><li><b>寿司をタップ</b><span>注文と同じ寿司をタップしよう</span></li><li><b>連打でコンボ</b><span>60秒でハイスコアを目指せ！</span></li></ol><p className="hint">誤タップはコンボが切れるだけ。焦らず素早く！</p><BackButton onBack={onBack} /></section>;
}

function Ranking({ entries, onBack }: { entries: LeaderboardEntry[]; onBack: () => void }) {
  return <section className="panel-screen"><h1>ローカルランキング</h1>{entries.length ? <ol className="ranking-list">{entries.map((e, i) => <li key={`${e.playedAt}-${i}`}><b>{i + 1}</b><span>{e.name}</span><strong>{e.score.toLocaleString()}</strong></li>)}</ol> : <p className="empty">まだ記録がありません。<br />最初の職人になろう！</p>}<BackButton onBack={onBack} /></section>;
}

interface SettingsProps { voice: boolean; effects: boolean; vibration: boolean; setVoice: (v: boolean) => void; setEffects: (v: boolean) => void; setVibration: (v: boolean) => void; onBack: () => void }
function Settings(p: SettingsProps) {
  return <section className="panel-screen"><h1>設定</h1><div className="settings">
    <label><span>「Hey Omachi!」音声</span><input aria-label="「Hey Omachi!」音声" type="checkbox" checked={p.voice} onChange={(e) => { p.setVoice(e.target.checked); audio.setVoiceEnabled(e.target.checked); }} /></label>
    <label><span>効果音</span><input type="checkbox" checked={p.effects} onChange={(e) => { p.setEffects(e.target.checked); audio.setEffectsEnabled(e.target.checked); }} /></label>
    <label><span>振動</span><input type="checkbox" checked={p.vibration} onChange={(e) => p.setVibration(e.target.checked)} /></label>
  </div><button className="sound-test" onClick={() => { audio.unlock(); audio.playEffect('correct'); audio.playVoice(); }}>音をテスト</button><BackButton onBack={p.onBack} /></section>;
}

function Game({ game, celebration, title }: { game: ReturnType<typeof useGame>; celebration: boolean; title: () => void }) {
  const s = game.snapshot;
  if (s.status === 'paused') return <div className="pause-overlay"><h1>一時停止</h1><button className="start-button" onClick={game.resume}>続ける</button><button className="secondary" onClick={title}>タイトルへ</button></div>;
  const elapsed = 60_000 - s.remainingMs;
  return <section className={`game-screen ${s.remainingMs <= 10_000 ? 'rush' : ''}`}>
    <header className="hud"><div><span>SCORE</span><strong>{s.score.toLocaleString()}</strong></div><div><span>TIME</span><strong>{Math.ceil(s.remainingMs / 1000)}</strong></div><div><span>COMBO</span><strong>×{s.combo}</strong></div><button aria-label="一時停止" onClick={game.pause}>Ⅱ</button></header>
    {s.remainingMs <= 10_000 && <div className="rush-banner">RUSH TIME!</div>}
    <div className="orders" aria-label="注文一覧">{s.orders.map((order, index) => <article className="order-card" key={order.id}><div className="order-head"><b>注文 {index + 1}</b><span>{Math.max(0, Math.ceil((order.expiresAt - elapsed) / 1000))}秒</span></div><div className="order-items">{order.items.map((id, i) => { const done = i < order.filled.length; const sushi = sushiById(id); return <div className={done ? 'mini-sushi done' : 'mini-sushi'} key={`${id}-${i}`}><SushiArt id={id} name={sushi.name} /><small>{sushi.name}</small>{done && <i>済</i>}</div>; })}</div></article>)}</div>
    {celebration && <div className="omachi" role="status">Hey Omachi!<small>GOOD! + SCORE</small></div>}
    <div className="sushi-grid">{SUSHI.map((sushi) => <button aria-label={`${sushi.name}を握る`} style={{ '--sushi-color': sushi.color } as React.CSSProperties} key={sushi.id} onClick={() => { const next = game.tap(sushi.id as SushiId); audio.playEffect(next.lastEvent === 'miss' ? 'wrong' : 'correct'); }}><SushiArt id={sushi.id} name={sushi.name} /><b>{sushi.name}</b></button>)}</div>
    <div className="chef-strip"><img src={`${import.meta.env.BASE_URL}assets/chef.png`} alt="寿司職人" /><p>{s.lastEvent === 'miss' ? 'ドンマイ！次だ！' : s.remainingMs <= 10_000 ? 'ラストスパート！' : 'いいぞ！その調子！'}</p></div>
  </section>;
}

interface ResultProps { snapshot: GameSnapshot; name: string; setName: (v: string) => void; saved: boolean; save: () => void; retry: () => void; title: () => void }
function Result(p: ResultProps) {
  const rank = p.snapshot.score >= 20000 ? 'S' : p.snapshot.score >= 12000 ? 'A' : p.snapshot.score >= 6000 ? 'B' : 'C';
  return <section className="panel-screen result"><h1>おつかれさま！</h1><div className="rank">{rank}</div><p>スコア<strong>{p.snapshot.score.toLocaleString()}</strong></p><div className="result-stats"><span>最高コンボ <b>×{p.snapshot.maxCombo}</b></span><span>提供した注文 <b>{p.snapshot.served}</b></span></div>{!p.saved ? <div className="save-form"><label>職人名<input maxLength={12} value={p.name} onChange={(e) => p.setName(e.target.value)} /></label><button onClick={p.save}>ランキングに保存</button></div> : <p>ランキングに保存しました！</p>}<button className="start-button" onClick={p.retry}>もう一度</button><button className="secondary" onClick={() => void safeShare({ title: 'SUSHI RUSH', text: `SUSHI RUSHで${p.snapshot.score}点！` })}>結果を共有</button><button className="secondary" onClick={p.title}>タイトルへ</button></section>;
}
