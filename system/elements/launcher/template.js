import hamon from "system/hamon.js";

/**
 * アプリランチャーをリアクティブなテンプレートとして生成する。
 * 動的な属性値は :attr で渡し、翻訳結果を HTML の構造として解釈させない。
 *
 * @param {import("system/hamon.js").HamonScope} scope 呼出元から渡されるスコープ（現在は未使用）。
 * @returns {DocumentFragment} 表示用のフラグメント。
 */
export default (scope) => hamon`
  <div class="launcher-panel" part="panel">
    <div class="launcher-header">
      <input
        type="text"
        id="launcher-search"
        class="kit-textbox kit-flex-fit"
        :placeholder=${() => window.System?.i18n?.t("system.searchPlaceholder") || "アプリを検索…"}
      >
    </div>
    <div class="launcher-grid" id="launcher-grid"></div>
  </div>
`;
