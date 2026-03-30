import ESKitDesktopElement       from "./elements/desktop/main.js";
import ESKitLauncherElement      from "./elements/launcher/main.js";
import ESKitWindowElement        from "./elements/window/main.js";
import ESKitDrawerElement        from "./elements/drawer/main.js";
import ESKitHomeBarElement       from "./elements/home-bar/main.js";
import ESKitTaskbarElement       from "./elements/taskbar/main.js";
import ESKitContextMenuElement   from "./elements/context-menu/main.js";
import ESKitBeaconElement        from "./elements/beacon/main.js";
import ESKitQuickSettingsElement from "./elements/quick-settings/main.js";

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
  #cascadeIndex = 0;

  constructor() {
    this.system = window.System;
    if (!this.system) throw new Error("[ESKitWindowSystem] System が初期化されていません");

    // Custom Elements の登録
    customElements.define("eskit-window",         ESKitWindowElement);
    customElements.define("eskit-launcher",       ESKitLauncherElement);
    customElements.define("eskit-desktop",        ESKitDesktopElement);
    customElements.define("eskit-drawer",         ESKitDrawerElement);
    customElements.define("eskit-home-bar",       ESKitHomeBarElement);
    customElements.define("eskit-taskbar",        ESKitTaskbarElement);
    customElements.define("eskit-context-menu",   ESKitContextMenuElement);
    customElements.define("eskit-beacon",         ESKitBeaconElement);
    customElements.define("eskit-quick-settings", ESKitQuickSettingsElement);

    // ─── シェル要素の構築 ──────────────────────────────────────────────

    this.desktopElement = document.createElement("eskit-desktop");
    document.body.appendChild(this.desktopElement);

    // Taskbar (desktop モードで表示 — 画面下部固定)
    this.taskbar = document.createElement("eskit-taskbar");
    this.desktopElement.appendChild(this.taskbar);

    // Launcher (desktop モードでオーバーレイ表示)
    this.launcher = document.createElement("eskit-launcher");
    this.desktopElement.appendChild(this.launcher);

    // Drawer (mobile モードで表示)
    this.drawer = document.createElement("eskit-drawer");
    this.desktopElement.appendChild(this.drawer);

    // HomeBar (mobile モードで表示 — fixed なので desktop 直下に追加)
    this.homeBar = document.createElement("eskit-home-bar");
    this.desktopElement.appendChild(this.homeBar);

    // Context Menu (右クリックメニュー)
    this.contextMenu = document.createElement("eskit-context-menu");
    this.desktopElement.appendChild(this.contextMenu);

    // Beacon (グローバル検索)
    this.beacon = document.createElement("eskit-beacon");
    this.desktopElement.appendChild(this.beacon);

    // Quick Settings (クイック設定パネル)
    this.quickSettings = document.createElement("eskit-quick-settings");
    this.desktopElement.appendChild(this.quickSettings);

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

    // カスケード配置 (desktop モード)
    if (!this.system.shellMode.isMobile) {
      const offset = 30 + 28 * (this.#cascadeIndex % 10);
      appElement.style.left   = `${offset}px`;
      appElement.style.top    = `${offset}px`;
      appElement.style.width  = "640px";
      appElement.style.height = "480px";
      this.#cascadeIndex++;
    }

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
    if (appInstance.template instanceof DocumentFragment) {
      // Hamon テンプレート: リアクティブ DocumentFragment
      if (appInstance.template._scope) {
        appInstance._hamonScope = appInstance.template._scope;
      }
      templateEl.appendChild(appInstance.template);
    } else {
      // 従来の文字列テンプレート (後方互換)
      templateEl.innerHTML = appInstance.template;
    }
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
    } else {
      appElement.focus();
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
      // desktop: z-index でフォーカス + focused クラス
      el.focus();
      // 最小化されていたら復元
      if (el._state === "minimized") {
        el.restore();
      }
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
   * 全ウィンドウ要素を Map として返す。
   * @returns {Map<string, ESKitWindowElement>}
   */
  _getAllElements() {
    // 防御的コピーを返すことで、呼び出し側から内部状態を直接変更できないようにする
    return new Map(this.#appElements);
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
    // シェル要素 (それぞれの CSS が :host([mode="?"]) で表示/非表示)
    this.taskbar.setAttribute("mode", mode);
    this.launcher.setAttribute("mode", mode);
    this.homeBar.setAttribute("mode", mode);

    // 既存の全ウィンドウにもモードを反映
    for (const [, win] of this.#appElements) {
      win.setAttribute("mode", mode);
    }

    // mobile → desktop 切替時: すべてのウィンドウを visible に戻す
    if (mode === "desktop") {
      this.drawer.close();
      this.launcher.hide();
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

  // ─── スナッププレビュー ────────────────────────────────────────────────────

  /**
   * ドラッグ中にスナップ先のプレビューオーバーレイを表示する。
   * @param {"maximize"|"left"|"right"|null} zone — null で非表示
   */
  showSnapPreview(zone) {
    if (!zone) {
      this.#hideSnapPreview();
      return;
    }

    let el = this.#snapPreviewEl;
    if (!el) {
      el = document.createElement("div");
      el.className = "eskit-snap-preview";
      document.body.appendChild(el);
      this.#snapPreviewEl = el;
    }

    const tbH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--eskit-taskbar-height") || "48", 10);
    el.style.display = "block";

    if (zone === "maximize") {
      el.style.left   = "4px";
      el.style.top    = "4px";
      el.style.width  = `calc(100vw - 8px)`;
      el.style.height = `calc(100vh - ${tbH}px - 8px)`;
    } else if (zone === "left") {
      el.style.left   = "4px";
      el.style.top    = "4px";
      el.style.width  = `calc(50vw - 6px)`;
      el.style.height = `calc(100vh - ${tbH}px - 8px)`;
    } else if (zone === "right") {
      el.style.left   = `calc(50vw + 2px)`;
      el.style.top    = "4px";
      el.style.width  = `calc(50vw - 6px)`;
      el.style.height = `calc(100vh - ${tbH}px - 8px)`;
    }
  }

  #snapPreviewEl = null;

  #hideSnapPreview() {
    if (this.#snapPreviewEl) {
      this.#snapPreviewEl.style.display = "none";
    }
  }

  // ─── スナップアシスト ──────────────────────────────────────────────────────

  /**
   * スナップ後に残り半分に割り当てるアプリ候補パネルを表示する。
   * @param {"left"|"right"} snappedSide — スナップされた側 (候補パネルは反対側に出る)
   * @param {string} snappedUuid — スナップしたウィンドウの UUID
   */
  showSnapAssist(snappedSide, snappedUuid) {
    this.#hideSnapAssist();

    // 反対側にすでにスナップ済みのウィンドウがある場合は表示しない
    const oppSide = snappedSide === "left" ? "right" : "left";
    const oppOccupied = [...this.#appElements.values()].some(
      win => win.classList.contains(`snapped-${oppSide}`)
    );
    if (oppOccupied) return;

    const candidates = [...this.#appElements.entries()].filter(
      ([uuid, win]) => uuid !== snappedUuid && win._state !== "minimized"
    );

    if (candidates.length === 0) return;

    const panel = document.createElement("div");
    panel.className = "eskit-snap-assist";
    const tbH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--eskit-taskbar-height") || "48", 10);

    // 反対側に配置
    if (snappedSide === "left") {
      panel.style.left   = "50%";
      panel.style.top    = "0";
      panel.style.width  = "50%";
      panel.style.height = `calc(100vh - ${tbH}px)`;
    } else {
      panel.style.left   = "0";
      panel.style.top    = "0";
      panel.style.width  = "50%";
      panel.style.height = `calc(100vh - ${tbH}px)`;
    }

    const title = document.createElement("div");
    title.className = "eskit-snap-assist-title";
    title.textContent = "割り当てるアプリを選択";
    panel.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "eskit-snap-assist-grid";

    for (const [uuid, win] of candidates) {
      const app = this.system.getApp(uuid);
      const btn = document.createElement("button");
      btn.className = "eskit-snap-assist-item";
      btn.textContent = app?.name ?? uuid;
      btn.addEventListener("click", () => {
        const oppositeSide = snappedSide === "left" ? "right" : "left";
        win.snap(oppositeSide);
        this.activateWindow(uuid);
        this.#hideSnapAssist();
      });
      grid.appendChild(btn);
    }

    panel.appendChild(grid);

    // 背景クリックで閉じる
    const backdrop = document.createElement("div");
    backdrop.className = "eskit-snap-assist-backdrop";
    backdrop.addEventListener("click", () => this.#hideSnapAssist());

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    this.#snapAssistEl = { panel, backdrop };
  }

  #snapAssistEl = null;

  #hideSnapAssist() {
    if (this.#snapAssistEl) {
      this.#snapAssistEl.panel.remove();
      this.#snapAssistEl.backdrop.remove();
      this.#snapAssistEl = null;
    }
  }
}

