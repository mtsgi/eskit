import ESKitApp from "system/app.js";
import hamon, { signal } from "system/hamon.js";
import style from "./style.js";

/**
 * CalculatorApp — ESKit 四則演算電卓
 */
export default class CalculatorApp extends ESKitApp {
  static style = style;

  #display = signal("0");
  #formula = signal("");
  #firstOperand = null;
  #operator = null;
  #waitingForSecondOperand = false;

  /**
   * 計算機の表示とボタン操作のテンプレートを作成する。
   */
  constructor() {
    super();

    this.template = hamon`
      <div class="calc-container" @keydown=${(e) => this.#handleKeyDown(e)} tabindex="0">
        <!-- ディスプレイ -->
        <div class="calc-display">
          <div class="calc-formula">${() => this.#formula.value}</div>
          <div class="calc-main-value">${() => this.#display.value}</div>
        </div>

        <!-- キーパッド -->
        <div class="calc-keypad">
          <button class="calc-btn -action" @click=${() => this.#allClear()} :title=${() => this.t("calculator.allClear")}>AC</button>
          <button class="calc-btn -action" @click=${() => this.#toggleSign()}>+/-</button>
          <button class="calc-btn -action" @click=${() => this.#percentage()}>%</button>
          <button class="calc-btn -op" @click=${() => this.#setOperator("÷")}>÷</button>

          <button class="calc-btn" @click=${() => this.#inputDigit("7")}>7</button>
          <button class="calc-btn" @click=${() => this.#inputDigit("8")}>8</button>
          <button class="calc-btn" @click=${() => this.#inputDigit("9")}>9</button>
          <button class="calc-btn -op" @click=${() => this.#setOperator("×")}>×</button>

          <button class="calc-btn" @click=${() => this.#inputDigit("4")}>4</button>
          <button class="calc-btn" @click=${() => this.#inputDigit("5")}>5</button>
          <button class="calc-btn" @click=${() => this.#inputDigit("6")}>6</button>
          <button class="calc-btn -op" @click=${() => this.#setOperator("-")}>-</button>

          <button class="calc-btn" @click=${() => this.#inputDigit("1")}>1</button>
          <button class="calc-btn" @click=${() => this.#inputDigit("2")}>2</button>
          <button class="calc-btn" @click=${() => this.#inputDigit("3")}>3</button>
          <button class="calc-btn -op" @click=${() => this.#setOperator("+")}>+</button>

          <button class="calc-btn -zero" @click=${() => this.#inputDigit("0")}>0</button>
          <button class="calc-btn" @click=${() => this.#inputDecimal()}>.</button>
          <button class="calc-btn -equals" @click=${() => this.#equals()}>=</button>
        </div>
      </div>
    `;
  }

  /**
   * 初期フォーカスを設定し、ウィンドウがアクティブな間のキー入力を登録する。
   */
  initialize() {
    // キーボードフォーカス付与
    setTimeout(() => {
      const container = this.querySelector(".calc-container");
      container?.focus();
    }, 50);

    // グローバルキーリスナー (ウィンドウフォーカス時)
    this._keyHandler = (e) => {
      if (this._windowElement?.classList?.contains("focused")) {
        this.#handleKeyDown(e);
      }
    };
    window.addEventListener("keydown", this._keyHandler);
  }

