// Applies a waiting service worker at a safe moment only (ADR 0003). No toast.
import { registerSW } from 'virtual:pwa-register';
import { isSafeToUpdate, type LevelActivity } from './safe-moment';

export interface Updater {
  /** Call whenever Level activity changes (tap, Undo, Restart, banner shown). */
  recheck(): void;
}

export function startUpdater(activity: () => LevelActivity): Updater {
  let waiting = false;
  let applying = false;

  function recheck(): void {
    if (!waiting || applying || !isSafeToUpdate(activity())) return;
    applying = true;
    void apply(true);
  }

  const apply = registerSW({
    onNeedRefresh() {
      waiting = true;
      recheck();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update();
      });
    },
  });

  return { recheck };
}
