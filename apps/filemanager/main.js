import ESKitApp from "system/app.js";
import hamon, { signal, computed, list } from "system/hamon.js";
import style from "./style.js";

/**
 * FileManagerApp — ESKit 仮想ファイルシステムブラウザ
 */
export default class FileManagerApp extends ESKitApp {
  static style = style;

  #cwd = signal("/home");
  #entries = signal([]); // Array<{ name: string, type: "file"|"dir", path: string, size?: number }>
  #selectedItem = signal(null); // entry | null
  #history = ["/home"];
  #historyIndex = 0;
  #fileInput = null;

  constructor() {
    super();

    const user = window.System?.currentUser?.id;
    const initialHome = user ? `/home/${user}` : "/home";
    this.#cwd.value = initialHome;
    this.#history = [initialHome];
    this.#historyIndex = 0;

    const itemCountText = computed(() => {
      const count = this.#entries.value.length;
      return this.t("filemanager.items", { count });
    });

    const selectedDetailsText = computed(() => {
      const sel = this.#selectedItem.value;
      if (!sel) return "";
      return `${sel.name} (${sel.type === "dir" ? this.t("filemanager.directory") : this.#formatBytes(sel.size || 0)})`;
    });

    this.template = hamon`
      <div
        class="fm-container"
        @dragover=${(e) => { e.preventDefault(); }}
        @drop=${(e) => this.#handleDrop(e)}
      >
        <!-- ツールバー & パスバー -->
        <div class="fm-toolbar">
          <button
            class="kit-button -small"
            :disabled=${() => this.#historyIndex <= 0}
            @click=${() => this.#goBack()}
            :title=${() => this.t("filemanager.back")}
          >
            <eskit-icon set="lucide" name="arrow-left" size="14"></eskit-icon>
          </button>
          <button
            class="kit-button -small"
            :disabled=${() => this.#historyIndex >= this.#history.length - 1}
            @click=${() => this.#goForward()}
            :title=${() => this.t("filemanager.forward")}
          >
            <eskit-icon set="lucide" name="arrow-right" size="14"></eskit-icon>
          </button>
          <button
            class="kit-button -small"
            :disabled=${() => this.#cwd.value === "/" || !this.#cwd.value.includes("/")}
            @click=${() => this.#goUp()}
            :title=${() => this.t("filemanager.up")}
          >
            <eskit-icon set="lucide" name="arrow-up" size="14"></eskit-icon>
          </button>

          <div class="path-bar-container">
            <eskit-icon set="lucide" name="folder" size="14" style="color: var(--kit-color-primary);"></eskit-icon>
            <input
              class="path-input"
              type="text"
              :value=${() => this.#cwd.value}
              @keydown=${(e) => {
                if (e.key === "Enter") {
                  this.#navigateTo(e.target.value);
                }
              }}
            >
          </div>

          <button class="kit-button -small" @click=${() => this.#loadDirectory(this.#cwd.value)} :title=${() => this.t("filemanager.refresh")}>
            <eskit-icon set="lucide" name="refresh-cw" size="14"></eskit-icon>
          </button>

          <div class="fm-toolbar-separator"></div>

          <button class="kit-button -small" @click=${() => this.#handleNewFolder()} :title=${() => this.t("filemanager.newFolder")}>
            <eskit-icon set="lucide" name="folder-plus" size="14"></eskit-icon>
            <span>${() => this.t("filemanager.newFolder")}</span>
          </button>
          <button class="kit-button -small" @click=${() => this.#handleNewFile()} :title=${() => this.t("filemanager.newFile")}>
            <eskit-icon set="lucide" name="file-plus" size="14"></eskit-icon>
            <span>${() => this.t("filemanager.newFile")}</span>
          </button>
          <button class="kit-button -small -primary" @click=${() => this.#triggerUpload()} :title=${() => this.t("filemanager.upload")}>
            <eskit-icon set="lucide" name="upload" size="14"></eskit-icon>
            <span>${() => this.t("filemanager.upload")}</span>
          </button>
        </div>

        <!-- メインボディ -->
        <div class="fm-body">
          <!-- サイドバー -->
          <nav class="fm-sidebar">
            <div class="sidebar-section-title">${() => this.t("filemanager.quickAccess")}</div>
            <button
              :class=${() => `sidebar-link ${this.#cwd.value === (window.System?.homeDir() || "/home") ? "-active" : ""}`}
              @click=${() => this.#navigateTo(window.System?.homeDir() || "/home")}
            >
              <eskit-icon set="lucide" name="home" size="14"></eskit-icon>
              <span>${() => this.t("filemanager.home")}</span>
            </button>
            <button
              :class=${() => `sidebar-link ${this.#cwd.value === `${window.System?.homeDir()}/desktop` ? "-active" : ""}`}
              @click=${() => this.#navigateTo(`${window.System?.homeDir()}/desktop`)}
            >
              <eskit-icon set="lucide" name="monitor" size="14"></eskit-icon>
              <span>${() => this.t("filemanager.desktop")}</span>
            </button>
            <button
              :class=${() => `sidebar-link ${this.#cwd.value === `${window.System?.homeDir()}/documents` ? "-active" : ""}`}
              @click=${() => this.#navigateTo(`${window.System?.homeDir()}/documents`)}
            >
              <eskit-icon set="lucide" name="file-text" size="14"></eskit-icon>
              <span>${() => this.t("filemanager.documents")}</span>
            </button>
            <button
              :class=${() => `sidebar-link ${this.#cwd.value === "/shared" ? "-active" : ""}`}
              @click=${() => this.#navigateTo("/shared")}
            >
              <eskit-icon set="lucide" name="share-2" size="14"></eskit-icon>
              <span>${() => this.t("filemanager.shared")}</span>
            </button>

            <div class="sidebar-section-title" style="margin-top: 6px;">${() => this.t("filemanager.system")}</div>
            <button
              :class=${() => `sidebar-link ${this.#cwd.value === "/system" ? "-active" : ""}`}
              @click=${() => this.#navigateTo("/system")}
            >
              <eskit-icon set="lucide" name="hard-drive" size="14"></eskit-icon>
              <span>${() => this.t("filemanager.system")}</span>
            </button>
            <button
              :class=${() => `sidebar-link ${this.#cwd.value === "/apps" ? "-active" : ""}`}
              @click=${() => this.#navigateTo("/apps")}
            >
              <eskit-icon set="lucide" name="layout-grid" size="14"></eskit-icon>
              <span>${() => this.t("filemanager.apps")}</span>
            </button>
          </nav>

          <!-- ファイル一覧 -->
          <main class="fm-content" @click=${(e) => {
            if (e.target === e.currentTarget || e.target.classList.contains("file-grid")) {
              this.#selectedItem.value = null;
            }
          }}>
            <!-- 空ディレクトリ表示 -->
            <div kit-if=${() => this.#entries.value.length === 0} class="empty-state">
              <eskit-icon set="lucide" name="folder-open" size="32" style="opacity: 0.5;"></eskit-icon>
              <span>${() => this.t("filemanager.emptyFolder")}</span>
            </div>

            <!-- ファイルグリッド -->
            <div kit-if=${() => this.#entries.value.length > 0} class="file-grid">
              ${list(
                () => this.#entries.value,
                (item) => {
                  const isSelected = () => this.#selectedItem.value?.path === item.path;
                  return hamon`
                    <div
                      :class=${() => `file-item ${isSelected() ? "-selected" : ""}`}
                      @click=${(e) => {
                        e.stopPropagation();
                        this.#selectedItem.value = item;
                      }}
                      @dblclick=${(e) => {
                        e.stopPropagation();
                        this.#handleOpen(item);
                      }}
                      @contextmenu=${(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.#selectedItem.value = item;
                        this.#showItemContextMenu(e, item);
                      }}
                    >
                      <div class="file-item-icon">
                        <eskit-icon
                          set="lucide"
                          :name=${item.type === "dir" ? "folder" : this.#getIconForFile(item.name)}
                          size="32"
                          :style=${`color: ${item.type === "dir" ? "var(--kit-color-primary, #3b82f6)" : "var(--kit-fg)"};`}
                        ></eskit-icon>
                      </div>
                      <div class="file-item-name" title=${item.name}>${item.name}</div>
                    </div>
                  `;
                }
              )}
            </div>
          </main>
        </div>

        <!-- ステータスバー -->
        <div class="fm-status-bar">
          <div>${() => itemCountText.value}</div>
          <div kit-if=${() => !!this.#selectedItem.value}>${() => selectedDetailsText.value}</div>
        </div>
      </div>
    `;
  }

  initialize() {
    // タイトルは ESKitApp 基底クラスが自動同期

    // 非表示のファイルアップロード要素を作成
    this.#fileInput = document.createElement("input");
    this.#fileInput.type = "file";
    this.#fileInput.multiple = true;
    this.#fileInput.style.display = "none";
    this.#fileInput.addEventListener("change", (e) => this.#onFileInputChange(e));
    this.querySelector(".fm-container")?.appendChild(this.#fileInput);

    // 初期ディレクトリの読み込み
    this.#loadDirectory(this.#cwd.value);
  }

  #getIconForFile(name) {
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    switch (ext) {
      case "txt":
      case "md":
      case "doc":
      case "log":
        return "file-text";
      case "js":
      case "json":
      case "html":
      case "css":
      case "ts":
      case "xml":
        return "file-code";
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
      case "webp":
        return "image";
      case "mp3":
      case "wav":
      case "ogg":
        return "music";
      case "mp4":
      case "webm":
        return "video";
      case "zip":
      case "tar":
      case "gz":
        return "archive";
      default:
        return "file";
    }
  }

  #isImageFile(name) {
    if (!name) return false;
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    return ["png", "jpg", "jpeg", "webp", "svg", "gif", "bmp"].includes(ext);
  }

  #formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  async #loadDirectory(path) {
    try {
      const entries = await this.fs.readdir(path);
      // 詳細情報 (stat) を取得してソート (ディレクトリ優先、名前順)
      const detailed = await Promise.all(
        entries.map(async (entry) => {
          try {
            const st = await this.fs.stat(entry.path);
            return { ...entry, size: st?.size || 0, modifiedAt: st?.modifiedAt || 0 };
          } catch {
            return entry;
          }
        })
      );

      detailed.sort((a, b) => {
        if (a.type === "dir" && b.type !== "dir") return -1;
        if (a.type !== "dir" && b.type === "dir") return 1;
        return a.name.localeCompare(b.name);
      });

      this.#entries.value = detailed;
      this.#selectedItem.value = null;
    } catch (e) {
      await this.alert({
        title: this.t("filemanager.title"),
        message: this.t("filemanager.openDirError", { error: e.message }),
        icon: "alert-circle",
      });
    }
  }

  #navigateTo(targetPath) {
    if (!targetPath) return;
    let path = targetPath.trim();
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (!path.startsWith("/")) path = "/" + path;

    this.#cwd.value = path;
    if (this.#history[this.#historyIndex] !== path) {
      this.#history = this.#history.slice(0, this.#historyIndex + 1);
      this.#history.push(path);
      this.#historyIndex = this.#history.length - 1;
    }
    this.#loadDirectory(path);
  }

  #goBack() {
    if (this.#historyIndex > 0) {
      this.#historyIndex--;
      const prevPath = this.#history[this.#historyIndex];
      this.#cwd.value = prevPath;
      this.#loadDirectory(prevPath);
    }
  }

  #goForward() {
    if (this.#historyIndex < this.#history.length - 1) {
      this.#historyIndex++;
      const nextPath = this.#history[this.#historyIndex];
      this.#cwd.value = nextPath;
      this.#loadDirectory(nextPath);
    }
  }

  #goUp() {
    const current = this.#cwd.value;
    if (current === "/" || !current.includes("/")) return;
    const parts = current.split("/").filter(Boolean);
    parts.pop();
    const parentPath = "/" + parts.join("/");
    this.#navigateTo(parentPath || "/");
  }

  async #handleOpen(item) {
    if (!item) return;
    if (item.type === "dir") {
      this.#navigateTo(item.path);
    } else {
      await window.System?.openFile(item.path);
    }
  }

  async #handleNewFolder() {
    const name = await this.prompt({
      title: this.t("filemanager.newFolder"),
      message: this.t("filemanager.folderNamePrompt"),
      defaultValue: "New Folder",
    });
    if (!name || !name.trim()) return;

    const target = `${this.#cwd.value === "/" ? "" : this.#cwd.value}/${name.trim()}`;
    try {
      await this.fs.mkdir(target, { recursive: true });
      await this.#loadDirectory(this.#cwd.value);
    } catch (e) {
      await this.alert({ title: this.t("filemanager.error"), message: e.message, icon: "alert-circle" });
    }
  }

  async #handleNewFile() {
    const name = await this.prompt({
      title: this.t("filemanager.newFile"),
      message: this.t("filemanager.fileNamePrompt"),
      defaultValue: "untitled.txt",
    });
    if (!name || !name.trim()) return;

    const target = `${this.#cwd.value === "/" ? "" : this.#cwd.value}/${name.trim()}`;
    try {
      await this.fs.writeFile(target, "");
      await this.#loadDirectory(this.#cwd.value);
    } catch (e) {
      await this.alert({ title: this.t("filemanager.error"), message: e.message, icon: "alert-circle" });
    }
  }

  #triggerUpload() {
    this.#fileInput?.click();
  }

  async #onFileInputChange(e) {
    const files = e.target?.files;
    if (!files || files.length === 0) return;
    await this.#importHostFiles(files);
    e.target.value = "";
  }

  async #handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    await this.#importHostFiles(files);
  }

  async #importHostFiles(fileList) {
    const currentDir = this.#cwd.value === "/" ? "" : this.#cwd.value;
    let count = 0;

    for (const file of fileList) {
      try {
        const buffer = await file.arrayBuffer();
        const targetPath = `${currentDir}/${file.name}`;
        await this.fs.writeFile(targetPath, new Uint8Array(buffer));
        count++;
      } catch (err) {
        console.error("[FileManager] Upload error:", err);
      }
    }

    if (count > 0) {
      await this.#loadDirectory(this.#cwd.value);
      await this.showNotification({
        title: this.t("filemanager.title"),
        message: this.t("filemanager.importSuccess", { count }),
        type: "success",
      });
    }
  }

  async #handleDownloadFile(item) {
    if (!item || item.type === "dir") return;
    try {
      const bytes = await this.fs.readFileAsBytes(item.path);
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      await this.alert({ title: this.t("filemanager.downloadError"), message: e.message, icon: "alert-circle" });
    }
  }

  async #handleRename(item) {
    if (!item) return;
    const newName = await this.prompt({
      title: this.t("filemanager.rename"),
      message: this.t("filemanager.renamePrompt"),
      defaultValue: item.name,
    });
    if (!newName || !newName.trim() || newName.trim() === item.name) return;

    const currentDir = this.#cwd.value === "/" ? "" : this.#cwd.value;
    const targetPath = `${currentDir}/${newName.trim()}`;
    try {
      await this.fs.rename(item.path, targetPath);
      await this.#loadDirectory(this.#cwd.value);
    } catch (e) {
      await this.alert({ title: this.t("filemanager.renameError"), message: e.message, icon: "alert-circle" });
    }
  }

  async #handleDelete(item) {
    if (!item) return;
    const ok = await this.confirm({
      title: this.t("filemanager.delete"),
      message: this.t("filemanager.confirmDelete", { name: item.name }),
      okText: this.t("dialog.delete"),
      cancelText: this.t("dialog.cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await this.fs.remove(item.path, { recursive: true });
      await this.#loadDirectory(this.#cwd.value);
    } catch (e) {
      await this.alert({ title: this.t("filemanager.deleteError"), message: e.message, icon: "alert-circle" });
    }
  }

  async #handleProperties(item) {
    if (!item) return;
    try {
      const st = await this.fs.stat(item.path);
      const pathLabel = this.t("filemanager.propPath");
      const typeLabel = this.t("filemanager.propType");
      const sizeLabel = this.t("filemanager.propSize");
      const ownerLabel = this.t("filemanager.propOwner");
      const modifiedLabel = this.t("filemanager.propModified");
      const unknownText = this.t("filemanager.unknown");
      const dateText = window.System?.i18n ? `${window.System.i18n.formatDate(st.modifiedAt || Date.now())} ${window.System.i18n.formatTime(st.modifiedAt || Date.now())}` : new Date(st.modifiedAt || Date.now()).toLocaleString();
      const typeText = st.type === "dir" ? this.t("filemanager.directory") : (st.type || "file");

      const content = `
        ${pathLabel}: ${st.path}
        ${typeLabel}: ${typeText}
        ${sizeLabel}: ${this.#formatBytes(st.size || 0)} (${st.size || 0} bytes)
        ${ownerLabel}: ${st.owner || unknownText}
        ${modifiedLabel}: ${dateText}
      `.trim().replace(/^\s+/gm, "");

      await this.alert({
        title: this.t("filemanager.propertiesTitle", { name: item.name }),
        message: content,
        icon: "info",
      });
    } catch (e) {
      await this.alert({ title: this.t("filemanager.error"), message: e.message, icon: "alert-circle" });
    }
  }

  #showItemContextMenu(e, item) {
    const cm = window.System?.WindowSystem?.contextMenu;
    if (!cm) return;

    const items = [
      {
        icon: { set: "lucide", name: item.type === "dir" ? "folder-open" : "external-link" },
        label: this.t("notepad.open"),
        action: () => this.#handleOpen(item),
      },
      { separator: true },
      {
        icon: { set: "lucide", name: "edit-2" },
        label: this.t("filemanager.rename"),
        action: () => this.#handleRename(item),
      },
      {
        icon: { set: "lucide", name: "trash-2" },
        label: this.t("filemanager.delete"),
        action: () => this.#handleDelete(item),
      },
    ];

    if (item.type !== "dir") {
      items.push({ separator: true });
      items.push({
        icon: { set: "lucide", name: "download" },
        label: this.t("filemanager.download"),
        action: () => this.#handleDownloadFile(item),
      });

      if (this.#isImageFile(item.name)) {
        items.push({
          icon: { set: "lucide", name: "image" },
          label: this.t("filemanager.setAsWallpaper") || "壁紙に設定",
          action: () => this.#handleSetWallpaper(item),
        });
      }
    }

    items.push({ separator: true });
    items.push({
      icon: { set: "lucide", name: "info" },
      label: this.t("filemanager.details"),
      action: () => this.#handleProperties(item),
    });

    cm.show(e.clientX, e.clientY, items);
  }

  async #handleSetWallpaper(item) {
    if (!item || item.type === "dir") return;
    try {
      await window.System?.theme?.setWallpaper(item.path);
      await this.showNotification({
        title: this.t("filemanager.title"),
        message: this.t("filemanager.wallpaperSetSuccess") || "壁紙を設定しました",
        type: "success",
      });
    } catch (e) {
      await this.alert({ title: this.t("filemanager.error"), message: e.message, icon: "alert-circle" });
    }
  }
}
