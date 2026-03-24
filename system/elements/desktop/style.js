import { css } from "system/util.js";

export default css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
  }

  /* モバイルモード: ウィンドウは fixed 配置なのでスクロールは不要 */
  :host([mode="mobile"]) {
    overflow: hidden;
  }
`;
