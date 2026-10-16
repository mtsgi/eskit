import hamon from "system/hamon.js";

/**
 * モバイル用ホームバーをリアクティブなテンプレートとして生成する。
 * 動的な属性値は :attr で渡し、翻訳結果を HTML の構造として解釈させない。
 *
 * @param {import("system/hamon.js").HamonScope} scope 呼出元から渡されるスコープ（現在は未使用）。
 * @returns {DocumentFragment} 表示用のフラグメント。
 */
export default (scope) => hamon`
  <button class="home-btn kit-button -flat" id="home-btn" :title=${() => window.System?.i18n?.t("system.home") || "ホーム / ドロワー"}>
    <eskit-icon set="lucide" name="boxes" size="20"></eskit-icon>
  </button>
  <span class="current-app" id="current-app-name"></span>
`;
