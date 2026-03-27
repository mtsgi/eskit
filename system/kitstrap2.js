/**
 * kitstrap2.js — Singleton CSSStyleSheet for Shadow DOM adoption
 *
 * Shadow DOM 内で .kit-* クラスを使えるようにするため、
 * kitstrap2.css を一度だけパースして共有 CSSStyleSheet として export する。
 *
 * 使用例:
 *   import kitstrap2Sheet from "system/kitstrap2.js";
 *   this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, mySheet];
 */

const res = await fetch(new URL("./kitstrap2.css", import.meta.url));
const cssText = await res.text();

const sheet = new CSSStyleSheet();
await sheet.replace(cssText);

export default sheet;
