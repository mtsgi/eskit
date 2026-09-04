/**
 * ESKit Service Worker (PWA)
 *
 * キャッシュ戦略: Network-First (フォールバックで Cache)
 * - オンライン時は常に最新リソースを直接取得しキャッシュを最新化
 * - オフライン・通信切断時は Service Worker のキャッシュから応答
 */

const CACHE_NAME = "eskit-pwa-v1";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./main.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./system/kitstrap2.css",
  "./system/kitstrap2.js",
  "./system/main.css",
  "./system/util.js",
  "./system/event-bus.js",
  "./system/filesystem.js",
  "./system/manifest.js",
  "./system/permissions.js",
  "./system/registry.js",
  "./system/shell-mode.js",
  "./system/app.js",
  "./system/system.js",
  "./system/window.js",
  "./system/hamon.js",
  "./system/users.js",
  "./system/icons.js",
  "./system/theme.js",
  "./system/i18n.js",
  "./system/i18n/ja.json",
  "./system/i18n/en.json",
  "./system/elements/file-picker/main.js",
  "./system/elements/file-picker/template.js",
  "./system/elements/file-picker/style.js",
  "./system/themes/presets.js",
  "./system/pwa.js",
  "./apps/filemanager/i18n/ja.json",
  "./apps/filemanager/i18n/en.json",
  "./apps/notepad/i18n/ja.json",
  "./apps/notepad/i18n/en.json",
  "./apps/calculator/i18n/ja.json",
  "./apps/calculator/i18n/en.json",
  "./apps/clock/i18n/ja.json",
  "./apps/clock/i18n/en.json",
  "./apps/welcome/i18n/ja.json",
  "./apps/welcome/i18n/en.json",
];

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 一部のリソースが 404 でも全体が失敗しないよう個別にキャッシュ試行
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[ESKit SW] Pre-cache failed for ${url}:`, err);
          })
        )
      );
    })
  );
  // 新しい SW の即時待機解除
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch (Network-First) ──────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // GET リクエスト以外、または chrome-extension などの非 HTTP スキームは無視
  if (req.method !== "GET" || !req.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // 1. ネットワークから取得を試行
        const networkResponse = await fetch(req);

        // 成功したレスポンスをキャッシュへ非同期更新
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          }).catch(() => {});
        }

        return networkResponse;
      } catch (networkError) {
        // 2. ネットワーク失敗時はキャッシュからフォールバック
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }

        // HTML リクエストの場合はルート index.html をフォールバック
        if (req.headers.get("accept")?.includes("text/html")) {
          const fallbackIndex = await caches.match("./index.html");
          if (fallbackIndex) return fallbackIndex;
        }

        throw networkError;
      }
    })()
  );
});

// ─── Message Handling ───────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
