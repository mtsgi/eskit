import ESKitDesktopElement  from "./elements/desktop/main.js";
import ESKitLauncherElement  from "./elements/launcher/main.js";
import ESKitWindowElement    from "./elements/window/main.js";
import ESKitDrawerElement    from "./elements/drawer/main.js";
import ESKitHomeBarElement   from "./elements/home-bar/main.js";

/**
 * ESKitWindowSystem — ウィンドウ・シェル要素の管理
 *
 * ESKitShellMode と連携し、desktop / mobile の 2 モードで
 * ウィンドウの開閉・フォーカス・レイアウトを制御する。
 *
 * desktop モード:
 *   複数ウィンドウをカード形式で同時表示。z-index でフォーカス管理。
 *
 * mobile モード:
 *   アクティブウィンドウを全画面表示、他は非表示。
 *   ホームバーとドロワーで操作する。
 */
export default class ESKitWindowSystem {
  #appElements = new Map(); // uuid → eskit-window element
  #activeUuid  = null;

  constructor() {
    this.system = window.System;
    if (!this.system) throw new Error("[ESKitWindowSystem] System が初期化されていません");

    // Custom Elements の登録
    customElements.define("eskit-window",   ESKitWindowElement);
    customElements.define("eskit-launcher", ESKitLauncherElement);
    customElements.define("eskit-desktop",  ESKitDesktopElement);
    customElements.define("eskit-drawer",   ESKitDrawerElement);
    customElements.define("eskit-home-bar", ESKitHomeBarElement);

    // ─── シェル要素の構築 ──────────────────────────────────────────────

    this.desktopElement = document.createElement("eskit-desktop");
    document.body.appendChild(this.desktopElement);

    // Launcher (dev tool — desktop モードで表示)
    this.launcher = document.createElement("eskit-launcher");
    this.desktopElement.appendChild(this.launcher);

    // Drawer (mobile モードで表示)
    this.drawer = document.createElement("eskit-drawer");
    this.desktopElement.appendChild(this.drawer);

    // HomeBar (mobile モードで表示 — fixed なので desktop 直下に追加)
    this.homeBar = document.createElement("eskit-home-bar");
    this.desktopElement.appendChild(this.homeBar);

    // ─── シェルモードの初期値を適用 ───────────────────────────────────

    this.#applyMode(this.system.shellMode.current);

    // モード変更を購読
    this.system.events.on("shell:mode-changed", ({ mode }) => {
      this.#applyMode(mode);
    });
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /** 現在アクティブなウィンドウの UUID */
  get activeUuid() {
    return this.#activeUuid;
  }

  /**
   * アプリウィンドウを開く。
   * mobile モードでは自動的に activateWindow() を呼んで全画面フォーカスする。
   * @param {string} uuid
   * @returns {ESKitWindowElement|null}
   */
  open(uuid) {
    const appInstance = this.system.getApp(uuid);
    if (!appInstance) {
      console.error(`[ESKitWindowSystem] App not found: ${uuid}`);
      return null;
    }

    const appElement = document.createElement("eskit-window");
    appElement.id = uuid;
    appElement.setAttribute("mode", this.system.shellMode.current);

    this.desktopElement.appendChild(appElement);
    this.#appElements.set(uuid, appElement);

    const shadowRoot = appElement.shadowRoot;

    // タイトル
    shadowRoot.querySelector(".app-title").textContent = appInstance.name;

    // 閉じるボタン
    shadowRoot.querySelector(".btn-close").addEventListener("click", () => {
      this.system.closeApp(uuid);
    });

    // テンプレート
    const templateEl = document.createElement("div");
    templateEl.className = "app-template";
    templateEl.innerHTML = appInstance.template;
    shadowRoot.appendChild(templateEl);

    // スタイル
    if (appInstance.style) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(appInstance.style);
      shadowRoot.adoptedStyleSheets.push(sheet);
    }

    // mobile モードでは即座にフォーカス
    if (this.system.shellMode.isMobile) {
      this.activateWindow(uuid);
    }

    return appElement;
  }

  /**
   * 指定ウィンドウをアクティブにする。
   *
   * desktop モード: z-index を最前面に上げる
   * mobile  モード: active 属性を付与して全画面表示し、他を非表示にする
   *
   * @param {string} uuid
   */
  activateWindow(uuid) {
    const el = this.#appElements.get(uuid);
    if (!el) return;

    const prevUuid = this.#activeUuid;
    this.#activeUuid = uuid;

    if (this.system.shellMode.isMobile) {
      // 全ウィンドウの active を更新
      for (const [id, win] of this.#appElements) {
        win.toggleAttribute("active", id === uuid);
      }
    } else {
      // desktop: z-index でフォーカス
      el.style.zIndex = this.system.nextZIndex();
    }

    if (prevUuid !== uuid) {
      this.system.events.emit("app:focused", { uuid });
    }
  }

  /**
   * UUID に対応するウィンドウ要素を返す。
   * @param {string} uuid
   * @returns {ESKitWindowElement|undefined}
   */
  getElement(uuid) {
    return this.#appElements.get(uuid);
  }

  /**
   * アプリウィンドウを閉じる。
   * @param {string} uuid
   */
  close(uuid) {
    const appElement = this.#appElements.get(uuid);
    if (!appElement) return;

    this.desktopElement.removeChild(appElement);
    this.#appElements.delete(uuid);

    // アクティブウィンドウが閉じられたらリセット
    if (this.#activeUuid === uuid) {
      this.#activeUuid = null;
    }
  }

  // ─── 内部処理 ──────────────────────────────────────────────────────────────

  /**
   * シェルモード切替時に各シェル要素へ mode 属性を反映させる。
   * @param {"desktop"|"mobile"} mode
   */
  #applyMode(mode) {
    // デスクトップ要素
    this.desktopElement.setAttribute("mode", mode);
    // ランチャー・ホームバー (それぞれの CSS が :host([mode="?"]) で表示/非表示)
    this.launcher.setAttribute("mode", mode);
    this.homeBar.setAttribute("mode", mode);

    // 既存の全ウィンドウにもモードを反映
    for (const [, win] of this.#appElements) {
      win.setAttribute("mode", mode);
    }

    // mobile → desktop 切替時: すべてのウィンドウを visible に戻す
    if (mode === "desktop") {
      this.drawer.close();
      for (const [, win] of this.#appElements) {
        win.removeAttribute("active");
      }
    }

    // desktop → mobile 切替時: 最後のアクティブを全画面に
    if (mode === "mobile" && this.#activeUuid) {
      this.activateWindow(this.#activeUuid);
    } else if (mode === "mobile" && this.#appElements.size > 0) {
      // アクティブなし → 一番最後に開いたものをアクティブに
      const lastUuid = [...this.#appElements.keys()].at(-1);
      this.activateWindow(lastUuid);
    }
  }
}

