import style    from "./style.js";
import template from "./template.js";

/**
 * ESKitPermissionDialogElement — 権限確認ダイアログ
 *
 * Web Component として Shadow DOM 内にダイアログを描画し、
 * ユーザーの許可/拒否をインタラクティブに取得する。
 *
 * 属性:
 *   open — ダイアログが表示中かどうか (boolean attribute)
 *
 * 使い方:
 *   const dialog = document.createElement("eskit-permission-dialog");
 *   document.body.appendChild(dialog);
 *   const granted = await dialog.request("My App", "notifications");
 */
export default class ESKitPermissionDialogElement extends HTMLElement {
  /** pending な request() の resolve 関数。同時に 1 つのみ保持。 */
  #resolve = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /**
   * 権限確認ダイアログを表示し、ユーザーの選択を返す。
   * 前の request() が完了する前に呼ばれた場合は前回の pending を拒否してから開く。
   *
   * @param {string} appName   アプリ表示名
   * @param {string} permission  権限名 (例: "notifications")
   * @returns {Promise<boolean>}
   */
  request(appName, permission) {
    // 前の pending を拒否
    if (this.#resolve) {
      this.#resolve(false);
      this.#resolve = null;
    }

    return new Promise((resolve) => {
      this.#resolve = resolve;
      this.#update(appName, permission);
      this.setAttribute("open", "");
    });
  }

  // ─── 内部実装 ────────────────────────────────────────────────────────────

  #render() {
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  #bindEvents() {
    this.shadowRoot.getElementById("btn-allow").addEventListener("click", () => this.#finish(true));
    this.shadowRoot.getElementById("btn-deny").addEventListener("click",  () => this.#finish(false));

    // オーバーレイ背景クリックで拒否
    // this.addEventListener("click", e => {
    //   if (e.target === this) this.#finish(false);
    // });

    // Escape キーで拒否
    document.addEventListener("keydown", this.#onKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeyDown);
  }

  #onKeyDown = (e) => {
    if (this.hasAttribute("open") && e.key === "Escape") this.#finish(false);
  };

  #update(appName, permission) {
    const desc  = this.shadowRoot.getElementById("perm-desc");
    const badge = this.shadowRoot.getElementById("perm-badge");
    if (desc)  desc.textContent  = `${this.#esc(appName)} が以下の権限を要求しています:`;
    if (badge) badge.textContent = permission;
  }

  #finish(granted) {
    if (!this.#resolve) return;
    this.removeAttribute("open");
    const resolve   = this.#resolve;
    this.#resolve   = null;
    resolve(granted);
  }

  /** XSS 対策: テキストノード経由で安全に挿入する */
  #esc(str) {
    return String(str);
  }
}
