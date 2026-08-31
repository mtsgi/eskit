import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="dialog" part="dialog" role="dialog" aria-modal="true" aria-labelledby="perm-title">
    <h3 class="title kit-flex kit-flex-middle kit-gap-xs" id="perm-title">
      <eskit-icon set="lucide" name="shield" size="18"></eskit-icon>
      <span>${() => window.System?.i18n?.t("permissions.requestTitle") || "アクセス許可の要求"}</span>
    </h3>
    <p class="description" id="perm-desc"></p>
    <div class="perm-info kit-m-b-m">
      <code class="perm-badge" id="perm-badge"></code>
      <p class="perm-detail kit-m-t-xs" id="perm-detail" style="font-size: 0.85em; opacity: 0.85;"></p>
    </div>
    <div class="actions">
      <button class="btn btn-deny kit-button" id="btn-deny">
        ${() => window.System?.i18n?.t("permissions.deny") || "拒否"}
      </button>
      <button class="btn btn-allow kit-button -primary" id="btn-allow">
        ${() => window.System?.i18n?.t("permissions.allow") || "許可"}
      </button>
    </div>
  </div>
`;
