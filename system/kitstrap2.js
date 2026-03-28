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

const sheet = new CSSStyleSheet();
let cssText = "";

try {
  const res = await fetch(new URL("./kitstrap2.css", import.meta.url));
  if (res.ok) {
    cssText = await res.text();
  } else {
    console.error(`Failed to load kitstrap2.css: ${res.status} ${res.statusText}`);
  }
} catch (err) {
  console.error("Failed to load kitstrap2.css:", err);
}

await sheet.replace(cssText);

export default sheet;
