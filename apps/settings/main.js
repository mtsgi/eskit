import ESKitApp from "system/app.js";
import hamon, { signal, computed, list } from "system/hamon.js";
import style from "./style.js";

/**
 * SettingsApp — ESKit システム設定
 *
 * Hamon リアクティブテンプレートエンジンで構築された設定アプリ。
 * 外観（テーマ・壁紙・インポート/エクスポート）、言語、通知、システム、権限を管理する。
 */
export default class SettingsApp extends ESKitApp {
  static style = style;

  constructor() {
    super();
    this.name = "設定";

    // ─── リアクティブシグナル ───────────────────────────────────────────────
    const activeTab = signal("appearance"); // "appearance" | "language" | "notifications" | "system" | "permissions"
    const currentMode = signal(window.System?.theme?.mode || "auto");
    const currentThemeId = signal(window.System?.theme?.current || "default-dark");
    const currentWallpaper = signal(window.System?.theme?.wallpaper || "");
    const resolvedWallpaperBg = signal(window.System?.theme?.resolvedWallpaper || "");
    const currentLocale = signal(window.System?.i18n?.current || "ja");
    const importUrl = signal("");
    const processes = signal(window.System?.listProcesses() || []);
    const notificationsList = signal(window.System?.notifications?.list() || []);
    const registeredApps = signal(window.System?.registry?.list() || []);
    const permissionsVersion = signal(0);

    // ─── イベント同期 ───────────────────────────────────────────────────────
    const offTheme = window.System?.events?.on("system:theme-changed", (data) => {
      currentMode.value = data.mode;
      currentThemeId.value = data.id;
      currentWallpaper.value = data.wallpaper;
      resolvedWallpaperBg.value = data.resolvedWallpaper || window.System?.theme?.resolvedWallpaper || "";
    });

    const offLocale = window.System?.events?.on("system:locale-changed", (data) => {
      currentLocale.value = data.lang;
    });

    const offProcOpened = window.System?.events?.on("app:opened", () => {
      processes.value = window.System?.listProcesses() || [];
      permissionsVersion.value++;
    });

    const offProcClosed = window.System?.events?.on("app:closed", () => {
      processes.value = window.System?.listProcesses() || [];
      permissionsVersion.value++;
    });

    const offNotif = window.System?.events?.on("notifications:updated", () => {
      notificationsList.value = window.System?.notifications?.list() || [];
    });

    const offNotifShow = window.System?.events?.on("notification:show", () => {
      notificationsList.value = window.System?.notifications?.list() || [];
    });

    const offPermChanged = window.System?.events?.on("permissions:changed", () => {
      permissionsVersion.value++;
    });

    this.onCloseCleanup = () => {
      offTheme?.();
      offLocale?.();
      offProcOpened?.();
      offProcClosed?.();
      offNotif?.();
      offNotifShow?.();
      offPermChanged?.();
    };

    // ─── アクションハンドラー ───────────────────────────────────────────────
    const handleSetMode = (mode) => {
      window.System?.theme?.setMode(mode);
      currentMode.value = mode;
    };

    const handleApplyTheme = (id) => {
      window.System?.theme?.apply(id);
      currentThemeId.value = id;
    };

    const isCustomWallpaper = computed(() => {
      const wp = currentWallpaper.value;
      return Boolean(wp && wp.startsWith("/") && !wp.startsWith("linear-gradient") && !wp.startsWith("radial-gradient") && !wp.startsWith("url("));
    });

    const customWallpaperName = computed(() => {
      const wp = currentWallpaper.value;
      if (!wp) return "";
      return wp.split("/").pop();
    });

    const handleSetWallpaper = (val) => {
      window.System?.theme?.setWallpaper(val);
      currentWallpaper.value = val;
      resolvedWallpaperBg.value = window.System?.theme?.resolvedWallpaper || "";
    };

    const handlePickWallpaper = async () => {
      const pickedPath = await this.showOpenFilePicker({
        title: this.t("settings.appearance.chooseWallpaperFile") || "壁紙画像を選択",
        accepts: [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp"],
      });
      if (pickedPath) {
        handleSetWallpaper(pickedPath);
      }
    };

    const handleSetLocale = async (lang) => {
      await window.System?.i18n?.setLocale(lang);
      currentLocale.value = lang;
    };

    const handleImportTheme = async () => {
      const url = importUrl.value.trim();
      if (!url) return;
      try {
        await window.System?.theme?.load(url);
        importUrl.value = "";
        await this.showNotification({
          title: this.t("settings.title"),
          message: this.t("settings.appearance.importSuccess"),
          type: "success",
        });
      } catch (e) {
        await this.alert({
          title: this.t("settings.appearance.importError"),
          message: e.message || String(e),
          icon: "alert-circle",
        });
      }
    };

    const handleExportTheme = async () => {
      const json = window.System?.theme?.export();
      if (!json) return;
      try {
        await navigator.clipboard.writeText(json);
        await this.showNotification({
          title: this.t("settings.title"),
          message: this.t("settings.appearance.copiedToClipboard"),
          type: "success",
        });
      } catch (e) {
        await this.prompt({
          title: this.t("settings.appearance.themeJson"),
          message: this.t("settings.appearance.clipboardFallback"),
          defaultValue: json,
        });
      }
    };

    const handleSendTestNotification = async () => {
      await this.showNotification({
        title: this.t("notifications.sampleTitle"),
        message: this.t("notifications.sampleMessage"),
        type: "info",
        icon: "bell",
      });
    };

    const handleClearNotifications = () => {
      window.System?.notifications?.clear();
    };

    const handleKillProcess = async (procUuid) => {
      const confirmed = await this.confirm({
        title: this.t("settings.systemTab.confirmKillTitle"),
        message: this.t("settings.systemTab.confirmKillMsg"),
        danger: true,
      });
      if (confirmed) {
        window.System?.closeApp(procUuid);
      }
    };

    const handleRevokeSinglePermission = async (appId, perm, appName) => {
      const permName = window.System?.i18n?.getPermissionDescription(perm) || perm;
      const confirmed = await this.confirm({
        title: this.t("settings.permissionsTab.confirmRevokeSingleTitle"),
        message: this.t("settings.permissionsTab.confirmRevokeSingleMsg", {
          appName: appName || appId,
          perm: permName,
        }),
        danger: true,
      });
      if (confirmed) {
        window.System?.permissions?.revokePermission(appId, perm);
        permissionsVersion.value++;
      }
    };

    const handleSetPermissionDirect = (appId, perm, granted) => {
      window.System?.permissions?.grant(appId, perm, granted);
      permissionsVersion.value++;
    };

    const handleRevokeAllPermissions = async (appId, appName) => {
      const confirmed = await this.confirm({
        title: this.t("settings.permissionsTab.confirmRevokeTitle"),
        message: this.t("settings.permissionsTab.confirmRevokeMsg"),
        danger: true,
      });
      if (confirmed) {
        window.System?.permissions?.revokeAll(appId);
        permissionsVersion.value++;
      }
    };

    const getAppPermissionsList = () => {
      // 依存性 tracker として permissionsVersion を参照
      const _ = permissionsVersion.value;
      const appMap = new Map();

      // 1. 登録済み全アプリ
      const allApps = window.System?.registry?.list() || window.System?.listApps() || [];
      for (const app of allApps) {
        if (app.permissions && Array.isArray(app.permissions) && app.permissions.length > 0) {
          appMap.set(app.id, {
            id: app.id,
            name: window.System?.i18n?.getAppName(app) || app.name,
            icon: app.icon,
            permissions: app.permissions,
            isRunning: false,
            uuid: null,
          });
        }
      }

      // 2. 実行中プロセスで上書き/追加
      const procs = window.System?.listProcesses() || [];
      for (const proc of procs) {
        const app = window.System?.getApp(proc.uuid);
        const manifest = app?._manifest;
        if (manifest?.id && manifest?.permissions?.length > 0) {
          const entry = appMap.get(manifest.id) || {
            id: manifest.id,
            name: window.System?.i18n?.getAppName(manifest) || proc.name,
            icon: manifest.icon,
            permissions: manifest.permissions,
          };
          entry.isRunning = true;
          entry.uuid = proc.uuid;
          appMap.set(manifest.id, entry);
        }
      }

      return Array.from(appMap.values());
    };

    // ─── テンプレート定義 ─────────────────────────────────────────────────
    this.template = hamon`
      <div class="settings-layout">
        <!-- サイドバー -->
        <nav class="sidebar">
          <button
            :class=${() => `nav-btn ${activeTab.value === "appearance" ? "-active" : ""}`}
            @click=${() => activeTab.value = "appearance"}
          >
            <eskit-icon set="lucide" name="palette" size="16"></eskit-icon>
            <span>${() => this.t("settings.tabs.appearance")}</span>
          </button>
          <button
            :class=${() => `nav-btn ${activeTab.value === "language" ? "-active" : ""}`}
            @click=${() => activeTab.value = "language"}
          >
            <eskit-icon set="lucide" name="globe" size="16"></eskit-icon>
            <span>${() => this.t("settings.tabs.language")}</span>
          </button>
          <button
            :class=${() => `nav-btn ${activeTab.value === "notifications" ? "-active" : ""}`}
            @click=${() => activeTab.value = "notifications"}
          >
            <eskit-icon set="lucide" name="bell" size="16"></eskit-icon>
            <span>${() => this.t("settings.tabs.notifications")}</span>
          </button>
          <button
            :class=${() => `nav-btn ${activeTab.value === "system" ? "-active" : ""}`}
            @click=${() => activeTab.value = "system"}
          >
            <eskit-icon set="lucide" name="cpu" size="16"></eskit-icon>
            <span>${() => this.t("settings.tabs.system")}</span>
          </button>
          <button
            :class=${() => `nav-btn ${activeTab.value === "permissions" ? "-active" : ""}`}
            @click=${() => activeTab.value = "permissions"}
          >
            <eskit-icon set="lucide" name="shield" size="16"></eskit-icon>
            <span>${() => this.t("settings.tabs.permissions")}</span>
          </button>
        </nav>

        <!-- メインコンテンツ -->
        <main class="content-pane">
          <!-- ─── 外観タブ ─── -->
          <div class="tab-pane" kit-if=${() => activeTab.value === "appearance"}>
            <div class="page-header">
              <h2 class="page-title">
                <eskit-icon set="lucide" name="palette" size="22"></eskit-icon>
                ${() => this.t("settings.tabs.appearance")}
              </h2>
              <p class="page-desc">${() => this.t("settings.appearance.desc")}</p>
            </div>

            <!-- カラーモード -->
            <div class="card">
              <h3 class="card-title">
                <eskit-icon set="lucide" name="sun" size="16"></eskit-icon>
                ${() => this.t("settings.appearance.colorMode")}
              </h3>
              <div class="mode-selector">
                <div
                  :class=${() => `mode-card ${currentMode.value === "auto" ? "-active" : ""}`}
                  @click=${() => handleSetMode("auto")}
                >
                  <eskit-icon set="lucide" name="sparkles" size="20"></eskit-icon>
                  <span>${() => this.t("settings.appearance.auto")}</span>
                </div>
                <div
                  :class=${() => `mode-card ${currentMode.value === "light" ? "-active" : ""}`}
                  @click=${() => handleSetMode("light")}
                >
                  <eskit-icon set="lucide" name="sun" size="20"></eskit-icon>
                  <span>${() => this.t("settings.appearance.light")}</span>
                </div>
                <div
                  :class=${() => `mode-card ${currentMode.value === "dark" ? "-active" : ""}`}
                  @click=${() => handleSetMode("dark")}
                >
                  <eskit-icon set="lucide" name="moon" size="20"></eskit-icon>
                  <span>${() => this.t("settings.appearance.dark")}</span>
                </div>
              </div>
            </div>

            <!-- テーマプリセット -->
            <div class="card">
              <h3 class="card-title">
                <eskit-icon set="lucide" name="layout-grid" size="16"></eskit-icon>
                ${() => this.t("settings.appearance.themePreset")}
              </h3>
              <div class="theme-grid">
                ${(window.System?.theme?.list || []).map((t) => {
                  const p = t.vars || {};
                  return hamon`
                    <div
                      :class=${() => `theme-card ${currentThemeId.value === t.id ? "-active" : ""}`}
                      @click=${() => handleApplyTheme(t.id)}
                    >
                      <div class="theme-palette-preview">
                        <div class="palette-swatch" :style=${`background: ${p["--kit-color-primary"] || "#1e8fff"}`}></div>
                        <div class="palette-swatch" :style=${`background: ${p["--kit-bg"] || "#1a1a2e"}`}></div>
                        <div class="palette-swatch" :style=${`background: ${p["--kit-bg-secondary"] || "#252540"}`}></div>
                        <div class="palette-swatch" :style=${`background: ${p["--kit-fg"] || "#e0e0e0"}`}></div>
                      </div>
                      <div class="theme-name">${t.name}</div>
                    </div>
                  `;
                })}
              </div>
            </div>

            <!-- 壁紙 -->
            <div class="card">
              <h3 class="card-title">
                <eskit-icon set="lucide" name="monitor" size="16"></eskit-icon>
                ${() => this.t("settings.appearance.wallpaper")}
              </h3>
              <div class="wallpaper-grid">
                ${(window.System?.theme?.wallpapers || []).map((w) => {
                  return hamon`
                    <div
                      :class=${() => `wallpaper-card ${currentWallpaper.value === w.value ? "-active" : ""}`}
                      :style=${`background: ${w.value}`}
                      @click=${() => handleSetWallpaper(w.value)}
                    >
                      <div class="wallpaper-label">${w.name}</div>
                    </div>
                  `;
                })}

                <div
                  kit-if=${() => isCustomWallpaper.value}
                  :class=${() => `wallpaper-card ${isCustomWallpaper.value ? "-active" : ""}`}
                  :style=${() => `background-image: ${resolvedWallpaperBg.value}; background-size: cover; background-position: center;`}
                  @click=${() => handleSetWallpaper(currentWallpaper.value)}
                >
                  <div class="wallpaper-label" :title=${() => customWallpaperName.value}>
                    <span>${() => customWallpaperName.value || this.t("settings.appearance.customWallpaper")}</span>
                  </div>
                </div>

                <div
                  class="wallpaper-card -add"
                  @click=${handlePickWallpaper}
                  :title=${() => this.t("settings.appearance.pickWallpaper")}
                >
                  <div class="wallpaper-add-content">
                    <eskit-icon set="lucide" name="plus" size="20"></eskit-icon>
                    <span class="wallpaper-add-text">${() => this.t("settings.appearance.pickWallpaper")}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 外部テーマのインポート & エクスポート -->
            <div class="card">
              <h3 class="card-title">
                <eskit-icon set="lucide" name="download" size="16"></eskit-icon>
                ${() => this.t("settings.appearance.importTheme")}
              </h3>
              <div class="kit-flex kit-gap-s kit-flex-middle">
                <input
                  class="kit-textbox kit-flex-fit"
                  type="url"
                  placeholder=${this.t("settings.appearance.importPlaceholder")}
                  :value=${() => importUrl.value}
                  @input=${(e) => importUrl.value = e.target.value}
                >
                <button class="kit-button -primary" @click=${handleImportTheme}>
                  <eskit-icon set="lucide" name="download" size="14"></eskit-icon>
                  <span>${() => this.t("settings.appearance.importButton")}</span>
                </button>
              </div>
              <div class="kit-flex kit-gap-s kit-flex-middle kit-p-t-s">
                <button class="kit-button" @click=${handleExportTheme}>
                  <eskit-icon set="lucide" name="copy" size="14"></eskit-icon>
                  <span>${() => this.t("settings.appearance.exportTheme")}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ─── 言語タブ ─── -->
          <div class="tab-pane" kit-if=${() => activeTab.value === "language"}>
            <div class="page-header">
              <h2 class="page-title">
                <eskit-icon set="lucide" name="globe" size="22"></eskit-icon>
                ${() => this.t("settings.tabs.language")}
              </h2>
              <p class="page-desc">${() => this.t("settings.language.desc")}</p>
            </div>

            <div class="card">
              <h3 class="card-title">${() => this.t("settings.language.selectLanguage")}</h3>
              <div class="kit-flex kit-gap-m">
                <button
                  :class=${() => `kit-button ${currentLocale.value === "ja" ? "-primary" : ""}`}
                  @click=${() => handleSetLocale("ja")}
                >
                  <eskit-icon set="lucide" name="check" size="14"></eskit-icon>
                  <span>${() => this.t("settings.language.japanese")}</span>
                </button>
                <button
                  :class=${() => `kit-button ${currentLocale.value === "en" ? "-primary" : ""}`}
                  @click=${() => handleSetLocale("en")}
                >
                  <eskit-icon set="lucide" name="check" size="14"></eskit-icon>
                  <span>${() => this.t("settings.language.english")}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ─── 通知タブ ─── -->
          <div class="tab-pane" kit-if=${() => activeTab.value === "notifications"}>
            <div class="page-header">
              <h2 class="page-title">
                <eskit-icon set="lucide" name="bell" size="22"></eskit-icon>
                ${() => this.t("settings.tabs.notifications")}
              </h2>
              <p class="page-desc">${() => this.t("settings.notificationsTab.desc")}</p>
            </div>

            <div class="card">
              <div class="kit-flex kit-flex-between kit-flex-middle">
                <h3 class="card-title">${() => this.t("settings.notificationsTab.history")}</h3>
                <div class="kit-flex kit-gap-s">
                  <button class="kit-button -small -alt" @click=${handleSendTestNotification}>
                    <eskit-icon set="lucide" name="send" size="12"></eskit-icon>
                    <span>${() => this.t("settings.notificationsTab.sendTest")}</span>
                  </button>
                  <button class="kit-button -small -danger" @click=${handleClearNotifications}>
                    <eskit-icon set="lucide" name="trash-2" size="12"></eskit-icon>
                    <span>${() => this.t("settings.notificationsTab.clearHistory")}</span>
                  </button>
                </div>
              </div>

              <div kit-if=${() => notificationsList.value.length === 0} class="empty-state">
                ${() => this.t("notifications.noNotifications")}
              </div>

              <table kit-if=${() => notificationsList.value.length > 0} class="data-table">
                <thead>
                  <tr>
                    <th>${() => this.t("notifications.colType")}</th>
                    <th>${() => this.t("notifications.colTitle")}</th>
                    <th>${() => this.t("notifications.colMessage")}</th>
                    <th>${() => this.t("notifications.colTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${list(() => notificationsList.value, (item) => hamon`
                    <tr>
                      <td><eskit-icon set="lucide" name=${item.icon || (item.type === "success" ? "check-circle" : item.type === "error" ? "alert-circle" : "info")} size="14"></eskit-icon></td>
                      <td><strong>${item.title}</strong></td>
                      <td>${item.message}</td>
                      <td>${() => window.System?.i18n?.formatTime(item.time) || new Date(item.time).toLocaleTimeString()}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── システムタブ ─── -->
          <div class="tab-pane" kit-if=${() => activeTab.value === "system"}>
            <div class="page-header">
              <h2 class="page-title">
                <eskit-icon set="lucide" name="cpu" size="22"></eskit-icon>
                ${() => this.t("settings.tabs.system")}
              </h2>
              <p class="page-desc">${() => this.t("settings.systemTab.desc")}</p>
            </div>

            <div class="card">
              <h3 class="card-title">${() => this.t("settings.systemTab.osInfo")}</h3>
              <table class="data-table">
                <tbody>
                  <tr>
                    <td><strong>${() => this.t("settings.systemTab.version")}</strong></td>
                    <td>ESKit v1.0.0 (Phase 5)</td>
                  </tr>
                  <tr>
                    <td><strong>${() => this.t("settings.systemTab.framework")}</strong></td>
                    <td>Vanilla JS + Web Components + Hamon + kitstrap2</td>
                  </tr>
                  <tr>
                    <td><strong>${() => this.t("settings.systemTab.user")}</strong></td>
                    <td>${() => window.System?.currentUser?.name || "admin"} (${() => window.System?.currentUser?.id || "admin"})</td>
                  </tr>
                  <tr>
                    <td><strong>${() => this.t("settings.systemTab.shellMode")}</strong></td>
                    <td>${() => window.System?.shellMode?.current || "desktop"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="card">
              <h3 class="card-title">${() => this.t("settings.systemTab.processes")}</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${() => this.t("settings.systemTab.colAppName")}</th>
                    <th>${() => this.t("settings.systemTab.colUuid")}</th>
                    <th>${() => this.t("settings.systemTab.colState")}</th>
                    <th>${() => this.t("settings.systemTab.colAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${list(() => processes.value, (proc) => hamon`
                    <tr>
                      <td><strong>${proc.name}</strong></td>
                      <td><code>${proc.uuid.slice(0, 8)}...</code></td>
                      <td><span class="kit-badge -success">${proc.state}</span></td>
                      <td>
                        <button class="kit-button -small -danger" @click=${() => handleKillProcess(proc.uuid)}>
                          ${() => this.t("settings.systemTab.kill")}
                        </button>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── 権限タブ ─── -->
          <div class="tab-pane" kit-if=${() => activeTab.value === "permissions"}>
            <div class="page-header">
              <h2 class="page-title">
                <eskit-icon set="lucide" name="shield" size="22"></eskit-icon>
                ${() => this.t("settings.tabs.permissions")}
              </h2>
              <p class="page-desc">${() => this.t("settings.permissionsTab.desc")}</p>
            </div>

            <div class="card">
              <h3 class="card-title">${() => this.t("settings.permissionsTab.appPermissions")}</h3>

              <div kit-if=${() => getAppPermissionsList().length === 0} class="empty-state">
                ${() => this.t("settings.permissionsTab.noApps")}
              </div>

              ${list(
                () => getAppPermissionsList(),
                (app) => {
                  return hamon`
                    <div class="perm-app-section">
                      <div class="perm-app-header">
                        <div class="perm-app-info">
                          <eskit-icon set="lucide" name=${app.icon?.name || "box"} size="18"></eskit-icon>
                          <div>
                            <span class="perm-app-name">${() => app.name}</span>
                            <span class="perm-app-id"> (${() => app.id})</span>
                          </div>
                          ${app.isRunning ? hamon`<span class="kit-badge -success -xsmall">Running</span>` : ""}
                        </div>
                        <button
                          class="kit-button -small -alt"
                          @click=${() => handleRevokeAllPermissions(app.id, app.name)}
                          title=${this.t("settings.permissionsTab.revokeAll")}
                        >
                          <eskit-icon set="lucide" name="rotate-ccw" size="12"></eskit-icon>
                          <span>${() => this.t("settings.permissionsTab.revokeAll")}</span>
                        </button>
                      </div>

                      <div class="perm-list">
                        ${app.permissions.map((perm) => {
                          const state = () => window.System?.permissions?.getPermissionState(app.id, perm) || "unprompted";
                          return hamon`
                            <div class="perm-item">
                              <div class="perm-item-details">
                                <span class="kit-badge -primary" style="font-family: var(--kit-font-family-mono); font-size: 0.75rem;">${perm}</span>
                                <span class="perm-desc-text">${() => window.System?.i18n?.getPermissionDescription(perm)}</span>
                              </div>
                              <div class="perm-actions">
                                <span
                                  :class=${() => `kit-badge ${state() === "granted" ? "-success" : state() === "denied" ? "-danger" : "-secondary"}`}
                                  style="font-size: 0.75rem;"
                                >
                                  ${() => state() === "granted"
                                    ? this.t("settings.permissionsTab.stateGranted")
                                    : state() === "denied"
                                      ? this.t("settings.permissionsTab.stateDenied")
                                      : this.t("settings.permissionsTab.stateUnprompted")}
                                </span>

                                <div class="kit-flex kit-gap-xs">
                                  <button
                                    class="kit-button -small -alt"
                                    kit-if=${() => state() !== "granted"}
                                    @click=${() => handleSetPermissionDirect(app.id, perm, true)}
                                    title=${this.t("settings.permissionsTab.allowSingle")}
                                  >
                                    <eskit-icon set="lucide" name="check" size="12"></eskit-icon>
                                  </button>
                                  <button
                                    class="kit-button -small -alt"
                                    kit-if=${() => state() !== "denied"}
                                    @click=${() => handleSetPermissionDirect(app.id, perm, false)}
                                    title=${this.t("settings.permissionsTab.denySingle")}
                                  >
                                    <eskit-icon set="lucide" name="x" size="12"></eskit-icon>
                                  </button>
                                  <button
                                    class="kit-button -small -danger"
                                    kit-if=${() => state() !== "unprompted"}
                                    @click=${() => handleRevokeSinglePermission(app.id, perm, app.name)}
                                    title=${this.t("settings.permissionsTab.revokeSingle")}
                                  >
                                    <eskit-icon set="lucide" name="trash-2" size="12"></eskit-icon>
                                    <span>${() => this.t("settings.permissionsTab.revokeSingle")}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          `;
                        })}
                      </div>
                    </div>
                  `;
                }
              )}
            </div>
          </div>
        </main>
      </div>
    `;
  }

  initialize() {
    this.setTitle(this.t("settings.title"));
    this.hamon.effect(() => {
      this.setTitle(this.t("settings.title"));
    });
  }

  close() {
    this.onCloseCleanup?.();
  }
}