  /**
   * グローバルに登録したキー入力の監視を解除する。
   */
  close() {
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler);
    }
  }

  /**
   * 数値表示に数字を追加する。次の項の入力待ちなら表示を置き換える。
   * @param {string} digit 入力する数字。
   */
  #inputDigit(digit) {
    if (this.#waitingForSecondOperand) {
      this.#display.value = digit;
      this.#waitingForSecondOperand = false;
    } else {
      this.#display.value = this.#display.value === "0" ? digit : this.#display.value + digit;
    }
  }

  /**
   * 小数点を一度だけ追加する。次の項の入力待ちなら 0. から始める。
   */
  #inputDecimal() {
    if (this.#waitingForSecondOperand) {
      this.#display.value = "0.";
      this.#waitingForSecondOperand = false;
      return;
    }
    if (!this.#display.value.includes(".")) {
      this.#display.value += ".";
    }
  }

  /**
   * 表示中の数値の符号を反転する。
   */
  #toggleSign() {
    const num = parseFloat(this.#display.value);
    if (isNaN(num)) return;
    this.#display.value = String(num * -1);
  }

  /**
   * 表示中の数値を百分率として 100 で割る。
   */
  #percentage() {
    const num = parseFloat(this.#display.value);
    if (isNaN(num)) return;
    this.#display.value = String(num / 100);
  }

  /**
   * 演算子を記録し、必要なら直前の演算を確定する。
   * @param {string} nextOperator 次に使用する演算子。
   */
  #setOperator(nextOperator) {
    const inputValue = parseFloat(this.#display.value);

    if (this.#operator && this.#waitingForSecondOperand) {
      this.#operator = nextOperator;
      this.#formula.value = `${this.#firstOperand} ${nextOperator}`;
      return;
    }

    if (this.#firstOperand === null && !isNaN(inputValue)) {
      this.#firstOperand = inputValue;
    } else if (this.#operator) {
      const result = this.#calculate(this.#firstOperand, inputValue, this.#operator);
      this.#display.value = `${parseFloat(result.toFixed(8))}`;
      this.#firstOperand = result;
    }

    this.#waitingForSecondOperand = true;
    this.#operator = nextOperator;
    this.#formula.value = `${this.#firstOperand} ${nextOperator}`;
  }

  /**
   * 入力中の演算を確定し、結果と計算式を表示する。
   */
  #equals() {
    const inputValue = parseFloat(this.#display.value);

    if (this.#operator && this.#firstOperand !== null) {
      const result = this.#calculate(this.#firstOperand, inputValue, this.#operator);
      const rounded = parseFloat(result.toFixed(8));
      this.#formula.value = `${this.#firstOperand} ${this.#operator} ${inputValue} =`;
      this.#display.value = `${rounded}`;
      this.#firstOperand = null;
      this.#operator = null;
      this.#waitingForSecondOperand = true;
    }
  }

  /**
   * 指定した二つの数値に四則演算を適用する。
   * @param {number} first 左辺の数値。
   * @param {number} second 右辺の数値。
   * @param {string} op 演算子。
   * @returns {number} 計算結果。ゼロ除算は 0、不明な演算子は右辺の値。
   */
  #calculate(first, second, op) {
    switch (op) {
      case "+": return first + second;
      case "-": return first - second;
      case "×":
      case "*": return first * second;
      case "÷":
      case "/": return second !== 0 ? first / second : 0;
      default: return second;
    }
  }

  /**
   * 表示と演算状態を初期値に戻す。
   */
  #allClear() {
    this.#display.value = "0";
    this.#formula.value = "";
    this.#firstOperand = null;
    this.#operator = null;
    this.#waitingForSecondOperand = false;
  }

  /**
   * 入力欄以外のキー入力を、計算機の数字・演算操作として処理する。
   * @param {KeyboardEvent} e キー入力のイベント。
   */
  #handleKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      this.#inputDigit(e.key);
    } else if (e.key === ".") {
      e.preventDefault();
      this.#inputDecimal();
    } else if (e.key === "+" || e.key === "-") {
      e.preventDefault();
      this.#setOperator(e.key);
    } else if (e.key === "*") {
      e.preventDefault();
      this.#setOperator("×");
    } else if (e.key === "/") {
      e.preventDefault();
      this.#setOperator("÷");
    } else if (e.key === "Enter" || e.key === "=") {
      e.preventDefault();
      this.#equals();
    } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
      e.preventDefault();
      this.#allClear();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      if (this.#display.value.length > 1 && this.#display.value !== "0") {
        this.#display.value = this.#display.value.slice(0, -1);
      } else {
        this.#display.value = "0";
      }
    }
  }
}
