/**
 * ESKit PWA 管理モジュール
 *
 * Service Worker の登録、ライフサイクル監視、アップデート通知を担当。
 */

export async function initPWA() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("./sw.js", {
      scope: "./",
    });

    // 更新検知
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          // 既存の SW が存在し、新しい SW がインストールされた場合 → 更新トースト通知
          notifyUpdateAvailable(newWorker);
        }
      });
    });

    // 定期的な更新チェック (1 時間ごと)
    setInterval(() => {
      registration.update().catch(() => {});
    }, 60 * 60 * 1000);

  } catch (err) {
    console.warn("[ESKit PWA] Service Worker registration failed:", err);
  }
}

function notifyUpdateAvailable(worker) {
  const i18n = window.System?.i18n;
  const title = i18n?.t("pwa.updateTitle") || "システムアップデート";
  const message = i18n?.t("pwa.updateMessage") || "新しいバージョンが利用可能です。再読み込みして適用しますか？";

  window.System?.notify({
    title,
    message,
    icon: "download-cloud",
    duration: 10000,
    action: {
      label: i18n?.t("pwa.reload") || "再読み込み",
      onClick: () => {
        worker.postMessage({ type: "SKIP_WAITING" });
        location.reload();
      },
    },
  });

  window.System?.events?.emit("pwa:update-available", { worker });
}
