// prometheus-hub website analytics snippet.
// Include once on any page: <script defer src="https://prometheus-hub.vercel.app/track.js" data-site="your-site-slug"></script>
// Self-hosted, owns no third-party cookies. Stores a random session id in
// localStorage so we can count unique visitors without fingerprinting.
(function () {
  try {
    var s = document.currentScript;
    var site = (s && s.getAttribute("data-site")) || location.hostname.replace(/^www\./, "").split(".")[0];
    var endpoint =
      (s && s.getAttribute("data-endpoint")) ||
      "https://prometheus-hub.vercel.app/api/track";

    function sid() {
      var k = "ph_sid";
      var v = null;
      try { v = localStorage.getItem(k); } catch (e) {}
      if (!v) {
        v = Math.random().toString(36).slice(2) + Date.now().toString(36);
        try { localStorage.setItem(k, v); } catch (e) {}
      }
      return v;
    }

    function send() {
      var url = new URL(location.href);
      var body = {
        site: site,
        path: url.pathname + url.search,
        referrer: document.referrer || undefined,
        utm_source: url.searchParams.get("utm_source") || undefined,
        utm_medium: url.searchParams.get("utm_medium") || undefined,
        utm_campaign: url.searchParams.get("utm_campaign") || undefined,
        session_id: sid(),
      };
      try {
        var b = new Blob([JSON.stringify(body)], { type: "application/json" });
        if (navigator.sendBeacon && navigator.sendBeacon(endpoint, b)) return;
      } catch (e) {}
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(function () {});
    }

    send();

    // SPA: re-send on history changes.
    var lastPath = location.pathname + location.search;
    function maybeSend() {
      var p = location.pathname + location.search;
      if (p !== lastPath) {
        lastPath = p;
        send();
      }
    }
    var ps = history.pushState;
    var rs = history.replaceState;
    history.pushState = function () { ps.apply(this, arguments); setTimeout(maybeSend, 0); };
    history.replaceState = function () { rs.apply(this, arguments); setTimeout(maybeSend, 0); };
    window.addEventListener("popstate", maybeSend);
  } catch (e) {}
})();
