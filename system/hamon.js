/**
 * Hamon — ESKit リアクティブテンプレートエンジン
 *
 * シグナル方式のリアクティビティ (VDOM なし) で宣言的 UI を構築する。
 * 各シグナルに依存する DOM ノードを直接・最小限に更新する (SolidJS に近い方式)。
 *
 * @module system/hamon
 *
 * エクスポート:
 *   signal(value)              リアクティブ値
 *   computed(fn)               派生シグナル (読み取り専用)
 *   effect(fn)                 副作用 (依存変化で自動再実行)
 *   isSignal(v)                Signal 判定
 *   hamon`...`                 リアクティブ DocumentFragment を返すタグ関数
 *   list(itemsFn, renderFn)    リスト描画ヘルパー
 *   HamonScope                 Effect ライフサイクルスコープ
 */

// ─── シンボル・モジュールレベル状態 ──────────────────────────────────────────

/** Signal オブジェクトであることを示す内部ブランドシンボル */
const SIGNAL_BRAND = Symbol("hamon.signal");

/** list() ヘルパーオブジェクトであることを示す内部シンボル */
const LIST_MARKER = Symbol("hamon.list");

/**
 * 現在実行中の Effect オブジェクト。
 * signal の get アクセサがこれを参照して自動依存追跡を行う。
 * Effect 実行外では null。
 */
let _activeEffect = null;

// ═════════════════════════════════════════════════════════════════════════════
//  リアクティブプリミティブ
// ═════════════════════════════════════════════════════════════════════════════

/**
 * リアクティブな値を作成する。
 *
 * `value` プロパティの get 時に現在実行中の Effect を依存として登録し、
 * set 時に変化があれば依存する全 Effect を再実行する。
 *
 * @template T
 * @param {T} initialValue - 初期値
 * @returns {{ value: T, peek(): T }}
 */
export function signal(initialValue) {
  /** 現在の値 */
  let _currentValue = initialValue;
  /** この Signal に依存している Effect の集合 */
  const _subscribers = new Set();

  return {
    get value() {
      // 実行中 Effect があれば依存として登録する
      if (_activeEffect) {
        _subscribers.add(_activeEffect);
        _activeEffect._trackedSubscriptions.add(_subscribers);
      }
      return _currentValue;
    },
    set value(nextValue) {
      // 同値なら何もしない (Object.is で NaN・±0 も正しく比較)
      if (Object.is(_currentValue, nextValue)) return;
      _currentValue = nextValue;
      // 依存する Effect を全て再実行 (コピーしてから走査: 再実行中に Set が変わる可能性)
      for (const eff of [..._subscribers]) eff._run();
    },
    /**
     * 依存追跡なしで現在値を読む。
     * Effect 内から値を読みたいが依存登録したくないケースで使用する。
     */
    peek() { return _currentValue; },
    /** @internal — Effect が依存解除する際に参照する subscriber セット */
    _subscribers,
    /** @internal — Signal ブランド (isSignal() で使用) */
    [SIGNAL_BRAND]: true,
  };
}

/**
 * 引数が Signal オブジェクトかどうかを判定する。
 * @param {*} value
 * @returns {boolean}
 */
export function isSignal(value) {
  return value != null && value[SIGNAL_BRAND] === true;
}

// ─── effect ──────────────────────────────────────────────────────────────────

/**
 * 副作用を登録する。
 *
 * `fn` 内で読み取ったシグナルが変化すると `fn` が自動的に再実行される。
 * `fn` が関数を返した場合、次回再実行・dispose 前にクリーンアップとして呼ばれる。
 *
 * @param {() => (void | (() => void))} fn - 副作用関数
 * @returns {() => void} Effect を解除する dispose 関数
 */
export function effect(fn) {
  const eff = _createEffect(fn);
  eff._run();
  return () => eff._dispose();
}

/**
 * Effect の内部オブジェクトを生成するファクトリ関数。
 * effect() と computed() の両方から使用される。
 *
 * @param {() => (void | (() => void))} fn
 * @returns {{ _run(): void, _dispose(): void, _trackedSubscriptions: Set }}
 */
