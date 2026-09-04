import ESKitApp from "system/app.js";
import hamon, { signal, computed, list } from "system/hamon.js";
import style from "./style.js";

/**
 * ClockApp — ESKit 時計 / ストップウォッチ / タイマー
 */
export default class ClockApp extends ESKitApp {
  static style = style;

  // ─── シグナル定義 ──────────────────────────────────────────────────────────
  #activeTab = signal("clock"); // "clock" | "stopwatch" | "timer"

  // 時計
  #now = signal(new Date());

  // ストップウォッチ
  #swRunning = signal(false);
  #swElapsed = signal(0); // ミリ秒
  #swLaps = signal([]); // string[]

  // タイマー
  #timerRunning = signal(false);
  #timerHours = signal(0);
  #timerMinutes = signal(3);
  #timerSeconds = signal(0);
  #timerRemaining = signal(180); // 秒

  #clockInterval = null;
  #swInterval = null;
  #swStartTime = 0;
  #swBaseTime = 0;
  #timerInterval = null;

  constructor() {
    super();

    // ─── 時計の派生シグナル ──────────────────────────────────────────────────
    const timeString = computed(() => {
      const d = this.#now.value;
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      return `${h}:${m}:${s}`;
    });

    const dateString = computed(() => {
      const d = this.#now.value;
      if (window.System?.i18n) {
        return window.System.i18n.formatDate(d);
      }
      return d.toLocaleDateString();
    });

    const hourDeg = computed(() => {
      const d = this.#now.value;
      const h = d.getHours() % 12;
      const m = d.getMinutes();
      return (h * 30) + (m * 0.5);
    });

    const minDeg = computed(() => {
      const d = this.#now.value;
      const m = d.getMinutes();
      const s = d.getSeconds();
      return (m * 6) + (s * 0.1);
    });

    const secDeg = computed(() => {
      const d = this.#now.value;
      return d.getSeconds() * 6;
    });

    // ─── ストップウォッチの派生シグナル ────────────────────────────────────────
    const swDisplay = computed(() => {
      const ms = this.#swElapsed.value;
      const totalSec = Math.floor(ms / 1000);
      const minutes = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const seconds = String(totalSec % 60).padStart(2, "0");
      const centis = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
      return `${minutes}:${seconds}.${centis}`;
    });

    // ─── タイマーの派生シグナル ──────────────────────────────────────────────
    const timerDisplay = computed(() => {
      const s = this.#timerRemaining.value;
      const hours = String(Math.floor(s / 3600)).padStart(2, "0");
      const mins = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const secs = String(s % 60).padStart(2, "0");
      return hours !== "00" ? `${hours}:${mins}:${secs}` : `${mins}:${secs}`;
    });

    // ─── テンプレート定義 ─────────────────────────────────────────────────
    this.template = hamon`
      <div class="clock-app">
        <!-- ナビゲーションタブ -->
        <div class="nav-tabs">
          <button
            :class=${() => `nav-tab ${this.#activeTab.value === "clock" ? "-active" : ""}`}
            @click=${() => this.#activeTab.value = "clock"}
          >
            <eskit-icon set="lucide" name="clock" size="14"></eskit-icon>
            <span>${() => this.t("clock.tabClock")}</span>
          </button>
          <button
            :class=${() => `nav-tab ${this.#activeTab.value === "stopwatch" ? "-active" : ""}`}
            @click=${() => this.#activeTab.value = "stopwatch"}
          >
            <eskit-icon set="lucide" name="timer" size="14"></eskit-icon>
            <span>${() => this.t("clock.tabStopwatch")}</span>
          </button>
          <button
            :class=${() => `nav-tab ${this.#activeTab.value === "timer" ? "-active" : ""}`}
            @click=${() => this.#activeTab.value = "timer"}
          >
            <eskit-icon set="lucide" name="hourglass" size="14"></eskit-icon>
            <span>${() => this.t("clock.tabTimer")}</span>
          </button>
        </div>

        <!-- 1. 時計タブ -->
        <div class="tab-content" kit-if=${() => this.#activeTab.value === "clock"}>
          <svg class="analog-clock-svg" viewBox="0 0 100 100">
            <!-- 文字盤 -->
            <circle cx="50" cy="50" r="46" fill="var(--kit-bg-secondary)" stroke="var(--kit-border)" stroke-width="2"/>
            
            <!-- 目盛り -->
            ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg) => hamon`
                <line
                  x1="50" y1="8" x2="50" y2="12"
                  stroke="var(--kit-fg-muted)"
                  stroke-width=${deg % 90 === 0 ? "2" : "1"}
                  transform=${`rotate(${deg} 50 50)`}
                />
              `
            )}

            <!-- 時針 -->
            <line
              x1="50" y1="50" x2="50" y2="24"
              stroke="var(--kit-fg)"
              stroke-width="3"
              stroke-linecap="round"
              :transform=${() => `rotate(${hourDeg.value} 50 50)`}
            />

            <!-- 分針 -->
            <line
              x1="50" y1="50" x2="50" y2="14"
              stroke="var(--kit-color-primary)"
              stroke-width="2"
              stroke-linecap="round"
              :transform=${() => `rotate(${minDeg.value} 50 50)`}
            />

            <!-- 秒針 -->
            <line
              x1="50" y1="55" x2="50" y2="12"
              stroke="#ef4444"
              stroke-width="1"
              stroke-linecap="round"
              :transform=${() => `rotate(${secDeg.value} 50 50)`}
            />

            <!-- 中心のピン -->
            <circle cx="50" cy="50" r="2.5" fill="#ef4444"/>
          </svg>

          <div class="digital-time">${() => timeString.value}</div>
          <div class="digital-date">${() => dateString.value}</div>
        </div>

        <!-- 2. ストップウォッチタブ -->
        <div class="tab-content" kit-if=${() => this.#activeTab.value === "stopwatch"}>
          <div class="stopwatch-time">${() => swDisplay.value}</div>

          <div class="stopwatch-controls">
            <button
              :class=${() => `kit-button -small ${this.#swRunning.value ? "-warning" : "-primary"}`}
              @click=${() => this.#toggleStopwatch()}
            >
              <eskit-icon set="lucide" :name=${() => this.#swRunning.value ? "pause" : "play"} size="14"></eskit-icon>
              <span>${() => this.#swRunning.value ? this.t("clock.pause") : this.t("clock.start")}</span>
            </button>

            <button
              class="kit-button -small"
              :disabled=${() => !this.#swRunning.value}
              @click=${() => this.#lapStopwatch()}
            >
              <eskit-icon set="lucide" name="flag" size="14"></eskit-icon>
              <span>${() => this.t("clock.lap")}</span>
            </button>

            <button
              class="kit-button -small -alt"
              :disabled=${() => this.#swRunning.value || this.#swElapsed.value === 0}
              @click=${() => this.#resetStopwatch()}
            >
              <eskit-icon set="lucide" name="rotate-ccw" size="14"></eskit-icon>
              <span>${() => this.t("clock.reset")}</span>
            </button>
          </div>

          <div class="laps-container" kit-if=${() => this.#swLaps.value.length > 0}>
            <table class="laps-table">
              <tbody>
                ${list(
                  () => this.#swLaps.value,
                  (lap, i) => hamon`
                    <tr>
                      <td style="color: var(--kit-fg-muted);">${() => this.t("clock.lapNum", { num: this.#swLaps.value.length - i })}</td>
                      <td style="text-align: right; font-weight: bold;">${lap}</td>
                    </tr>
                  `
                )}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. タイマータブ -->
        <div class="tab-content" kit-if=${() => this.#activeTab.value === "timer"}>
          <!-- 設定ピッカー (停止時のみ表示) -->
          <div class="timer-picker" kit-if=${() => !this.#timerRunning.value && this.#timerRemaining.value === this.#calcTotalTimerSeconds()}>
            <div class="timer-input-group">
              <input
                class="timer-input"
                type="number"
                min="0"
                max="23"
                :value=${() => this.#timerHours.value}
                @input=${(e) => {
                  this.#timerHours.value = Math.max(0, parseInt(e.target.value, 10) || 0);
                  this.#timerRemaining.value = this.#calcTotalTimerSeconds();
                }}
              >
              <span class="timer-input-label">${() => this.t("clock.hours")}</span>
            </div>
            <span class="timer-colon">:</span>
            <div class="timer-input-group">
              <input
                class="timer-input"
                type="number"
                min="0"
                max="59"
                :value=${() => this.#timerMinutes.value}
                @input=${(e) => {
                  this.#timerMinutes.value = Math.max(0, parseInt(e.target.value, 10) || 0);
                  this.#timerRemaining.value = this.#calcTotalTimerSeconds();
                }}
              >
              <span class="timer-input-label">${() => this.t("clock.minutes")}</span>
            </div>
            <span class="timer-colon">:</span>
            <div class="timer-input-group">
              <input
                class="timer-input"
                type="number"
                min="0"
                max="59"
                :value=${() => this.#timerSeconds.value}
                @input=${(e) => {
                  this.#timerSeconds.value = Math.max(0, parseInt(e.target.value, 10) || 0);
                  this.#timerRemaining.value = this.#calcTotalTimerSeconds();
                }}
              >
              <span class="timer-input-label">${() => this.t("clock.seconds")}</span>
            </div>
          </div>

          <!-- カウントダウン表示 -->
          <div class="timer-display">${() => timerDisplay.value}</div>

          <div class="timer-controls">
            <button
              :class=${() => `kit-button -small ${this.#timerRunning.value ? "-warning" : "-primary"}`}
              @click=${() => this.#toggleTimer()}
            >
              <eskit-icon set="lucide" :name=${() => this.#timerRunning.value ? "pause" : "play"} size="14"></eskit-icon>
              <span>${() => this.#timerRunning.value ? this.t("clock.pause") : this.t("clock.start")}</span>
            </button>

            <button
              class="kit-button -small -alt"
              @click=${() => this.#resetTimer()}
            >
              <eskit-icon set="lucide" name="rotate-ccw" size="14"></eskit-icon>
              <span>${() => this.t("clock.reset")}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  initialize() {
    // 時計更新インターバル (毎秒)
    this.#clockInterval = setInterval(() => {
      this.#now.value = new Date();
    }, 1000);
  }

  close() {
    if (this.#clockInterval) clearInterval(this.#clockInterval);
    if (this.#swInterval) clearInterval(this.#swInterval);
    if (this.#timerInterval) clearInterval(this.#timerInterval);
  }

  // ─── ストップウォッチ操作 ──────────────────────────────────────────────────

  #toggleStopwatch() {
    if (this.#swRunning.value) {
      // 一時停止
      this.#swRunning.value = false;
      if (this.#swInterval) clearInterval(this.#swInterval);
      this.#swBaseTime = this.#swElapsed.value;
    } else {
      // 開始
      this.#swRunning.value = true;
      this.#swStartTime = Date.now();
      this.#swInterval = setInterval(() => {
        this.#swElapsed.value = this.#swBaseTime + (Date.now() - this.#swStartTime);
      }, 30);
    }
  }

  #lapStopwatch() {
    if (!this.#swRunning.value) return;
    const current = this.querySelector(".stopwatch-time")?.textContent || "";
    this.#swLaps.value = [current, ...this.#swLaps.value];
  }

  #resetStopwatch() {
    this.#swRunning.value = false;
    if (this.#swInterval) clearInterval(this.#swInterval);
    this.#swElapsed.value = 0;
    this.#swBaseTime = 0;
    this.#swLaps.value = [];
  }

  // ─── タイマー操作 ──────────────────────────────────────────────────────────

  #calcTotalTimerSeconds() {
    return (this.#timerHours.value * 3600) + (this.#timerMinutes.value * 60) + this.#timerSeconds.value;
  }

  #toggleTimer() {
    if (this.#timerRunning.value) {
      // 一時停止
      this.#timerRunning.value = false;
      if (this.#timerInterval) clearInterval(this.#timerInterval);
    } else {
      if (this.#timerRemaining.value <= 0) {
        this.#timerRemaining.value = this.#calcTotalTimerSeconds();
      }
      if (this.#timerRemaining.value <= 0) return;

      this.#timerRunning.value = true;
      this.#timerInterval = setInterval(() => {
        if (this.#timerRemaining.value > 1) {
          this.#timerRemaining.value -= 1;
        } else {
          this.#timerRemaining.value = 0;
          this.#timerRunning.value = false;
          clearInterval(this.#timerInterval);
          this.#onTimerFinished();
        }
      }, 1000);
    }
  }

  #resetTimer() {
    this.#timerRunning.value = false;
    if (this.#timerInterval) clearInterval(this.#timerInterval);
    this.#timerRemaining.value = this.#calcTotalTimerSeconds();
  }

  async #onTimerFinished() {
    // 1. Web Audio API でアラーム音を再生
    this.#playBeep();

    // 2. システム通知を発行
    await this.showNotification({
      title: window.System?.i18n?.getAppName(this._manifest) || "Clock",
      message: this.t("clock.timerFinished"),
      type: "warning",
      icon: "bell",
      duration: 10000,
    });
  }

  #playBeep() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // ピピピッ ピピピッ 2回
      playTone(880, 0, 0.15);
      playTone(880, 0.2, 0.15);
      playTone(880, 0.4, 0.25);
      playTone(880, 0.8, 0.15);
      playTone(880, 1.0, 0.15);
      playTone(880, 1.2, 0.25);
    } catch (e) {
      console.warn("[ClockApp] Could not play audio beep:", e);
    }
  }
}
