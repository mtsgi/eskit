import hamon from "system/hamon.js";

/**
 * ウィンドウのヘッダーとリサイズハンドルをリアクティブなテンプレートとして生成する。
 * 動的な属性値は :attr で渡し、翻訳結果を HTML の構造として解釈させない。
 *
 * @param {import("system/hamon.js").HamonScope} scope 呼出元から渡されるスコープ（現在は未使用）。
 * @returns {DocumentFragment} 表示用のフラグメント。
 */
export default (scope) => hamon`
  <div class="resize-handle resize-n" data-dir="n"></div>
  <div class="resize-handle resize-s" data-dir="s"></div>
  <div class="resize-handle resize-e" data-dir="e"></div>
  <div class="resize-handle resize-w" data-dir="w"></div>
  <div class="resize-handle resize-ne" data-dir="ne"></div>
  <div class="resize-handle resize-nw" data-dir="nw"></div>
  <div class="resize-handle resize-se" data-dir="se"></div>
  <div class="resize-handle resize-sw" data-dir="sw"></div>
  <div class="app-header">
    <span class="app-icon" id="window-icon"></span>
    <span class="app-title"></span>
    <div class="app-controls">
      <button class="btn-minimize" :title=${() => window.System?.i18n?.t("system.minimize") || "最小化"}>
        <eskit-icon set="lucide" name="minus" size="14"></eskit-icon>
      </button>
      <button class="btn-maximize" :title=${() => window.System?.i18n?.t("system.maximize") || "最大化"}>
        <eskit-icon set="lucide" name="square" size="12"></eskit-icon>
      </button>
      <button class="btn-close" :title=${() => window.System?.i18n?.t("system.close") || "閉じる"}>
        <eskit-icon set="lucide" name="x" size="14"></eskit-icon>
      </button>
    </div>
  </div>
`;
