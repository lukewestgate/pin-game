// When a waiting service worker may take over: never mid-Level (ADR 0003).
export interface LevelActivity {
  /** Taps committed on the current Level; Undo back to the start counts as zero. */
  tapsOnLevel: number;
  /** A win or lose banner is on screen. */
  bannerShowing: boolean;
}

export function isSafeToUpdate(a: LevelActivity): boolean {
  return a.bannerShowing || a.tapsOnLevel === 0;
}
