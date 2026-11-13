import { useEffect } from 'react';

/** Keep the focused editor field visible when Android changes the WebView size. */
export function useKeyboardViewport() {
 useEffect(()=>{
  let baseline=window.innerHeight;let timer:ReturnType<typeof setTimeout>;
  const update=()=>{
   clearTimeout(timer);
   timer=setTimeout(()=>{
    const viewport=window.visualViewport;
    const height=viewport?.height||window.innerHeight;
    const element=document.activeElement as HTMLElement|null;
    const editing=!!element?.matches('input:not([type="checkbox"]):not([type="radio"]),textarea,select');
    baseline=Math.max(baseline,window.innerHeight,height);
    const open=editing&&baseline-height>120;
    document.documentElement.classList.toggle('keyboard-open',open);
    if(open&&element){
     const rect=element.getBoundingClientRect();
     const top=(viewport?.offsetTop||0)+80,bottom=(viewport?.offsetTop||0)+height-24;
     if(rect.top<top||rect.bottom>bottom)element.scrollIntoView({block:'center',behavior:'instant'});
    }
   },80);
  };
  const orientation=()=>{baseline=window.innerHeight;update();};
  window.visualViewport?.addEventListener('resize',update);
  window.addEventListener('resize',update);window.addEventListener('orientationchange',orientation);
  document.addEventListener('focusin',update);document.addEventListener('focusout',update);
  return()=>{clearTimeout(timer);document.documentElement.classList.remove('keyboard-open');window.visualViewport?.removeEventListener('resize',update);window.removeEventListener('resize',update);window.removeEventListener('orientationchange',orientation);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);};
 },[]);
}
