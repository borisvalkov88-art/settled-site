(() => {
  const params = new URLSearchParams(location.search);
  const allowedSources = ['tiktok', 'instagram', 'youtube', 'website', 'test'];
  const source = allowedSources.includes(params.get('utm_source')) ? params.get('utm_source') : 'website';
  const medium = ['organic', 'paid', 'referral', 'test'].includes(params.get('utm_medium')) ? params.get('utm_medium') : 'organic';
  const clean = (value, fallback) => value && /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : fallback;
  const campaign = clean(params.get('utm_campaign'), 'website');
  const content = clean(params.get('utm_content'), '');
  const tracking = new URLSearchParams({utm_source: source, utm_medium: medium, utm_campaign: campaign});
  if (content) tracking.set('utm_content', content);

  // Apple limits campaign tokens to 30 characters. The stable suffix identifies
  // the complete source/medium/campaign/content tuple; mappings live in the ad log.
  let hash = 2166136261;
  for (const char of tracking.toString()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const appleCampaign = source + '_' + medium[0] + '_' + hash.toString(16).padStart(8, '0');
  // Issued by App Store Connect's campaign builder for FBG START LTD, 9 Sep 2026.
  const appleProvider = '129083138';

  document.querySelectorAll('[data-get], a[href="/get/"]').forEach(a => {
    a.href = '/get/?' + tracking;
  });
  document.querySelectorAll('[data-store]').forEach(a => {
    const url = new URL(a.href);
    if (a.dataset.store === 'android') url.searchParams.set('referrer', tracking.toString());
    if (a.dataset.store === 'ios') {
      url.searchParams.set('pt', appleProvider);
      url.searchParams.set('ct', appleCampaign);
      url.searchParams.set('mt', '8');
    }
    a.href = url.toString();
  });
  // No cookies, event collection or in-app analytics added by this routing code.
})();
