import hamon from "system/hamon.js";

/**
 * Beacon の検索パネルをリアクティブなテンプレートとして生成する。
 * 動的な属性値は :attr で渡し、翻訳結果を HTML の構造として解釈させない。
 *
 * @param {import("system/hamon.js").HamonScope} scope 呼出元から渡されるスコープ（現在は未使用）。
 * @returns {DocumentFragment} 表示用のフラグメント。
 */
export default (scope) => hamon`
  <div class="beacon-overlay" id="overlay">
    <div class="beacon-panel">
      <div class="beacon-header">
        <span class="beacon-icon"><eskit-icon set="lucide" name="search" size="18"></eskit-icon></span>
        <input
          type="text"
          id="beacon-input"
          class="kit-textbox kit-flex-fit -rounded"
          :placeholder=${() => window.System?.i18n?.t("system.searchPlaceholder") || "アプリを検索…"}
          autocomplete="off"
        >
      </div>
      <div class="beacon-results" id="beacon-results"></div>
    </div>
  </div>
`;
