(() => {
  const params = new URLSearchParams(location.search);
  // Enable only after Apple's public listing is verified reachable.
  const iosLive = false;
  const allowedSources = ['tiktok','instagram','youtube','website'];
  const source = allowedSources.includes(params.get('utm_source')) ? params.get('utm_source') : 'website';
  const medium = ['organic','paid','referral'].includes(params.get('utm_medium')) ? params.get('utm_medium') : 'organic';
  const campaign = params.get('utm_campaign') === 'settled_ads' ? 'settled_ads' : 'website';
  const tracking = new URLSearchParams({utm_source:source,utm_medium:medium,utm_campaign:campaign});
  document.querySelectorAll('[data-get], a[href="/get/"]').forEach(a => a.href = '/get/?' + tracking);
  document.querySelectorAll('[data-store]').forEach(a => {
    const store = a.dataset.store;
    const url = new URL(a.href);
    if (store === 'android') url.searchParams.set('referrer', tracking.toString());
    // Apple campaign token is descriptive only: without a verified provider token,
    // do not claim App Store Connect install attribution from it.
    if (store === 'ios') { url.searchParams.set('ct', source + '_' + campaign); url.searchParams.set('mt','8'); }
    a.href = url.toString();
    if (store === 'ios' && !iosLive) {
      const notice = document.createElement('span');
      notice.className = 'store secondary';
      notice.textContent = 'App Store · rolling out';
      notice.setAttribute('role','status');
      a.replaceWith(notice);
      return;
    }
    a.addEventListener('click', () => {
      if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
      const body = JSON.stringify({source,medium,campaign,store,placement:a.dataset.placement});
      fetch('https://us-central1-mindmatch-8d02d.cloudfunctions.net/settledStoreClick', {
        method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'omit'
      }).catch(() => {});
    });
  });
})();
