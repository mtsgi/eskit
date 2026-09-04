import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitFilePickerElement — 汎用ファイル選択ダイアログ
 *
 * VFS (仮想ファイルシステム) のディレクトリを探索し、
 * 指定された拡張子フィルターに基づいてファイルを選択するモーダル。
 */
export default class ESKitFilePickerElement extends HTMLElement {
  #resolve = null;
  #titleEl = null;
  #closeBtn = null;
  #upBtn = null;
  #currentPathEl = null;
  #fileGridEl = null;
  #emptyMsgEl = null;
  #fileNameInput = null;
  #cancelBtn = null;
  #openBtn = null;

  #currentDir = "/home";
  #accepts = null; // null | string[] (e.g. [".png", ".jpg"])
  #selectedEntry = null; // { name, type, path } | null

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#queryElements();
    this.#bindEvents();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeyDown);
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /**
   * ファイルピッカーを開き、選択されたファイルのパス（または null）を返す。
   * @param {{ title?: string, startPath?: string, accepts?: string[] }} opts
   * @returns {Promise<string|null>}
   */
  async show({ title, startPath, accepts } = {}) {
    const defaultTitle = window.System?.i18n?.t("filePicker.title") ?? "ファイルを選択";
    const user = window.System?.currentUser?.id;
    const defaultHome = user ? `/home/${user}` : "/home";

    this.#accepts = Array.isArray(accepts) ? accepts.map(ext => ext.toLowerCase()) : null;
    this.#selectedEntry = null;

    let targetPath = startPath || defaultHome;
    if (window.System?.fs) {
      const exists = await window.System.fs.exists(targetPath).catch(() => false);
      if (!exists) targetPath = "/home";
    }
    this.#currentDir = targetPath;

    if (this.#titleEl) {
      this.#titleEl.textContent = title || defaultTitle;
    }
    this.#updateUI();

    this.setAttribute("open", "");
    await this.#loadDirectory(this.#currentDir);

    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  close(result = null) {
    this.removeAttribute("open");
    if (this.#resolve) {
      const fn = this.#resolve;
      this.#resolve = null;
      fn(result);
    }
  }

  // ─── 内部処理 ─────────────────────────────────────────────────────────────

  #render() {
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #queryElements() {
    this.#titleEl = this.shadowRoot.getElementById("fp-title");
    this.#closeBtn = this.shadowRoot.getElementById("fp-close-btn");
    this.#upBtn = this.shadowRoot.getElementById("fp-up-btn");
    this.#currentPathEl = this.shadowRoot.getElementById("fp-current-path");
    this.#fileGridEl = this.shadowRoot.getElementById("fp-file-grid");
    this.#emptyMsgEl = this.shadowRoot.getElementById("fp-empty-msg");
    this.#fileNameInput = this.shadowRoot.getElementById("fp-file-name-input");
    this.#cancelBtn = this.shadowRoot.getElementById("fp-cancel-btn");
    this.#openBtn = this.shadowRoot.getElementById("fp-open-btn");

    // i18n 反映
    const i18n = window.System?.i18n;
    if (i18n) {
      const openText = i18n.t("filePicker.open") || "開く";
      const cancelText = i18n.t("filePicker.cancel") || "キャンセル";
      const fileLabel = i18n.t("filePicker.fileName") || "ファイル名:";
      const emptyText = i18n.t("filePicker.empty") || "ファイルがありません";
      const upText = i18n.t("filePicker.up") || "上の階層へ";

      if (this.#openBtn) this.#openBtn.textContent = openText;
      if (this.#cancelBtn) this.#cancelBtn.textContent = cancelText;
      if (this.#emptyMsgEl) this.#emptyMsgEl.textContent = emptyText;
      if (this.#upBtn) this.#upBtn.title = upText;
      const labelEl = this.shadowRoot.getElementById("fp-file-label");
      if (labelEl) labelEl.textContent = fileLabel;
    }
  }

  #bindEvents() {
    this.#closeBtn?.addEventListener("click", () => this.close(null));
    this.#cancelBtn?.addEventListener("click", () => this.close(null));
    this.#upBtn?.addEventListener("click", () => this.#navigateUp());

    this.#openBtn?.addEventListener("click", () => {
      if (this.#selectedEntry && this.#selectedEntry.type === "file") {
        this.close(this.#selectedEntry.path);
      }
    });

    this.addEventListener("click", (e) => {
      if (e.target === this) {
        this.close(null);
      }
    });

    document.addEventListener("keydown", this.#onKeyDown);
  }

  #onKeyDown = (e) => {
    if (!this.hasAttribute("open")) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      this.close(null);
    } else if (e.key === "Enter") {
      if (this.#selectedEntry) {
        e.stopPropagation();
        if (this.#selectedEntry.type === "dir") {
          this.#loadDirectory(this.#selectedEntry.path);
        } else {
          this.close(this.#selectedEntry.path);
        }
      }
    }
  };

  #updateUI() {
    if (this.#currentPathEl) {
      this.#currentPathEl.textContent = this.#currentDir;
    }
    if (this.#upBtn) {
      this.#upBtn.disabled = this.#currentDir === "/" || !this.#currentDir.includes("/");
    }
    if (this.#fileNameInput) {
      this.#fileNameInput.value = this.#selectedEntry ? this.#selectedEntry.name : "";
    }
    if (this.#openBtn) {
      this.#openBtn.disabled = !this.#selectedEntry || this.#selectedEntry.type !== "file";
    }
  }

  #navigateUp() {
    if (this.#currentDir === "/" || !this.#currentDir.includes("/")) return;
    const parts = this.#currentDir.split("/").filter(Boolean);
    parts.pop();
    const parentPath = "/" + parts.join("/");
    this.#loadDirectory(parentPath || "/");
  }

  async #loadDirectory(dirPath) {
    this.#currentDir = dirPath;
    this.#selectedEntry = null;
    this.#updateUI();

    if (!window.System?.fs) {
      this.#renderEntries([]);
      return;
    }

    try {
      let rawEntries = await window.System.fs.readdir(dirPath);
      // ソート: ディレクトリを先頭、そのあと名前順
      rawEntries.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "dir" ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      });

