/**
 * Shadow DOM を含むイベント経路に、入力欄や編集可能な要素があるか判定する。
 * 閉じた Shadow Root 内の判定は、経路に公開されるホスト要素に依存する。
 *
 * @param {Event} event 判定するイベント。
 * @returns {boolean} 入力・編集中の要素から発生した場合は true。
 */
export function isEditingEvent(event) {
  // target は Shadow DOM の外側でホストに置き換わるため、経路全体を確認する。
  return event.composedPath().some(node =>
    node instanceof HTMLElement &&
    (node.matches("input, textarea, select") || node.isContentEditable)
  );
}

/**
 * デスクトップ背景の右クリックをシェル側で処理してよいか判定する。
 * アプリや操作可能な要素、先に処理されたイベントは対象から除く。
 *
 * @param {MouseEvent} event 右クリックのイベント。
 * @param {HTMLElement|null|undefined} desktop デスクトップ要素。
 * @returns {boolean} シェルのコンテキストメニューを表示する場合は true。
 */
export function isDesktopContextMenu(event, desktop) {
  const path = event.composedPath();
  const origin = path.find(node => node instanceof Element);

  return Boolean(desktop && origin) &&
    !event.defaultPrevented &&
    !isEditingEvent(event) &&
    (origin === desktop || origin?.getRootNode() === desktop?.shadowRoot) &&
    !path.some(node =>
      node instanceof Element &&
      node.matches("eskit-window, button, a, [role='button']")
    );
}

/**
 * 入力操作を妨げずに Beacon のショートカットを実行できるか判定する。
 *
 * @param {KeyboardEvent} event キー入力のイベント。
 * @returns {boolean} Ctrl/Cmd+Space を実行する場合は true。
 */
export function isBeaconShortcut(event) {
  // 一部の IME は isComposing だけでは判定できないため、keyCode 229 も除外する。
  return event.code === "Space" &&
    (event.ctrlKey || event.metaKey) &&
    !event.defaultPrevented &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    !event.repeat &&
    !isEditingEvent(event);
}
