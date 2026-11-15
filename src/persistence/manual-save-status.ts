import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState } from '../engine/types';

// Session metadata only. This never writes a second slot or an automatic save.
export function saveSnapshot(game: GameState): string {
  return JSON.stringify(game);
}

export function hasUnsavedChanges(game: GameState | null, snapshot: string | null): boolean {
  return !!game && !game.endingId && saveSnapshot(game) !== snapshot;
}

export function guardUnsavedChanges(target: EventTarget, dirty: boolean): () => void {
  if (!dirty) return () => {};
  const warn = (event: Event) => {
    event.preventDefault();
    // Browsers supply their own warning text; this is the legacy trigger.
    (event as BeforeUnloadEvent).returnValue = true;
  };
  target.addEventListener('beforeunload', warn);
  return () => target.removeEventListener('beforeunload', warn);
}

export function useManualSaveStatus(game: GameState | null) {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const dirty = useMemo(() => hasUnsavedChanges(game, snapshot), [game, snapshot]);
  const markSaved = useCallback((saved: GameState) => setSnapshot(saveSnapshot(saved)), []);
  const forget = useCallback(() => setSnapshot(null), []);
  useEffect(() => guardUnsavedChanges(window, dirty), [dirty]);
  return { dirty, markSaved, forget };
}