      // フィルタリング: フォルダはすべて表示、ファイルは accepts フィルタに一致するもののみ
      const filtered = rawEntries.filter((item) => {
        if (item.type === "dir") return true;
        if (!this.#accepts || this.#accepts.length === 0) return true;
        const ext = item.name.includes(".") ? "." + item.name.split(".").pop().toLowerCase() : "";
        return this.#accepts.includes(ext);
      });

      this.#renderEntries(filtered);
    } catch (err) {
      console.error("[ESKitFilePicker] Failed to read directory:", dirPath, err);
      this.#renderEntries([]);
    }
  }

  #renderEntries(entries) {
    if (!this.#fileGridEl) return;
    this.#fileGridEl.innerHTML = "";

    if (entries.length === 0) {
      this.#emptyMsgEl?.classList.remove("kit-hidden");
      return;
    }
    this.#emptyMsgEl?.classList.add("kit-hidden");

    for (const item of entries) {
      const itemEl = document.createElement("div");
      itemEl.className = "fp-item";
      itemEl.setAttribute("role", "option");
      itemEl.setAttribute("tabindex", "0");

      const iconName = item.type === "dir" ? "folder" : this.#getIconForFile(item.name);
      const iconColor = item.type === "dir" ? "var(--kit-color-primary, #3b82f6)" : "inherit";

      itemEl.innerHTML = `
        <div class="fp-item-icon">
          <eskit-icon set="lucide" name="${iconName}" size="28" style="color: ${iconColor};"></eskit-icon>
        </div>
        <div class="fp-item-name" title="${item.name}">${item.name}</div>
      `;

      itemEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#selectEntry(item, itemEl);
      });

      itemEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        if (item.type === "dir") {
          this.#loadDirectory(item.path);
        } else {
          this.close(item.path);
        }
      });

      this.#fileGridEl.appendChild(itemEl);
    }
  }

  #selectEntry(item, element) {
    this.#selectedEntry = item;
    const items = this.#fileGridEl?.querySelectorAll(".fp-item") || [];
    for (const el of items) {
      el.classList.toggle("-selected", el === element);
    }
    this.#updateUI();
  }

  #getIconForFile(fileName) {
    const ext = fileName.includes(".") ? "." + fileName.split(".").pop().toLowerCase() : "";
    const imgExts = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp", ".ico"];
    if (imgExts.includes(ext)) return "image";

    const textExts = [".txt", ".md", ".json", ".js", ".ts", ".html", ".css", ".xml", ".csv", ".log"];
    if (textExts.includes(ext)) return "file-text";

    return "file";
  }
}
