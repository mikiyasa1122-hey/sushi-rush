import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { PressButton } from './PressButton';

describe('PressButton', () => {
  it('fires once when a touch pointer is followed by its compatibility click', () => {
    const onPress = vi.fn();
    render(<PressButton onPress={onPress}>寿司</PressButton>);
    const button = screen.getByRole('button', { name: '寿司' });

    fireEvent.pointerUp(button, { pointerId: 1, isPrimary: true, button: 0, pointerType: 'touch' });
    fireEvent.click(button, { detail: 1 });

    expect(onPress).toHaveBeenCalledOnce();
  });

  it('keeps every rapid pointer press while suppressing both generated clicks', () => {
    const onPress = vi.fn();
    render(<PressButton onPress={onPress}>寿司</PressButton>);
    const button = screen.getByRole('button', { name: '寿司' });

    for (const pointerId of [1, 2]) {
      fireEvent.pointerUp(button, { pointerId, isPrimary: true, button: 0, pointerType: 'touch' });
      fireEvent.click(button, { detail: 1 });
    }

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard clicks and ignores non-primary pointers', () => {
    const onPress = vi.fn();
    render(<PressButton onPress={onPress}>寿司</PressButton>);
    const button = screen.getByRole('button', { name: '寿司' });
    const secondaryPointer = createEvent.pointerUp(button, { button: 0 });
    Object.defineProperty(secondaryPointer, 'isPrimary', { value: false });

    fireEvent(button, secondaryPointer);
    fireEvent.click(button, { detail: 0 });

    expect(onPress).toHaveBeenCalledOnce();
  });
});
