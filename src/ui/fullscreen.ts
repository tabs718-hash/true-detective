export type FullscreenHost = Pick<Document, 'fullscreenEnabled'|'fullscreenElement'|'exitFullscreen'|'addEventListener'|'removeEventListener'> & {
  documentElement: Pick<HTMLElement, 'requestFullscreen'>;
};

export function fullscreenAvailable(host: FullscreenHost | null): boolean {
  return !!host?.fullscreenEnabled && typeof host.documentElement.requestFullscreen === 'function' && typeof host.exitFullscreen === 'function';
}

type FullscreenDialog = Pick<HTMLDialogElement, 'open'|'close'|'showModal'|'isConnected'|'scrollTop'>;

export async function toggleFullscreen(host: FullscreenHost, dialog: FullscreenDialog | null = null): Promise<void> {
  // A fullscreen root can cover an already-open top-layer dialog in Chromium/Safari.
  // Reopen the same mounted dialog after the transition, preserving its scroll.
  const restore=!!dialog?.open;
  const scrollTop=dialog?.scrollTop??0;
  if(restore)dialog!.close();
  try {
  if (host.fullscreenElement) {
    await host.exitFullscreen();
    return;
  }
  if (!fullscreenAvailable(host)) throw new Error('Полноэкранный режим недоступен в этом окне браузера.');
  // Invoke directly from the click handler: browsers require a user gesture.
  // The document root keeps the title, newspaper, game and modal windows together.
  await host.documentElement.requestFullscreen();
  } finally {
    if(restore&&dialog?.isConnected&&!dialog.open){dialog.showModal();dialog.scrollTop=scrollTop;}
  }
}

export function watchFullscreen(host: FullscreenHost, update: (active:boolean)=>void): ()=>void {
  const sync=()=>update(!!host.fullscreenElement);
  host.addEventListener('fullscreenchange',sync);
  return ()=>host.removeEventListener('fullscreenchange',sync);
}
