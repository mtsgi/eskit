import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="drawer-panel" part="panel">
    <div class="drawer-handle"></div>
    <div class="drawer-topbar">
      <span class="drawer-time" id="drawer-time"></span>
      <button class="qs-open-btn" id="qs-btn" title=${() => window.System?.i18n?.t("system.quickSettings") || "クイック設定"}>
        <eskit-icon set="lucide" name="settings" size="16"></eskit-icon>
        <span class="qs-open-label">${() => window.System?.i18n?.t("system.quickSettings") || "設定"}</span>
      </button>
      <button class="qs-open-btn" id="beacon-btn" title=${() => window.System?.i18n?.t("system.beacon") || "検索"}>
        <eskit-icon set="lucide" name="search" size="16"></eskit-icon>
        <span class="qs-open-label">${() => window.System?.i18n?.t("system.beacon") || "検索"}</span>
      </button>
    </div>
    <section class="section">
      <div class="section-header">${() => window.System?.i18n?.t("system.runningProcesses") || "実行中のアプリ"}</div>
      <div class="app-list" id="running-list"></div>
    </section>
    <section class="section">
      <div class="section-header">${() => window.System?.i18n?.t("system.allApps") || "すべてのアプリ"}</div>
      <div class="app-grid" id="all-apps-grid"></div>
    </section>
  </div>
`;
