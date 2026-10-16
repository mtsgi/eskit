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
    // 閉じるアニメーション中に再度開く場合はキャンセル
    this.classList.remove("is-closing");
    this.#refresh();
    this.#updateTime();
    this.setAttribute("open", "");
    window.System?.events.emit("drawer:open");
  }

  /** ドロワーを閉じる (退場アニメーション後に非表示) */
  close() {
    if (!this.isOpen || this.classList.contains("is-closing")) return;
    this.classList.add("is-closing");
    const panel = this.shadowRoot.querySelector(".drawer-panel");
    const done = () => {
      this.removeAttribute("open");
      this.classList.remove("is-closing");
      window.System?.events.emit("drawer:close");
      panel?.removeEventListener("animationend", done);
    };
    panel?.addEventListener("animationend", done, { once: true });
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

    for (const { uuid, name, icon } of processes) {
      const btn = document.createElement("button");
      btn.className = "app-card";

      const iconSpan = document.createElement("span");
      iconSpan.className = "app-icon";
      const iconEl = window.System?.icons?.createAppIcon(icon, { size: 32 });
      if (iconEl) iconSpan.appendChild(iconEl);

      const nameSpan = document.createElement("span");
      nameSpan.className = "app-name";
      nameSpan.textContent = name;

      btn.appendChild(iconSpan);
      btn.appendChild(nameSpan);

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

      const iconSpan = document.createElement("span");
      iconSpan.className = "app-icon";
      const iconEl = window.System?.icons?.createAppIcon(manifest.icon, { size: 32 });
      if (iconEl) iconSpan.appendChild(iconEl);

      const nameSpan = document.createElement("span");
      nameSpan.className = "app-name";
      nameSpan.textContent = manifest.name;

      btn.appendChild(iconSpan);
      btn.appendChild(nameSpan);

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
