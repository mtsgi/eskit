import { css } from "system/util.js";

export default css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    /* デスクトップモード: タスクバー分の余白を確保 */
    padding-bottom: var(--eskit-taskbar-height, 48px);
  }

  /* モバイルモード: ウィンドウは fixed 配置なのでスクロールは不要 */
  :host([mode="mobile"]) {
    overflow: hidden;
    padding-bottom: 0;
  }
`;
