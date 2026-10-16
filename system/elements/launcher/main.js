import style    from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitLauncherElement — デスクトップモード用ランチャー
 *
 * レジストリに登録されたアプリをグリッド形式で表示し、検索・起動できる。
 * タスクバーのランチャーボタンまたは `launcher:toggle` イベントで開閉する。
 * モバイルモードでは非表示 (ESKitDrawerElement が代替)。
 *
 * 属性:
 *   open — ランチャーが開いているかどうか (boolean attribute)
 *   mode — "desktop" | "mobile"  (ESKitWindowSystem が設定)
 */
export default class ESKitLauncherElement extends HTMLElement {
  #offToggle = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.#offToggle?.();
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  /** ランチャーを開く (内容をリフレッシュしてから表示) */
  show() {
    // 閉じるアニメーション中に再度開く場合はキャンセル
    this.classList.remove("is-closing");
    this.#refresh();
    this.setAttribute("open", "");
    // 検索ボックスにフォーカス
    const input = this.shadowRoot.getElementById("launcher-search");
    if (input) {
      input.value = "";
      requestAnimationFrame(() => input.focus());
    }
  }

  /** ランチャーを閉じる (退場アニメーション後に非表示) */
  hide() {
    if (!this.isOpen || this.classList.contains("is-closing")) return;
    this.classList.add("is-closing");
    const panel = this.shadowRoot.querySelector(".launcher-panel");
    const done = () => {
      this.removeAttribute("open");
      this.classList.remove("is-closing");
      panel?.removeEventListener("animationend", done);
    };
    panel?.addEventListener("animationend", done, { once: true });
  }

  /** ランチャーの開閉をトグルする */
  toggle() {
    this.isOpen ? this.hide() : this.show();
  }

  // ─── 内容の更新 ────────────────────────────────────────────────────────────

  #refresh(query = "") {
    const sys = window.System;
    if (!sys) return;
    const manifests = query
      ? sys.registry.search(query)
      : sys.registry.list();
    this.#renderGrid(manifests);
  }

  #renderGrid(manifests) {
    const grid = this.shadowRoot.getElementById("launcher-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (manifests.length === 0) {
      grid.innerHTML = `<p class="empty-message">アプリが見つかりません</p>`;
      return;
    }

    for (const manifest of manifests) {
      const btn = document.createElement("button");
      btn.className = "app-card";
      btn.innerHTML = `
        <span class="app-icon">🪄</span>
        <span class="app-name">${this.#esc(manifest.name)}</span>
      `;
      btn.addEventListener("click", async () => {
        if (manifest._dir) {
          await window.System?.loadApp(manifest._dir);
        }
        this.hide();
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

  #bindEvents() {
    // オーバーレイ背景クリックで閉じる
    this.addEventListener("click", e => {
      if (e.target === this) this.hide();
    });

    // 検索入力
    this.shadowRoot.getElementById("launcher-search")?.addEventListener("input", e => {
      this.#refresh(e.target.value.trim());
    });

    // launcher:toggle イベント購読
    const sys = window.System;
    if (sys) {
      this.#offToggle = sys.events.on("launcher:toggle", () => this.toggle());
    }
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
