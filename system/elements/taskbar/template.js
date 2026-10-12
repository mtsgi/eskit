import hamon from "system/hamon.js";

/**
 * デスクトップ用タスクバーをリアクティブなテンプレートとして生成する。
 * 動的な属性値は :attr で渡し、翻訳結果を HTML の構造として解釈させない。
 *
 * @param {import("system/hamon.js").HamonScope} scope 呼出元から渡されるスコープ（現在は未使用）。
 * @returns {DocumentFragment} 表示用のフラグメント。
 */
export default (scope) => hamon`
  <div class="taskbar" part="taskbar">
    <button
      class="launcher-btn"
      id="launcher-btn"
      :title=${() => window.System?.i18n?.t("system.launcher") || "ランチャー"}
      :aria-label=${() => window.System?.i18n?.t("system.launcher") || "ランチャー"}
    >
      <eskit-icon set="lucide" name="boxes" size="20"></eskit-icon>
    </button>
    <div class="taskbar-apps" id="taskbar-apps"></div>
    <div class="taskbar-tray">
      <div class="clock" id="clock"></div>
    </div>
  </div>
`;
