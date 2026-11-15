export function gameShortcut(event: Pick<KeyboardEvent, 'key'|'ctrlKey'|'metaKey'|'altKey'|'repeat'|'isComposing'>, playing: boolean, modalOpen: boolean, busy: boolean): 'save'|'guide'|'blocked'|null {
  if (event.isComposing || event.altKey) return null;
  const command = event.key === 'F1' && !event.ctrlKey && !event.metaKey ? 'guide'
    : playing && (event.ctrlKey || event.metaKey) && ['s','S','ы','Ы'].includes(event.key) ? 'save' : null;
  if (!command) return null;
  // Keep the current dialogue, note or confirmation open, and suppress browser Save As.
  return busy || modalOpen || event.repeat ? 'blocked' : command;
}
