import ESKitApp from "system/app.js";
import hamon, { signal, computed } from "system/hamon.js";
import style from "./style.js";

/**
 * NotepadApp — ESKit 標準テキストエディタ
 */
export default class NotepadApp extends ESKitApp {
  static style = style;

  #filePath = signal("");
  #content = signal("");
  #isDirty = signal(false);

  constructor() {
    super();
    this.name = "Notepad";

    const fileName = computed(() => {
      if (!this.#filePath.value) return this.t("notepad.untitled");
      return this.#filePath.value.split("/").pop();
    });

    const lineCount = computed(() => {
      const text = this.#content.value;
      if (!text) return 1;
      return text.split("\n").length;
    });

    const charCount = computed(() => {
      return this.#content.value.length;
    });

    this.template = hamon`
      <div class="notepad-container">
        <!-- ツールバー -->
        <div class="toolbar">
          <button class="kit-button -small" @click=${() => this.#handleNew()}>
            <eskit-icon set="lucide" name="file-plus" size="14"></eskit-icon>
            <span>${() => this.t("notepad.new")}</span>
          </button>
          <button class="kit-button -small" @click=${() => this.#handleOpen()}>
            <eskit-icon set="lucide" name="folder-open" size="14"></eskit-icon>
            <span>${() => this.t("notepad.open")}</span>
          </button>
          <button class="kit-button -small -primary" @click=${() => this.#handleSave()}>
            <eskit-icon set="lucide" name="save" size="14"></eskit-icon>
            <span>${() => this.t("notepad.save")}</span>
          </button>
          <button class="kit-button -small" @click=${() => this.#handleSaveAs()}>
            <eskit-icon set="lucide" name="file-text" size="14"></eskit-icon>
            <span>${() => this.t("notepad.saveAs")}</span>
          </button>
          <div class="toolbar-separator"></div>
          <button class="kit-button -small" @click=${() => this.#handleDownload()}>
            <eskit-icon set="lucide" name="download" size="14"></eskit-icon>
            <span>${() => this.t("notepad.download")}</span>
          </button>
        </div>

        <!-- エディタ本体 -->
        <div class="editor-area">
          <textarea
            id="editor-textarea"
            class="editor-textarea"
            spellcheck="false"
            :value=${() => this.#content.value}
            @input=${(e) => {
              this.#content.value = e.target.value;
              this.#isDirty.value = true;
            }}
            @keydown=${(e) => this.#onTextareaKeyDown(e)}
          ></textarea>
        </div>

        <!-- ステータスバー -->
        <div class="status-bar">
          <div class="status-left">
            <span kit-if=${() => this.#isDirty.value} class="dirty-dot" :title=${() => this.t("notepad.modified")}></span>
            <span>${() => fileName.value}</span>
            <span kit-if=${() => !!this.#filePath.value} style="opacity: 0.7;">(${() => this.#filePath.value})</span>
          </div>
          <div class="status-right">
            <span>${() => lineCount.value} ${() => this.t("notepad.lines")}</span>
            <span>${() => charCount.value} ${() => this.t("notepad.chars")}</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    `;
  }

  initialize() {
    this.#updateTitle();
    this.hamon.effect(() => {
      this.#updateTitle();
    });

    if (this.launchData?.filePath) {
      this.onOpenFile(this.launchData.filePath);
    }
  }

  /**
   * ファイルを開く（外部起動・ファイル関連付け・オープン処理共通）
   * @param {string} filePath
   */
  async onOpenFile(filePath) {
    if (!filePath) return;
    try {
      const text = await this.fs.readFile(filePath);
      this.#filePath.value = filePath;
      this.#content.value = text;
      this.#isDirty.value = false;
      this.#updateTitle();
    } catch (e) {
      await this.alert({
        title: this.t("notepad.open"),
        message: this.t("notepad.fileNotFound", { path: filePath }) || this.t("notepad.openError", { error: e.message }),
        icon: "alert-circle",
      });
    }
  }

  #updateTitle() {
    const file = this.#filePath.value ? this.#filePath.value.split("/").pop() : this.t("notepad.untitled");
    const prefix = this.#isDirty.value ? "● " : "";
    const appName = window.System?.i18n?.getAppName(this._manifest) || "Notepad";
    this.setTitle(`${prefix}${file} - ${appName}`);
  }

  async #handleNew() {
    if (this.#isDirty.value) {
      const ok = await this.confirm({
        title: this.t("notepad.confirmDiscardTitle"),
        message: this.t("notepad.confirmDiscardMsg"),
        okText: this.t("notepad.discardAndNew"),
        cancelText: this.t("notepad.cancel"),
        danger: true,
      });
      if (!ok) return;
    }
    this.#filePath.value = "";
    this.#content.value = "";
    this.#isDirty.value = false;
    this.#updateTitle();
  }

  async #handleOpen() {
    const defaultPath = this.#filePath.value || (window.System?.homeDir() ? `${window.System.homeDir()}/documents/` : "/home/");
    const inputPath = await this.prompt({
      title: this.t("notepad.open"),
      message: this.t("notepad.openPrompt"),
      defaultValue: defaultPath,
      placeholder: "/home/user/document.txt",
    });
    if (!inputPath) return;
    await this.onOpenFile(inputPath.trim());
  }

  async #handleSave() {
    if (!this.#filePath.value) {
      return this.#handleSaveAs();
    }
    try {
      await this.fs.writeFile(this.#filePath.value, this.#content.value);
      this.#isDirty.value = false;
      this.#updateTitle();
      await this.showNotification({
        title: window.System?.i18n?.getAppName(this._manifest) || "Notepad",
        message: this.t("notepad.saved"),
        type: "success",
        duration: 3000,
      });
    } catch (e) {
      await this.alert({
        title: this.t("notepad.save"),
        message: this.t("notepad.saveError", { error: e.message }),
        icon: "alert-circle",
      });
    }
  }

  async #handleSaveAs() {
    const defaultPath = this.#filePath.value || (window.System?.homeDir() ? `${window.System.homeDir()}/documents/untitled.txt` : "/home/untitled.txt");
    const targetPath = await this.prompt({
      title: this.t("notepad.saveAs"),
      message: this.t("notepad.savePrompt"),
      defaultValue: defaultPath,
      placeholder: "/home/user/documents/file.txt",
    });
    if (!targetPath) return;

    try {
      await this.fs.writeFile(targetPath.trim(), this.#content.value);
      this.#filePath.value = targetPath.trim();
      this.#isDirty.value = false;
      this.#updateTitle();
      await this.showNotification({
        title: window.System?.i18n?.getAppName(this._manifest) || "Notepad",
        message: this.t("notepad.saved"),
        type: "success",
        duration: 3000,
      });
    } catch (e) {
      await this.alert({
        title: this.t("notepad.saveAs"),
        message: this.t("notepad.saveError", { error: e.message }),
        icon: "alert-circle",
      });
    }
  }

  #handleDownload() {
    const filename = this.#filePath.value ? this.#filePath.value.split("/").pop() : "document.txt";
    const blob = new Blob([this.#content.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  #onTextareaKeyDown(e) {
    // Ctrl+S / Cmd+S で保存
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      this.#handleSave();
      return;
    }

    // Tab キーで 2 スペース挿入
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      textarea.value = val.substring(0, start) + "  " + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      this.#content.value = textarea.value;
      this.#isDirty.value = true;
    }
  }
}