function _createEffect(fn) {
  /** dispose 済みかどうか */
  let isDisposed = false;
  /** 前回実行時に fn が返したクリーンアップ関数 */
  let cleanupFn = null;

  const eff = {
    /**
     * この Effect が依存している Signal の _subscribers セット群。
     * 再実行前に古い依存を解除するために使用する。
     * @type {Set<Set>}
     */
    _trackedSubscriptions: new Set(),

    /** Effect を実行する (依存収集・クリーンアップ込み) */
    _run() {
      if (isDisposed) return;
      // 前回のクリーンアップを実行
      if (typeof cleanupFn === "function") { cleanupFn(); cleanupFn = null; }
      // 古い依存から自身を除去 (依存の変化に追従するため毎回リセット)
      for (const subscriberSet of eff._trackedSubscriptions) subscriberSet.delete(eff);
      eff._trackedSubscriptions = new Set();
      // fn を実行しながら依存を収集 (_activeEffect 経由で signal.get が登録する)
      const previousEffect = _activeEffect;
      _activeEffect = eff;
      try {
        const returnValue = fn();
        if (typeof returnValue === "function") cleanupFn = returnValue;
      } finally {
        _activeEffect = previousEffect;
      }
    },

    /** Effect を完全に解除する */
    _dispose() {
      if (isDisposed) return;
      isDisposed = true;
      if (typeof cleanupFn === "function") { cleanupFn(); cleanupFn = null; }
      for (const subscriberSet of eff._trackedSubscriptions) subscriberSet.delete(eff);
      eff._trackedSubscriptions.clear();
    },
  };
  return eff;
}

// ─── computed ────────────────────────────────────────────────────────────────

/**
 * 読み取り専用の派生シグナルを作成する。
 *
 * 内部で Effect を使い、依存元シグナルが変化すると自動的に再計算される。
 * 計算結果が変化した場合のみ、この computed に依存する Effect を通知する。
 *
 * @template T
 * @param {() => T} fn - 派生値を計算する関数
 * @returns {{ readonly value: T, peek(): T }}
 */
