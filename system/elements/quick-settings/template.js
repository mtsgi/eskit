import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="quick-settings" popover="manual" id="panel">
    <div class="qs-header">
      <span class="qs-header-title">
        <eskit-icon set="lucide" name="sliders" size="14"></eskit-icon>
        <span id="qs-title-text">${() => window.System?.i18n?.t("system.quickSettings") || "クイック設定"}</span>
      </span>
      <button class="kit-button -small -flat" id="open-settings-btn" title=${() => window.System?.i18n?.t("system.openSettings") || "設定を開く"}>
        <eskit-icon set="lucide" name="settings" size="14"></eskit-icon>
      </button>
    </div>

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="user" size="14"></eskit-icon>
          <span id="qs-user-label">${() => window.System?.i18n?.t("system.currentUser") || "ユーザー"}</span>
        </span>
        <span class="qs-value" id="current-user"></span>
      </div>
      <div class="qs-row">
        <button class="kit-button -small logout-btn" id="logout-btn">
          <eskit-icon set="lucide" name="power" size="14"></eskit-icon>
          <span id="qs-logout-text">${() => window.System?.i18n?.t("system.logout") || "ログアウト"}</span>
        </button>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="monitor-smartphone" size="14"></eskit-icon>
          <span id="qs-mode-label">${() => window.System?.i18n?.t("system.switchMode") || "シェルモード"}</span>
        </span>
        <div class="kit-buttongroup" id="mode-group">
          <button class="kit-button -small mode-btn" data-mode="auto">Auto</button>
          <button class="kit-button -small mode-btn" data-mode="desktop">Desktop</button>
          <button class="kit-button -small mode-btn" data-mode="mobile">Mobile</button>
        </div>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="palette" size="14"></eskit-icon>
          <span id="qs-theme-label">${() => window.System?.i18n?.t("settings.tabs.appearance") || "テーマ"}</span>
        </span>
        <div class="kit-buttongroup" id="theme-mode-group">
          <button class="kit-button -small theme-mode-btn" data-theme-mode="auto" title=${() => window.System?.i18n?.t("settings.appearance.auto") || "OS連動"}>
            <eskit-icon set="lucide" name="sparkles" size="12"></eskit-icon>
          </button>
          <button class="kit-button -small theme-mode-btn" data-theme-mode="light" title=${() => window.System?.i18n?.t("settings.appearance.light") || "ライト"}>
            <eskit-icon set="lucide" name="sun" size="12"></eskit-icon>
          </button>
          <button class="kit-button -small theme-mode-btn" data-theme-mode="dark" title=${() => window.System?.i18n?.t("settings.appearance.dark") || "ダーク"}>
            <eskit-icon set="lucide" name="moon" size="12"></eskit-icon>
          </button>
        </div>
      </div>
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="globe" size="14"></eskit-icon>
          <span id="qs-lang-label">${() => window.System?.i18n?.t("settings.tabs.language") || "言語"}</span>
        </span>
        <div class="kit-buttongroup" id="lang-group">
          <button class="kit-button -small lang-btn" data-lang="ja">JA</button>
          <button class="kit-button -small lang-btn" data-lang="en">EN</button>
        </div>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="bell" size="14"></eskit-icon>
          <span id="qs-notify-label">${() => window.System?.i18n?.t("notifications.title") || "通知"}</span>
        </span>
        <span class="qs-value kit-badge" id="notification-count">0</span>
      </div>
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="cpu" size="14"></eskit-icon>
          <span id="qs-process-label">${() => window.System?.i18n?.t("system.runningProcesses") || "実行中プロセス"}</span>
        </span>
        <span class="qs-value kit-badge -primary" id="process-count">0</span>
      </div>
    </div>
  </div>
`;
