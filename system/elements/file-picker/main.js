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
  #offLocale = null; // 表示中の言語変更を購読する解除関数。
  #customTitle = null; // 呼出元の指定があれば、既定タイトルの再翻訳より優先する。

  /**
   * ファイル選択ダイアログの Shadow DOM を作成する。
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * ダイアログを描画し、操作イベントと言語変更の購読を登録する。
   */
  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#queryElements();
    this.#bindEvents();

    this.#offLocale = window.System?.events?.on("system:locale-changed", () => {
      if (this.hasAttribute("open")) this.#translate();
    });
  }

  /**
   * キーボード監視と言語変更の購読を解除する。
   */
  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeyDown);

    // ダイアログが DOM から外れた後に、翻訳の購読を残さない。
    this.#offLocale?.();
    this.#offLocale = null;
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /**
   * ファイルピッカーを開き、選択されたファイルのパス（または null）を返す。
   * 表示前に現在の言語へ翻訳し、表示中も言語変更に追従する。
   * @param {{ title?: string, startPath?: string, accepts?: string[] }} [opts={}] タイトル、開始ディレクトリ、許可する拡張子。
   * @returns {Promise<string|null>} 選択した VFS 絶対パス。キャンセル時は null。
   */
  async show({ title, startPath, accepts } = {}) {
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

    this.#customTitle = title || null;
    this.#translate();
    this.#updateUI();

    this.setAttribute("open", "");
    await this.#loadDirectory(this.#currentDir);

    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  /**
   * ダイアログを閉じ、選択待ちの Promise を確定する。
   * @param {string|null} [result=null] 選択したパス。キャンセル時は null。
   */
  close(result = null) {
    this.removeAttribute("open");
    if (this.#resolve) {
      const fn = this.#resolve;
      this.#resolve = null;
      fn(result);
    }
  }

  // ─── 内部処理 ─────────────────────────────────────────────────────────────

  /**
   * ダイアログの静的テンプレートを Shadow DOM に描画する。
   */
  #render() {
    this.shadowRoot.innerHTML = template;
  }

  /**
   * 共通スタイルとダイアログ固有のスタイルを適用する。
   */
  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  /**
   * 操作対象の要素を取得し、初期表示の文言を翻訳する。
   */
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
    this.#translate();
  }

  /**
   * ボタンの表示・アクセシブル名を現在の言語で更新する。
   * 呼出元が指定したタイトルは保持する。
   */
  #translate() {
    const i18n = window.System?.i18n;

    // 呼出元が指定したタイトルは保持し、既定タイトルだけを再翻訳する。
    if (this.#titleEl) {
      this.#titleEl.textContent = this.#customTitle || i18n?.t("filePicker.title") || "ファイルを選択";
    }

    if (i18n) {
      // アイコンだけの閉じるボタンにも、表示中の言語でアクセシブル名を付ける。
      this.#closeBtn?.setAttribute("aria-label", i18n.t("system.close"));
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

  /**
   * 選択、キャンセル、ディレクトリ移動の操作を登録する。
   */
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

  /**
   * 表示中の Escape でキャンセルし、Enter で選択項目を開く。
   * @param {KeyboardEvent} e キー入力のイベント。
   */
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

  /**
   * 現在のパス、選択ファイル名、ボタンの有効状態を更新する。
   */
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

  /**
   * 現在のディレクトリの親へ移動する。ルートでは移動しない。
   */
  #navigateUp() {
    if (this.#currentDir === "/" || !this.#currentDir.includes("/")) return;
    const parts = this.#currentDir.split("/").filter(Boolean);
    parts.pop();
    const parentPath = "/" + parts.join("/");
    this.#loadDirectory(parentPath || "/");
  }

  /**
   * ディレクトリを読み込み、並べ替えと拡張子フィルターを適用する。
   * @param {string} dirPath 表示する VFS 絶対パス。
   * @returns {Promise<void>} 一覧の更新が終了したときに解決する。
   */
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

  /**
   * ファイル一覧を描画し、各項目の選択・決定操作を登録する。
   * @param {Array<{name: string, type: string, path: string}>} entries 表示する項目。
   */
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

  /**
   * 選択項目を記録し、一覧の選択表示と操作ボタンを更新する。
   * @param {{name: string, type: string, path: string}} item 選択項目。
   * @param {HTMLElement} element 選択表示を付ける要素。
   */
  #selectEntry(item, element) {
    this.#selectedEntry = item;
    const items = this.#fileGridEl?.querySelectorAll(".fp-item") || [];
    for (const el of items) {
      el.classList.toggle("-selected", el === element);
    }
    this.#updateUI();
  }

  /**
   * 拡張子に応じたファイル表示用アイコン名を返す。
   * @param {string} fileName ファイル名。
   * @returns {string} Lucide のアイコン名。
   */
  #getIconForFile(fileName) {
    const ext = fileName.includes(".") ? "." + fileName.split(".").pop().toLowerCase() : "";
    const imgExts = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp", ".ico"];
    if (imgExts.includes(ext)) return "image";

    const textExts = [".txt", ".md", ".json", ".js", ".ts", ".html", ".css", ".xml", ".csv", ".log"];
    if (textExts.includes(ext)) return "file-text";

    return "file";
  }
}
