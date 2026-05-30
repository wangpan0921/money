(function () {
  // 统一指向站点根目录下的 api/,这样不管 tracker.js 被哪一层的子应用引用,
  // 请求都会落到同一个后端。
  const ENDPOINT = new URL("/api/track.php", location.href).toString();
  const GEO_ENDPOINT = "https://ipapi.co/json/";
  const GEO_CACHE_KEY = "geo-cache-v1";
  const GEO_TTL_MS = 24 * 60 * 60 * 1000;  // 缓存 24 小时，避免触发 ipapi 限频

  let geoPromise = null;

  function getGeo() {
    if (geoPromise) return geoPromise;

    // 读缓存
    try {
      const raw = localStorage.getItem(GEO_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && Date.now() - cached.t < GEO_TTL_MS) {
          geoPromise = Promise.resolve(cached.data);
          return geoPromise;
        }
      }
    } catch (_) {}

    geoPromise = fetch(GEO_ENDPOINT, { mode: "cors" })
      .then((res) => res.ok ? res.json() : null)
      .then((info) => {
        if (!info) return null;
        const data = {
          country: info.country_name || info.country || null,
          region: info.region || null,
          city: info.city || null,
        };
        try {
          localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
        } catch (_) {}
        return data;
      })
      .catch(() => null);

    return geoPromise;
  }

  async function track(eventType) {
    if (!eventType) return;
    let geo = null;
    try { geo = await getGeo(); } catch (_) {}

    const body = JSON.stringify({
      event_type: eventType,
      country:   geo && geo.country,
      region:    geo && geo.region,
      city:      geo && geo.city,
    });

    try {
      // keepalive 让请求在页面关闭时也能完成
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    } catch (_) {
      // 静默失败，绝不影响业务
    }
  }

  // 预热：尽早拿到 geo，按钮点击时就不用再等了
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", getGeo);
  } else {
    getGeo();
  }

  window.Tracker = { track };
})();
