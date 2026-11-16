// Reads `env(safe-area-inset-*)` as numbers through the hidden #safe-probe element, whose CSS
// padding is those four values. The page needs `viewport-fit=cover` for them to be non-zero.
import type { Insets } from './hud-layout';

export function readSafeInsets(): Insets {
  const probe = document.getElementById('safe-probe');
  if (!probe) return { top: 0, right: 0, bottom: 0, left: 0 };
  const style = getComputedStyle(probe);
  const px = (value: string): number => Number.parseFloat(value) || 0;
  return {
    top: px(style.paddingTop),
    right: px(style.paddingRight),
    bottom: px(style.paddingBottom),
    left: px(style.paddingLeft),
  };
}
