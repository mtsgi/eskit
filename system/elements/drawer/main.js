import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitDrawerElement — アプリドロワー
 *
 * モバイルモード時に表示されるアプリ一覧オーバーレイ。
 * 実行中アプリへの切り替えと、未起動アプリの起動が可能。
 *
 * 属性:
 *   open — ドロワーが開いているかどうか (boolean attribute)
 *
 * イベント (System.events):
 *   drawer:open  — ドロワーが開かれた
 *   drawer:close — ドロワーが閉じられた
 */
export default class ESKitDrawerElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    // クイック設定ボタン
    this.shadowRoot.getElementById("qs-btn").addEventListener("click", () => {
      this.close();
      window.System?.WindowSystem?.quickSettings?.toggle();
    });
    // スポットライト検索ボタン
    this.shadowRoot.getElementById("beacon-btn").addEventListener("click", () => {
      this.close();
      window.System?.WindowSystem?.beacon?.show();
    });
    // オーバーレイ背景クリックで閉じる
    this.addEventListener("click", e => {
      if (e.target === this) this.close();
    });
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  /** ドロワーを開く (内容をリフレッシュしてから表示) */
  open() {
    this.#refresh();
    this.#updateTime();
    this.setAttribute("open", "");
    window.System?.events.emit("drawer:open");
  }

  /** ドロワーを閉じる */
  close() {
    this.removeAttribute("open");
    window.System?.events.emit("drawer:close");
  }

  /** ドロワーの開閉をトグルする */
  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  // ─── 内容の更新 ────────────────────────────────────────────────────────────

  /** 開くたびに実行中アプリ・全アプリ一覧を再描画する */
  #refresh() {
    const sys = window.System;
    if (!sys) return;
    this.#renderRunning(sys.listProcesses());
    this.#renderAllApps(sys.registry.list());
  }

  /** トップバーの時刻表示を更新する */
  #updateTime() {
    const el = this.shadowRoot.getElementById("drawer-time");
    if (!el) return;
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  #renderRunning(processes) {
    const list = this.shadowRoot.getElementById("running-list");
    if (!list) return;
    list.innerHTML = "";

    if (processes.length === 0) {
      list.innerHTML = `<p class="empty-message">実行中のアプリはありません</p>`;
      return;
    }

    for (const { uuid, name } of processes) {
      const btn = document.createElement("button");
      btn.className = "app-card";
      btn.innerHTML = `
        <span class="app-icon">🪄</span>
        <span class="app-name">${this.#esc(name)}</span>
      `;
      btn.addEventListener("click", () => {
        window.System?.WindowSystem?.activateWindow(uuid);
        this.close();
      });
      list.appendChild(btn);
    }
  }

  #renderAllApps(manifests) {
    const grid = this.shadowRoot.getElementById("all-apps-grid");
    if (!grid) return;
    grid.innerHTML = "";

    for (const manifest of manifests) {
      const btn = document.createElement("button");
      btn.className = "app-card grid-card";
      btn.innerHTML = `
        <span class="app-icon">🪄</span>
        <span class="app-name">${this.#esc(manifest.name)}</span>
      `;
      btn.addEventListener("click", async () => {
        // manifest._dir は registry.list() が付与する
        if (manifest._dir) {
          await window.System?.loadApp(manifest._dir);
        }
        this.close();
      });
      grid.appendChild(btn);
    }
  }

  // ─── レンダリング ─────────────────────────────────────────────────────────

  #render() {
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  /** XSS 対策: テキストをエスケープして innerHTML に安全に挿入する */
  #esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
