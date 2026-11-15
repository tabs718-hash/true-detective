import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { fullscreenAvailable, toggleFullscreen, watchFullscreen } from './fullscreen';
import './fullscreen.css';

export function FullscreenControl() {
  const container=useRef<HTMLDivElement>(null);
  const host=typeof document==='undefined'?null:document;
  const [active,setActive]=useState(()=>!!host?.fullscreenElement);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const available=fullscreenAvailable(host);
  useEffect(()=>host?watchFullscreen(host,setActive):undefined,[host]);

  async function toggle() {
    if(!host||busy)return;
    setBusy(true);setError('');
    try { await toggleFullscreen(host,container.current?.closest('dialog')??null); }
    catch { setError('Браузер не разрешил переключить режим. Попробуйте ещё раз или откройте игру отдельной вкладкой.'); }
    finally { setActive(!!host.fullscreenElement);setBusy(false); }
  }

  return <div className="settings-fullscreen" ref={container}>
    <div className="fullscreen-row"><span>Полный экран</span>
      <button className="secondary" type="button" disabled={busy||(!available&&!active)} onClick={()=>void toggle()} aria-pressed={active}>
        {active?<Minimize2 size={16}/>:<Maximize2 size={16}/>}{busy?'Переключение…':active?'Выйти из полного экрана':'На весь экран'}
      </button>
    </div>
    {error?<p className="quiet-note fullscreen-error" role="status">{error}</p>:<p className="quiet-note">{available||active?'Для выхода нажмите Esc или используйте эту кнопку.':'Полноэкранный режим недоступен в этом окне браузера. Откройте игру отдельной вкладкой.'}</p>}
  </div>;
}
