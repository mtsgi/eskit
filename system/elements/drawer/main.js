import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitDrawerElement — アプリドロワー
 */
export default class ESKitDrawerElement extends HTMLElement {
  #scope = null;
  #offLocale = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.#offLocale?.();
    this.#scope?.dispose();
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  /** ドロワーを開く (内容をリフレッシュしてから表示) */
  open() {
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

  #refresh() {
    const sys = window.System;
    if (!sys) return;
    this.#renderRunning(sys.listProcesses());
    this.#renderAllApps(sys.registry.list());
  }

  #updateTime() {
    const el = this.shadowRoot.getElementById("drawer-time");
    if (!el) return;
    el.textContent = window.System?.i18n?.formatTime(new Date()) || new Date().toLocaleTimeString();
  }

  #renderRunning(processes) {
    const list = this.shadowRoot.getElementById("running-list");
    if (!list) return;
    list.innerHTML = "";

    if (processes.length === 0) {
      const emptyText = window.System?.i18n?.t("settings.permissionsTab.noApps") || "実行中のアプリはありません";
      list.innerHTML = `<p class="empty-message">${this.#esc(emptyText)}</p>`;
      return;
    }

    for (const { uuid, name, icon, _manifest } of processes) {
      const btn = document.createElement("button");
      btn.className = "app-card";

      const iconSpan = document.createElement("span");
      iconSpan.className = "app-icon";
      const iconEl = window.System?.icons?.createAppIcon(icon, { size: 32 });
      if (iconEl) iconSpan.appendChild(iconEl);

      const nameSpan = document.createElement("span");
      nameSpan.className = "app-name";
      nameSpan.textContent = _manifest ? window.System?.i18n?.getAppName(_manifest) : name;

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
      nameSpan.textContent = window.System?.i18n?.getAppName(manifest) || manifest.name;

      btn.appendChild(iconSpan);
      btn.appendChild(nameSpan);

      btn.addEventListener("click", async () => {
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
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #bindEvents() {
    this.shadowRoot.getElementById("qs-btn")?.addEventListener("click", () => {
      this.close();
      window.System?.WindowSystem?.quickSettings?.toggle();
    });

    this.shadowRoot.getElementById("beacon-btn")?.addEventListener("click", () => {
      this.close();
      window.System?.WindowSystem?.beacon?.show();
    });

    this.addEventListener("click", e => {
      if (e.target === this) this.close();
    });

    this.#offLocale = window.System?.events?.on("system:locale-changed", () => {
      this.#updateTime();
      this.#refresh();
    });
  }

  #esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
