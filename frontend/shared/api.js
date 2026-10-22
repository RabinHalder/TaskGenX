/* TaskGenX API client: every request carries Telegram initData for server-side verification. */
(function () {
  "use strict";

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.name = "ApiError";
      this.status = status; // 0 = network problem
      this.code = code;
    }
  }

  function initData() {
    return tg && tg.initData ? tg.initData : "";
  }

  // Builds "?a=1&b=2" and skips empty values.
  function qs(params) {
    const p = new URLSearchParams();
    Object.keys(params || {}).forEach((k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== "") p.append(k, v);
    });
    const s = p.toString();
    return s ? "?" + s : "";
  }

  async function raw(method, path, body, opt) {
    const headers = { "x-telegram-init-data": initData() };
    let payload;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined && body !== null) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (opt && opt.timeout) || 30000);
    let res;
    try {
      res = await fetch("/api" + path, {
        method,
        headers,
        body: payload,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (e) {
      throw new ApiError(0, "network", t("err.network"));
    } finally {
      clearTimeout(timer);
    }

    let data = null;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = null;
    }

    if (!res.ok) {
      const code = (data && data.error) || "error";
      const message = I18n.serverMessage((data && data.message) || t("err.generic"));
      if (res.status === 401) UI.fatal("unauthorized");
      else if (res.status === 403 && code === "banned") UI.fatal("banned", message);
      else if (res.status === 503 && code === "maintenance") UI.fatal("maintenance", message);
      throw new ApiError(res.status, code, message);
    }
    return data;
  }

  async function request(method, path, body, opt) {
    try {
      return await raw(method, path, body, opt);
    } catch (e) {
      // One quiet retry for reads on a network hiccup
      if (method === "GET" && e.status === 0) {
        await sleep(800);
        return raw(method, path, body, opt);
      }
      throw e;
    }
  }

  // Fetches a protected image (needs the auth header) and returns a temporary URL for <img src>.
  async function blobUrl(path) {
    let res;
    try {
      res = await fetch("/api" + path, { headers: { "x-telegram-init-data": initData() } });
    } catch (e) {
      throw new ApiError(0, "network", t("err.network"));
    }
    if (!res.ok) {
      let msg = "";
      try {
        msg = (await res.json()).message;
      } catch (e) {}
      throw new ApiError(res.status, "error", I18n.serverMessage(msg || t("err.generic")));
    }
    return URL.createObjectURL(await res.blob());
  }

  window.API = {
    get: (path, opt) => request("GET", path, undefined, opt),
    post: (path, body, opt) => request("POST", path, body === undefined ? {} : body, opt),
    put: (path, body, opt) => request("PUT", path, body === undefined ? {} : body, opt),
    patch: (path, body, opt) => request("PATCH", path, body === undefined ? {} : body, opt),
    del: (path, opt) => request("DELETE", path, undefined, opt),
    upload: (path, formData) => request("POST", path, formData, { timeout: 60000 }),
    blobUrl,
    qs,
    initData,
    ApiError,
  };
})();
