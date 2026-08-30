import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App title navigation', () => {
  it('shows the title and opens the how-to-play screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'SUSHI RUSH' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ゲームスタート' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '遊び方' }));
    expect(screen.getByRole('heading', { name: '遊び方' })).toBeInTheDocument();
    expect(screen.getByText(/注文と同じ寿司をタップ/)).toBeInTheDocument();
  });

  it('starts the game, serves sushi, and pauses', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'ゲームスタート' }));
    expect(screen.getByText('TIME')).toBeInTheDocument();
    const sushiButtons = screen.getAllByRole('button', { name: /を握る/ });
    expect(sushiButtons).toHaveLength(12);
    expect(sushiButtons.every((button) => button.querySelector('svg[role="img"]'))).toBe(true);
    await user.click(screen.getByRole('button', { name: '一時停止' }));
    expect(screen.getByRole('heading', { name: '一時停止' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '続ける' }));
    expect(screen.getByText('TIME')).toBeInTheDocument();
  });

  it('opens ranking and settings from the title', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'ランキング' }));
    expect(screen.getByRole('heading', { name: 'ローカルランキング' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'もどる' }));
    await user.click(screen.getByRole('button', { name: '設定' }));
    expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '「Hey Omachi!」音声' })).toBeChecked();
    expect(screen.getByRole('button', { name: '音をテスト' })).toBeInTheDocument();
  });
});
