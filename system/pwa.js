/**
 * Service Worker を登録し、更新の検出とユーザー操作による適用を開始する。
 * ページを離れる際は、定期確認とイベント監視を解除する。
 *
 * @returns {Promise<void>} 登録と監視の初期設定が完了したときに解決する。
 */
export async function initPWA() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    const dispose = watchPWAUpdates(registration);
    const interval = setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

    window.addEventListener("pagehide", () => {
      clearInterval(interval);
      dispose();
    }, { once: true });
  } catch (err) {
    console.warn("[ESKit PWA] Service Worker registration failed:", err);
  }
}

/**
 * 待機中の Service Worker を通知し、明示操作したタブだけに更新を適用する。
 * 更新対象ごとに通知を一度だけ行い、制御切替の確認後に一度だけ再読込する。
 *
 * @internal
 * @param {ServiceWorkerRegistration} registration 監視する登録情報。
 * @param {object} [options={}] 監視に使用するサービスと処理。
 * @param {ServiceWorkerContainer} [options.container] 制御切替を監視するコンテナ。
 * @param {object} [options.system] 翻訳、通知、イベント配信を提供する System。
 * @param {() => void} [options.reload] 現在のタブを再読込する処理。
 * @param {typeof setTimeout} [options.schedule] タイムアウトを登録する処理。
 * @param {typeof clearTimeout} [options.cancel] タイムアウトを解除する処理。
 * @returns {() => void} タイマーと全イベント監視を解除する関数。
 */
export function watchPWAUpdates(registration, {
  container = navigator.serviceWorker,
  system = window.System,
  reload = () => location.reload(),
  schedule = setTimeout,
  cancel = clearTimeout,
} = {}) {
  const notified = new WeakSet();
  const observed = new Map();
  let pending = null;
  let reloaded = false;
  let disposed = false;
  let checking = false;

  /**
   * 更新通知用の文言を翻訳する。
   * @param {string} key 翻訳キー。
   * @returns {string} 翻訳結果。辞書がない場合はキー。
   */
  const t = (key) => system?.i18n?.t(key) ?? key;

  /**
   * 適用待ちのタイマーと制御切替・状態変化の監視を解除する。
   * @returns {void}
   */
  function cleanup() {
    if (!pending) return;

    container.removeEventListener("controllerchange", pending.onController);
    pending.worker.removeEventListener("statechange", pending.onState);
    cancel(pending.timer);
    pending = null;
  }

  /**
   * 更新待ちを終了し、エラー通知と再試行ボタンを表示する。
   * @returns {void}
   */
  function fail() {
    if (disposed) return;

    cleanup();
    system?.notify({
      title: t("pwa.updateTitle"),
      message: t("pwa.updateFailed"),
      type: "error",
      duration: 0,
      action: {
        label: t("pwa.retry"),
        /**
         * 待機中または既に切り替わった更新を再試行し、なければ更新を再確認する。
         * @returns {void}
         */
        onClick: () => {
          if (disposed || pending || reloaded || checking) return;

          if (registration.waiting) {
            apply(registration.waiting);
          } else if (container.controller?.state === "activated" && notified.has(container.controller)) {
            apply(container.controller);
          } else {
            checking = true;
            registration.update()
              .then(() => {
                if (!disposed && !registration.waiting) fail();
                else checkWaiting();
              })
              .catch(() => fail())
              .finally(() => {
                checking = false;
              });
          }
        },
      },
    });
  }

  /**
   * 指定した更新への制御切替を待ち、操作したタブを再読込する。
   * @param {ServiceWorker} worker ユーザーが適用を選択した更新。
   * @returns {void}
   */
  function apply(worker) {
    if (pending || reloaded || disposed) return;

    // 別タブですでに適用されている場合も、明示操作したタブだけを再読込する。
    if (container.controller === worker && worker.state === "activated") {
      reloaded = true;
      reload();
      return;
    }

    if (worker.state === "redundant" || registration.waiting !== worker) {
      fail();
      return;
    }

    let controllerChanged = false;

    /**
     * 対象への制御切替と有効化の両方を確認して、再読込を一度だけ行う。
     * @returns {void}
     */
    const finish = () => {
      if (!controllerChanged || container.controller !== worker || worker.state !== "activated") return;

      cleanup();
      reloaded = true;
      reload();
    };

    /**
     * 対象の Service Worker に制御が切り替わったことを記録する。
     * @returns {void}
     */
    const onController = () => {
      controllerChanged = container.controller === worker;
      finish();
    };

    /**
     * 対象の有効化または失効を検知する。
     * @returns {void}
     */
    const onState = () => {
      if (worker.state === "redundant") fail();
      else finish();
    };

    // 通知後すぐに切り替わっても取りこぼさないよう、送信より先に監視を登録する。
    pending = { worker, onController, onState, timer: null };
    container.addEventListener("controllerchange", onController);
    worker.addEventListener("statechange", onState);
    pending.timer = schedule(fail, 30000);

    try {
      worker.postMessage({ type: "SKIP_WAITING" });
    } catch {
      fail();
    }
  }

  /**
   * 初回インストールを除き、待機中の更新をまだ通知していなければ通知する。
   * @returns {void}
   */
  function checkWaiting() {
    const worker = registration.waiting;
    if (
      disposed ||
      !container.controller ||
      !worker ||
      worker.state !== "installed" ||
      notified.has(worker)
    ) return;

    notified.add(worker);

    system?.notify({
      title: t("pwa.updateTitle"),
      message: t("pwa.updateMessage"),
      icon: "download-cloud",
      duration: 0,
      action: { label: t("pwa.reload"), onClick: () => apply(worker) },
    });
    system?.events?.emit("pwa:update-available", { worker });
  }

  /**
   * インストール中の更新を監視し、待機状態になった時点で通知を確認する。
   * @returns {void}
   */
  function observeInstalling() {
    const worker = registration.installing;
    if (!worker || observed.has(worker)) return;

    /**
     * インストールの完了・失効を確認し、不要になった監視を解除する。
     * @returns {void}
     */
    const onState = () => {
      checkWaiting();
      if (worker.state === "installed" || worker.state === "redundant") {
        worker.removeEventListener("statechange", onState);
        observed.delete(worker);
      }
    };

    observed.set(worker, onState);
    worker.addEventListener("statechange", onState);
    onState();
  }

  // ページを開いた時点で既にインストール中・待機中の更新も確認する。
  registration.addEventListener("updatefound", observeInstalling);
  observeInstalling();
  checkWaiting();

  /**
   * 全監視を終了し、後から完了した更新による再読込を防ぐ。
   * @returns {void}
   */
  return () => {
    disposed = true;
    cleanup();
    registration.removeEventListener("updatefound", observeInstalling);
    for (const [worker, listener] of observed) {
      worker.removeEventListener("statechange", listener);
    }
    observed.clear();
  };
}
