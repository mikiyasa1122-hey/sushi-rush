export async function safeShare(data: ShareData, nav: Navigator = navigator) {
  try {
    if (!nav.share) return false;
    await nav.share(data);
    return true;
  } catch { return false; }
}

export function safeVibrate(pattern: number | number[], nav: Navigator = navigator) {
  try { return typeof nav.vibrate === 'function' ? nav.vibrate(pattern) : false; }
  catch { return false; }
}

export async function safeFullscreen(element: HTMLElement = document.documentElement) {
  try { if (!element.requestFullscreen) return false; await element.requestFullscreen(); return true; }
  catch { return false; }
}
