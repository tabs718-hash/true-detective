export function dialogueAdvance({readOnly, all, last, typing}: {readOnly:boolean;all:boolean;last:boolean;typing:boolean}): 'close'|'reveal'|'finish'|'next' {
  if (readOnly) return 'close';
  if (!all && typing) return 'reveal';
  return all || last ? 'finish' : 'next';
}