export function computed(fn) {
  /** 最新の計算結果 */
  let _cachedValue;
  /** この computed に依存している Effect の集合 */
  const _subscribers = new Set();

  // 依存元の変化を監視し、値が変わったら downstream の Effect を再実行する
  const eff = _createEffect(() => {
    const nextValue = fn();
    if (!Object.is(_cachedValue, nextValue)) {
      _cachedValue = nextValue;
      // この computed を購読している Effect に変化を通知
      for (const downstreamEff of [..._subscribers]) downstreamEff._run();
    }
  });
  eff._run(); // 初期値を計算

  return {
    get value() {
      if (_activeEffect) {
        _subscribers.add(_activeEffect);
        _activeEffect._trackedSubscriptions.add(_subscribers);
      }
      return _cachedValue;
    },
    peek() { return _cachedValue; },
    _subscribers,
    [SIGNAL_BRAND]: true,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  HamonScope — Effect ライフサイクルスコープ
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Effect のライフサイクルスコープ。
 *
 * `effect()` / `onDispose()` で登録した全クリーンアップ処理を
 * `dispose()` 一度の呼び出しで一括解除できる。
 * ESKitApp のアプリ終了時に自動呼び出しされるため、
 * アプリ開発者は手動でリスナーを解除する必要がなくなる。
 */
export class HamonScope {
  /** @type {Array<() => void>} dispose 時に呼ぶ関数の一覧 */
  #disposeCallbacks = [];
  /** 既に dispose 済みかどうか */
  #isDisposed = false;

  /**
   * スコープ内でシグナルを作成する (グローバル `signal()` のエイリアス)。
   * @template T
   * @param {T} initialValue
   * @returns {{ value: T, peek(): T }}
   */
  signal(initialValue) { return signal(initialValue); }

  /**
   * スコープ内で computed を作成する (グローバル `computed()` のエイリアス)。
   * @template T
   * @param {() => T} fn
   * @returns {{ readonly value: T, peek(): T }}
   */
  computed(fn) { return computed(fn); }

  /**
   * スコープ内で Effect を作成する。
   * このスコープが dispose されると Effect も自動解除される。
   * @param {() => (void | (() => void))} fn
   * @returns {() => void} 個別の dispose 関数
   */
  effect(fn) {
    if (this.#isDisposed) return () => {};
    const disposeEffect = effect(fn);
    this.#disposeCallbacks.push(disposeEffect);
    return disposeEffect;
  }

  /**
   * スコープ内の全 Effect とコールバックを一括解除する。
   * アプリ終了時に ESKitSystem.closeApp() から自動呼び出しされる。
   */
  dispose() {
    if (this.#isDisposed) return;
    this.#isDisposed = true;
    for (const disposeCallback of this.#disposeCallbacks) disposeCallback();
    this.#disposeCallbacks.length = 0;
  }

  /**
   * dispose 時に呼ばれる任意のコールバックを追加する。
   * イベントリスナーの手動解除など、Effect 以外のクリーンアップに使用する。
   * @param {() => void} callback
   */
  onDispose(callback) {
    if (this.#isDisposed) { callback(); return; }
    this.#disposeCallbacks.push(callback);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  テンプレートエンジン
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Hamon が生成するマーカー属性のプレフィックス。
 * コンパイル時にテンプレート文字列内へ埋め込み、ハイドレーション時に参照・除去する。
 * 例: `data-h-e0` (イベントバインディング index=0)、`data-h-b1` (属性バインド index=1)
 */
const ATTR_PREFIX = "data-h-";

/**
 * リアクティブな DocumentFragment を返すタグ付きテンプレートリテラル。
 *
 * テンプレート内で使用できる構文:
 * - テキスト補間: `${() => expr}` / `${signal}` / `${staticValue}`
 * - イベント:     `@click=${handler}`
 * - 属性バインド: `:value=${signal}` / `:disabled=${() => bool}`
 * - 条件分岐:     `kit-if=${() => bool}` + `kit-else`
 * - リスト描画:   `${list(() => array, (item, i) => hamon`...`)}`
 *
 * @example
 * const count = signal(0);
 * const frag = hamon`
 *   <button @click=${() => count.value++}>
 *     Count: ${() => count.value}
 *   </button>
 *   <p kit-if=${() => count.value > 5}>High!</p>
 *   <p kit-else>Low</p>
 * `;
 *
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {DocumentFragment & { _scope: HamonScope }}
 */
export function hamon(strings, ...values) {
  const scope = new HamonScope();
  const { markup, slots } = _compileTemplate(strings, values);
  const fragment = _parseHTML(markup);
  _hydrate(fragment, values, slots, scope);
  fragment._scope = scope;
  return fragment;
}

// ─── list ヘルパー ───────────────────────────────────────────────────────────

/**
 * リスト描画ヘルパー。hamon テンプレートのテキスト補間内で使用する。
 *
 * `itemsFn` が返す配列が変化するたびに DOM を差分更新する。
 * 各アイテムの renderFn が返す Fragment の `_scope` は、
 * アイテム除去時に自動 dispose される。
 *
 * @example
 * const items = signal(["A", "B", "C"]);
 * hamon`<ul>${list(() => items.value, (item, i) => hamon`<li>${item}</li>`)}</ul>`;
 *
 * @param {() => any[]} itemsFn   配列を返す関数 (Signal 依存可能)
 * @param {(item: any, index: number) => DocumentFragment|Node|string} renderFn
 * @returns {object} Hamon テンプレートエンジンが認識する内部オブジェクト
 */
export function list(itemsFn, renderFn) {
  return { [LIST_MARKER]: "list", itemsFn, renderFn };
}

// ─── コンパイル: テンプレート文字列 → マーカー付き HTML ──────────────────────

/**
 * @typedef {object} Slot
 * Slot — テンプレート内の動的バインディングを表すメタデータ。
 *
 * @property {"text"|"event"|"bind"|"directive"} type
 *   "text"      — テキスト補間 (コメントマーカーでプレースホルダー化)
 *   "event"     — @event バインディング
 *   "bind"      — :attr バインディング
 *   "directive" — kit-if / kit-for ディレクティブ
 * @property {number} valueIndex - values 配列内のインデックス
 * @property {string} [name]     - イベント名・属性名・ディレクティブ名
 */

/**
 * tagged template literal の strings と values を受け取り、
 * ハイドレーション用のマーカーを埋め込んだ HTML 文字列と
 * バインディングメタデータ (Slot[]) を生成する。
 *
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 * @returns {{ markup: string, slots: Slot[] }}
 */
function _compileTemplate(strings, values) {
  let markup = "";
  /** @type {Slot[]} */
  const slots = [];

  for (let i = 0; i < strings.length; i++) {
    const staticPart = strings[i];

    if (i >= values.length) {
      // 最後の静的部分 (対応する補間値なし)
      markup += staticPart;
      continue;
    }

    const attrContext = _detectAttrContext(markup + staticPart);

    if (attrContext.attrName) {
      const attrName = attrContext.attrName;

      if (attrName.startsWith("@")) {
        // ─ @event バインディング ─
        // 属性名を data-h-eN に置換してイベントハンドラをマーク
        slots.push({ type: "event", valueIndex: i, name: attrName.slice(1) });
        markup += staticPart.replace(
          new RegExp(_escapeRegex(attrName) + "\\s*=$"),
          `${ATTR_PREFIX}e${i}=`,
        );
        markup += `"${i}"`;

      } else if (attrName.startsWith(":")) {
        // ─ :attr バインディング ─
        slots.push({ type: "bind", valueIndex: i, name: attrName.slice(1) });
        markup += staticPart.replace(
          new RegExp(_escapeRegex(attrName) + "\\s*=$"),
          `${ATTR_PREFIX}b${i}=`,
        );
        markup += `"${i}"`;

      } else if (attrName === "kit-if" || attrName === "kit-for") {
        // ─ kit-* ディレクティブ ─
        slots.push({ type: "directive", valueIndex: i, name: attrName });
        markup += staticPart.replace(
          new RegExp(_escapeRegex(attrName) + "\\s*=$"),
          `${ATTR_PREFIX}d${i}=`,
        );
        markup += `"${i}"`;

      } else {
        // 通常属性内の補間 → 静的文字列として埋め込む
        markup += staticPart + _resolveStatic(values[i]);
      }

    } else {
      // ─ テキスト補間 → コメントマーカー ─
      slots.push({ type: "text", valueIndex: i });
      markup += staticPart + `<!--h:${i}-->`;
    }
  }

  return { markup, slots };
}

/**
 * HTML 文字列の末尾を解析し、現在が属性値の記述位置かどうかを判定する。
 * 属性値記述中 (`=` の直後) であれば属性名を返す。
 *
 * @param {string} htmlSoFar - これまでに構築した HTML 文字列
 * @returns {{ attrName?: string }}
 */
function _detectAttrContext(htmlSoFar) {
  // 最後の開きタグ位置を探す
  const lastTagStart = htmlSoFar.lastIndexOf("<");
  if (lastTagStart === -1) return {};

  const tagSlice = htmlSoFar.slice(lastTagStart);
  // > があればタグはすでに閉じている → テキストノード内
  if (tagSlice.includes(">")) return {};

  // タグ内で最後に現れた `属性名=` パターンを探す
  const attrMatch = tagSlice.match(/(\S+)\s*=\s*$/);
  return attrMatch ? { attrName: attrMatch[1] } : {};
}

/**
 * 正規表現の特殊文字をエスケープする。
 * @param {string} str
 * @returns {string}
 */
function _escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 静的コンテキスト (属性内など) で値を文字列として解決する。
 * Signal / 関数は評価して現在値を返す。
 * @param {*} value
 * @returns {string}
 */
function _resolveStatic(value) {
  if (typeof value === "function") return value();
  if (isSignal(value)) return value.peek();
  return value ?? "";
}

/**
 * HTML 文字列を DocumentFragment にパースする。
 * `<template>` 要素経由でパースし、content をクローンして返す。
 * @param {string} htmlString
 * @returns {DocumentFragment}
 */
function _parseHTML(htmlString) {
  const templateEl = document.createElement("template");
  templateEl.innerHTML = htmlString;
  return templateEl.content.cloneNode(true);
}

// ─── ハイドレーション ────────────────────────────────────────────────────────

/**
 * パース済み DocumentFragment にリアクティブバインディングを適用する。
 * @param {DocumentFragment} fragment
 * @param {any[]} values
 * @param {Slot[]} slots
 * @param {HamonScope} scope
 */
function _hydrate(fragment, values, slots, scope) {
  _bindTextNodes(fragment, values, slots, scope);
  _bindAttributes(fragment, values, slots, scope);
  _bindDirectives(fragment, values, slots, scope);
}

// ── テキスト補間 ─────────────────────────────────────────────────────────────

/**
 * Fragment 内のコメントマーカー `<!--h:N-->` を走査し、
 * 対応する values[N] に応じてリアクティブ Text ノードや DOM ノードに置換する。
 *
 * @param {Node} rootNode
 * @param {any[]} values
 * @param {Slot[]} slots
 * @param {HamonScope} scope
 */
function _bindTextNodes(rootNode, values, slots, scope) {
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_COMMENT);
  /** @type {{ node: Comment, valueIndex: number }[]} */
  const markerNodes = [];

  while (walker.nextNode()) {
    const commentMatch = walker.currentNode.textContent.match(/^h:(\d+)$/);
    if (commentMatch) {
      markerNodes.push({ node: walker.currentNode, valueIndex: +commentMatch[1] });
    }
  }

  for (const { node: markerNode, valueIndex } of markerNodes) {
    const boundValue = values[valueIndex];

    // ─ list() ヘルパーの場合 ─
    if (boundValue && boundValue[LIST_MARKER] === "list") {
      _mountList(markerNode, boundValue, scope);
      continue;
    }

    // ─ 関数 / Signal → リアクティブ補間 ─
    if (typeof boundValue === "function" || isSignal(boundValue)) {
      // アンカーコメントで挿入位置を記憶する
      const anchorComment = document.createComment("");
      markerNode.parentNode.replaceChild(anchorComment, markerNode);
      /** @type {Node[]} 現在 DOM に挿入されているノード群 */
      let currentNodes = [];

      const getter = typeof boundValue === "function"
        ? boundValue
        : () => boundValue.value;

      scope.effect(() => {
        const result = getter();
        // 旧ノードを除去
        for (const oldNode of currentNodes) oldNode.remove();
        currentNodes = [];
        // 結果の型に応じて新ノードを挿入
        if (result instanceof DocumentFragment) {
          const insertedNodes = [...result.childNodes];
          const parentNode = anchorComment.parentNode;
          for (const childNode of insertedNodes) parentNode.insertBefore(childNode, anchorComment);
          currentNodes = insertedNodes;
        } else if (result instanceof Node) {
          anchorComment.parentNode.insertBefore(result, anchorComment);
          currentNodes = [result];
        } else {
          const textNode = document.createTextNode(result ?? "");
          anchorComment.parentNode.insertBefore(textNode, anchorComment);
          currentNodes = [textNode];
        }
      });
      continue;
    }

    // ─ 静的値 → そのまま Text ノードに変換 ─
    const staticTextNode = document.createTextNode(boundValue ?? "");
    markerNode.parentNode.replaceChild(staticTextNode, markerNode);
  }
}

// ── 属性バインディング ───────────────────────────────────────────────────────

/**
 * Fragment 内の `data-h-eN` (イベント) / `data-h-bN` (バインド) 属性を持つ要素を
 * 走査し、対応するバインディングを適用する。
 * マーカー属性は処理後に除去される。
 *
 * @param {Node} rootNode
 * @param {any[]} values
 * @param {Slot[]} slots
 * @param {HamonScope} scope
 */
function _bindAttributes(rootNode, values, slots, scope) {
  for (const slot of slots) {
    if (slot.type === "event") {
      // ─ @event バインディング ─
      const targetEl = rootNode.querySelector(`[${ATTR_PREFIX}e${slot.valueIndex}]`);
      if (!targetEl) continue;
      targetEl.removeAttribute(`${ATTR_PREFIX}e${slot.valueIndex}`);
      const eventHandler = values[slot.valueIndex];
      if (typeof eventHandler === "function") {
        targetEl.addEventListener(slot.name, eventHandler);
        // scope dispose 時に自動解除
        scope.onDispose(() => targetEl.removeEventListener(slot.name, eventHandler));
      }

    } else if (slot.type === "bind") {
      // ─ :attr バインディング ─
      const targetEl = rootNode.querySelector(`[${ATTR_PREFIX}b${slot.valueIndex}]`);
      if (!targetEl) continue;
      targetEl.removeAttribute(`${ATTR_PREFIX}b${slot.valueIndex}`);

      const boundValue = values[slot.valueIndex];
      const attrName = slot.name;
      // value / checked / selected / disabled は DOM プロパティとして設定する
      const isDomProperty = attrName === "value" || attrName === "checked"
                         || attrName === "selected" || attrName === "disabled";

      if (typeof boundValue === "function") {
        scope.effect(() => _applyAttr(targetEl, attrName, boundValue(), isDomProperty));
      } else if (isSignal(boundValue)) {
        scope.effect(() => _applyAttr(targetEl, attrName, boundValue.value, isDomProperty));
      } else {
        _applyAttr(targetEl, attrName, boundValue, isDomProperty);
      }
    }
  }
}

/**
 * 要素に属性値を適用する。
 * DOM プロパティの場合は直接代入、そうでなければ setAttribute/removeAttribute を使う。
 *
 * @param {Element} el
 * @param {string} attrName
 * @param {*} value
 * @param {boolean} isDomProperty - true なら `el[attrName] = value` で設定
 */
function _applyAttr(el, attrName, value, isDomProperty) {
  if (isDomProperty) {
    el[attrName] = value;
  } else if (value === false || value == null) {
    el.removeAttribute(attrName);
  } else if (value === true) {
    el.setAttribute(attrName, ""); // boolean 属性は空文字で表現
  } else {
    el.setAttribute(attrName, value);
  }
}

// ── ディレクティブ ───────────────────────────────────────────────────────────

/**
 * Fragment 内の `data-h-dN` マーカーを持つ要素を走査し、
 * kit-if / kit-for ディレクティブを適用する。
 *
 * @param {Node} rootNode
 * @param {any[]} values
 * @param {Slot[]} slots
 * @param {HamonScope} scope
 */
function _bindDirectives(rootNode, values, slots, scope) {
  for (const slot of slots) {
    if (slot.type !== "directive") continue;
    if (slot.name === "kit-if") {
      _applyKitIf(rootNode, slot.valueIndex, values[slot.valueIndex], scope);
    }
    // kit-for はテキスト補間内の list() ヘルパーで対応
  }
}

/**
 * `kit-if` / `kit-else` ディレクティブを適用する。
 *
 * 条件が truthy のとき対象要素を DOM に挿入し、falsy のとき除去する。
 * `kit-else` 属性を持つ直後の兄弟要素は逆条件で連動する。
 * DOM ノードの実体は保持されるため、条件切替のたびに再生成されない。
 *
 * @param {Node} rootNode
 * @param {number} valueIndex - values 配列内のインデックス
 * @param {Function|object|*} conditionValue - 条件を返す関数 / Signal / 静的値
 * @param {HamonScope} scope
 */
function _applyKitIf(rootNode, valueIndex, conditionValue, scope) {
  const targetEl = rootNode.querySelector(`[${ATTR_PREFIX}d${valueIndex}]`);
  if (!targetEl) return;
  targetEl.removeAttribute(`${ATTR_PREFIX}d${valueIndex}`);

  // 挿入位置を記憶するアンカーコメントを target の直前に配置
  const anchorComment = document.createComment("kit-if");
  targetEl.parentNode.insertBefore(anchorComment, targetEl);

  // kit-else 属性を持つ直後の兄弟要素を検出
  let elseEl = null;
  const nextSiblingEl = targetEl.nextElementSibling;
  if (nextSiblingEl?.hasAttribute("kit-else")) {
    elseEl = nextSiblingEl;
    elseEl.removeAttribute("kit-else");
  }

  // 初期状態: 両要素を一旦 DOM から除去 (effect で再挿入される)
  targetEl.remove();
  elseEl?.remove();

  // 条件値を getter 関数に正規化
  const getCondition = typeof conditionValue === "function"
    ? conditionValue
    : isSignal(conditionValue) ? () => conditionValue.value
    : () => conditionValue;

  scope.effect(() => {
    const shouldShow = !!getCondition();
    const parentNode = anchorComment.parentNode;

    if (shouldShow) {
      // kit-if を表示、kit-else を非表示
      if (!targetEl.isConnected) parentNode.insertBefore(targetEl, anchorComment.nextSibling);
      if (elseEl?.isConnected) elseEl.remove();
    } else {
      // kit-if を非表示、kit-else を表示
      if (targetEl.isConnected) targetEl.remove();
      if (elseEl && !elseEl.isConnected) parentNode.insertBefore(elseEl, anchorComment.nextSibling);
    }
  });
}

/**
 * `list()` ヘルパーオブジェクトを受け取り、コメントマーカー位置に
 * リストアイテムを動的にマウントする。
 *
 * `itemsFn` の返す配列が変化するたびに旧ノードを除去して再生成する
 * (全件再描画方式。key ベース差分更新は将来対応予定)。
 * 各アイテムの Fragment が持つ `_scope` はアイテム除去時に自動 dispose される。
 *
 * @param {Comment} markerComment - テンプレートコンパイル時に挿入されたコメントノード
 * @param {{ itemsFn: Function, renderFn: Function }} listDef
 * @param {HamonScope} scope
 */
function _mountList(markerComment, listDef, scope) {
  // レンダリング位置を維持するアンカーコメントに差し替え
  const anchorComment = document.createComment("kit-list");
  markerComment.parentNode.replaceChild(anchorComment, markerComment);

  const { itemsFn, renderFn } = listDef;
  /** @type {{ nodes: Node[], itemScope: HamonScope|null }[]} */
  let currentEntries = [];

  scope.effect(() => {
    const items = itemsFn() ?? [];
    const parentNode = anchorComment.parentNode;

    // 旧ノードをすべて除去し、各アイテムのスコープを解除する
    for (const entry of currentEntries) {
      for (const node of entry.nodes) node.remove();
      entry.itemScope?.dispose();
    }
    currentEntries = [];

    // 各アイテムのノードを生成してアンカー前に挿入
    const insertionRef = anchorComment.nextSibling;
    for (let index = 0; index < items.length; index++) {
      const renderedResult = renderFn(items[index], index);

      if (renderedResult instanceof DocumentFragment) {
        const itemScope = renderedResult._scope ?? null;
        const childNodes = [...renderedResult.childNodes];
        for (const childNode of childNodes) parentNode.insertBefore(childNode, insertionRef);
        currentEntries.push({ nodes: childNodes, itemScope });
      } else if (renderedResult instanceof Node) {
        parentNode.insertBefore(renderedResult, insertionRef);
        currentEntries.push({ nodes: [renderedResult], itemScope: null });
      } else {
        const textNode = document.createTextNode(renderedResult ?? "");
        parentNode.insertBefore(textNode, insertionRef);
        currentEntries.push({ nodes: [textNode], itemScope: null });
      }
    }
  });
}

// ─── グローバル登録 ──────────────────────────────────────────────────────────

// ESKitApp.hamon getter がモジュール import なしで HamonScope を生成できるよう登録する。
// これにより、app.js 側で hamon.js を静的 import しなくても `this.hamon` が使える。
globalThis.__HamonScope = HamonScope;

export default hamon;
