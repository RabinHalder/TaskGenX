(function () {
  function initData() {
    return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '';
  }

  async function api(path, opts) {
    opts = opts || {};
    var headers = { 'X-Telegram-Init-Data': initData() };
    var body;
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }

    var res;
    try {
      res = await fetch(path, { method: opts.method || 'GET', headers: headers, body: body });
    } catch (e) {
      var ne = new Error(t('err.network'));
      ne.code = 'NETWORK';
      throw ne;
    }

    var json = null;
    try { json = await res.json(); } catch (e) { json = null; }

    if (!res.ok || !json || json.success === false) {
      var code = (json && json.code) || 'ERROR';
      var message = (json && json.message) || t('err.generic');

      // Show a friendly, translated message for known user-side errors
      if (path.indexOf('/api/user') === 0 && I18N.has('e.' + code)) {
        message = t('e.' + code);
      }

      var err = new Error(message);
      err.code = code;
      err.status = res.status;
      throw err;
    }
    return json.data;
  }

  async function apiBlob(path) {
    var res = await fetch(path, { headers: { 'X-Telegram-Init-Data': initData() } });
    if (!res.ok) throw new Error(t('err.generic'));
    return URL.createObjectURL(await res.blob());
  }

  window.api = api;
  window.apiBlob = apiBlob;
})();
