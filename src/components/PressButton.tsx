import { useRef, type ButtonHTMLAttributes, type MouseEvent, type PointerEvent } from 'react';

type PressButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onPointerUp'> & {
  onPress: () => void;
};

const compatibilityClickWindowMs = 750;

export function PressButton({ onPress, disabled, type = 'button', ...props }: PressButtonProps) {
  const lastPointerActivation = useRef(Number.NEGATIVE_INFINITY);

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.isPrimary === false || event.button !== 0) return;
    lastPointerActivation.current = performance.now();
    onPress();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const fromKeyboard = event.detail === 0;
    const hasRecentPointer = performance.now() - lastPointerActivation.current < compatibilityClickWindowMs;
    if (fromKeyboard || !hasRecentPointer) onPress();
  };

  return <button {...props} type={type} disabled={disabled} onPointerUp={handlePointerUp} onClick={handleClick} />;
}
