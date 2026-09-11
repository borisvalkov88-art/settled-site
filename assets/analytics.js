/* Website-only measurement. No Google request before an explicit opt-in. */
(() => {
  'use strict';
  const id = document.querySelector('meta[name="settled-analytics-id"]')?.content || '';
  if (!/^G-[A-Z0-9]+$/.test(id)) return; // Remain inactive until a real stream is configured.
  const key = 'settled-analytics-choice-v1';
  const params = new URLSearchParams(location.search);
  const test = params.get('utm_source') === 'test' || params.get('utm_medium') === 'test';
  const read = () => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const save = value => { try { localStorage.setItem(key, JSON.stringify({value,at:Date.now()})); } catch {} };
  const stored = read();
  const previous = stored && ['yes','no'].includes(stored.value) && Number.isFinite(stored.at) && stored.at <= Date.now() && Date.now()-stored.at < 180*86400000 ? stored : null;
  let allowed = previous?.value === 'yes' && Date.now()-previous.at < 180*86400000;
  let started = false;
  function cleanLocation() {
    const u = new URL(location.pathname, location.origin);
    for (const k of ['utm_source','utm_medium','utm_campaign','utm_content']) {
      const v=params.get(k); if(v && /^[a-zA-Z0-9_-]{1,128}$/.test(v)) u.searchParams.set(k,v);
    }
    return u.href;
  }
  function start() {
    if(started || !allowed || test) return;
    started=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('js',new Date());
    window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:cleanLocation(),page_referrer:''});
    window.gtag('event','page_view',{page_location:cleanLocation(),page_title:document.title,page_referrer:''});
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(script);
  }
  function clearCookies(){
    for(const entry of document.cookie.split(';')){
      const n=entry.trim().split('=')[0];if(!/^_ga(?:_|$)/.test(n))continue;
      for(const domain of ['',location.hostname,'.'+location.hostname])document.cookie=n+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'');
    }
  }
  function choose(value){
    allowed=value;save(value?'yes':'no');
    panel.remove();
    if(value)start();
    else if(started){window['ga-disable-'+id]=true;clearCookies();location.reload();}
  }
  const style=document.createElement('style');style.textContent='.settled-consent{position:fixed;inset:auto 16px 16px;z-index:9999;max-width:540px;padding:18px;background:#fffaf1;color:#342b20;border:1px solid #b6a88f;border-radius:14px;box-shadow:0 4px 24px #0002;font:16px/1.45 system-ui}.settled-consent p{margin:0 0 12px}.settled-consent button,.settled-settings{font:inherit;cursor:pointer}.settled-consent button{padding:10px 16px;margin-right:8px;background:#fffaf1;color:#342b20;border:1px solid #342b20;border-radius:8px}.settled-settings{display:block;margin:16px auto;background:none;color:inherit;border:0;text-decoration:underline}';document.head.append(style);
  const panel=document.createElement('section');panel.className='settled-consent';panel.setAttribute('aria-label','Optional website analytics');
  panel.innerHTML='<p>Help us improve Settled? With your permission, Google Analytics counts website visits and store-link clicks using analytics cookies. No advertising tracking. <a href="/privacy.html#website">Details</a></p>';
  for(const [label,value] of [['No thanks',false],['Allow analytics',true]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>choose(value));panel.append(b);}
  const settings=document.createElement('button');settings.className='settled-settings';settings.type='button';settings.textContent='Analytics preferences';settings.addEventListener('click',()=>{document.body.append(panel);panel.querySelector('button').focus();});document.body.append(settings);
  if(!test && (!previous || Date.now()-previous.at >= 180*86400000))document.body.append(panel);
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[data-store]');
    if(!a || !allowed || !started || test) return;
    const store=a.dataset.store;
    if(!['ios','android'].includes(store))return;
    window.gtag('event','store_click',{store,link_url:store==='ios'?'https://apps.apple.com/app/id6806383640':'https://play.google.com/store/apps/details?id=com.fbgstart.discipline',page_location:cleanLocation(),transport_type:'beacon'});
  });
  start();
})();
