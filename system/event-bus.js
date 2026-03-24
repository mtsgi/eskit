/**
 * ESKitEventBus — pub/sub イベントバス
 *
 * システム全体のイベント通信を管理する。
 * on() の返値は購読解除関数。
 */
export default class ESKitEventBus {
  #listeners = new Map(); // event → Set<handler>

  /**
   * イベントを購読する。
   * @param {string} event
   * @param {Function} handler
   * @returns {() => void} 購読解除関数
   */
  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * イベントを一度だけ購読する。
   * @param {string} event
   * @param {Function} handler
   * @returns {() => void} 購読解除関数
   */
  once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * 購読を解除する。
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    this.#listeners.get(event)?.delete(handler);
  }

  /**
   * イベントを発行する。
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    for (const handler of this.#listeners.get(event) ?? []) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[ESKitEventBus] Error in handler for "${event}":`, err);
      }
    }
  }
}
