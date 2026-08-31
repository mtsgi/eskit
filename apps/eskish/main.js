import ESKitApp from "system/app.js";
import hamon, { signal, list } from "system/hamon.js";
import style from "./style.js";

const System = globalThis.System;

/**
 * ESKish — ESKit 標準ターミナル環境
 */
export default class ESKishApp extends ESKitApp {
  /** @type {CSSStyleSheet} アプリ共通スタイル */
  static style = style;

  /** @type {string} 現在の作業ディレクトリ (CWD) */
  #cwd = "/home";

  /** @type {string[]} コマンド入力履歴 */
  #history = [];

  /** @type {number} 履歴参照インデックス (-1 は最新の未確定入力) */
  #historyIndex = -1;

  /** @type {import("system/hamon.js").Signal<Array<{type: string, text: string, prompt?: string}>>} 出力ログ行リスト */
  #lines = signal([]);

  /** @type {import("system/hamon.js").Signal<string>} プロンプト文字列 */
  #promptText = signal("");

  /** @type {import("system/hamon.js").Signal<string>} 入力中のコマンド文字列 */
  #inputValue = signal("");

  /**
   * ESKishApp インスタンスを生成し、初期 CWD と Hamon テンプレートを設定する。
   */
  constructor() {
    super();
    this.name = "ESKish";

    const user = System?.currentUser?.id;
    this.#cwd = user ? `/home/${user}` : "/home";
    this.#promptText.value = this.#getPrompt();

    this.template = hamon`
      <div class="terminal" @click=${() => this.#focusInput()}>
        <div class="output" id="output">
          <div class="line info"><span class="text">${() => this.t("terminal.banner")}</span></div>
          ${list(
            () => this.#lines.value,
            (item) => hamon`<div class="line ${() => item.type}">${() => item.prompt ? hamon`<span class="prompt">${item.prompt}</span>` : ""}<span class="text">${() => item.text}</span></div>`,
          )}
        </div>
        <div class="input-row">
          <span class="input-prompt">${() => this.#promptText.value}</span>
          <input
            id="cmd-input"
            class="input-field"
            type="text"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            :value=${() => this.#inputValue.value}
            @input=${(e) => { this.#inputValue.value = e.target.value; }}
            @keydown=${(e) => this.#onKeyDown(e)}
          >
        </div>
      </div>
    `;
  }

  /**
   * アプリウィンドウ表示後の初期化処理。タイトルを設定し入力欄にフォーカスを当てる。
   */
  initialize() {
    this.setTitle(this.t("apps.eskish.name"));
    this.hamon.effect(() => {
      this.setTitle(this.t("apps.eskish.name"));
    });
    this.#focusInput();
  }

  /**
   * 他アプリから IPC メッセージを受信した際のハンドラ。ターミナルログにリアルタイム表示する。
   * @param {*} data 受信データ
   */
  onMessage(data) {
    const text = typeof data === "object" && data !== null ? JSON.stringify(data, null, 2) : String(data);
    this.#appendLine("info", `[IPC Received] ${text}`);
    this.#scrollToBottom();
  }

  /**
   * コマンド入力フィールドにフォーカスを移動する。
   */
  #focusInput() {
    const input = this.querySelector("#cmd-input");
    input?.focus();
  }

  /**
   * 現在のユーザーと CWD に基づくプロンプト文字列（例: "alice@eskit:~$ "）を生成する。
   * @returns {string}
   */
  #getPrompt() {
    const user = System?.currentUser?.id ?? "unknown";
    const home = System?.homeDir ? System.homeDir(user) : `/home/${user}`;
    let displayPath = this.#cwd;
    if (home && (displayPath === home || displayPath.startsWith(home + "/"))) {
      displayPath = "~" + displayPath.slice(home.length);
    }
    return `${user}@eskit:${displayPath}$`;
  }

  /**
   * UUID またはプレフィックスから該当するプロセスの完全な UUID を解決する。
   * @param {string} prefix UUID または先頭文字列
   * @returns {Promise<string>} 解決された完全な UUID
   */
  async #resolveProcessUuid(prefix) {
    if (!prefix) throw new Error("Process UUID is required");
    const procs = await this.listProcesses();
    const query = prefix.toLowerCase();
    const matches = procs.filter((p) => p.uuid.toLowerCase().startsWith(query));

    if (matches.length === 0) {
      throw new Error(`Process not found matching "${prefix}"`);
    }
    if (matches.length > 1) {
      const list = matches.map((m) => `${m.uuid.slice(0, 8)} (${m.name})`).join(", ");
      throw new Error(`Ambiguous UUID prefix "${prefix}", matches multiple: ${list}`);
    }
    return matches[0].uuid;
  }

  /**
   * 相対パスやチルダ (~) を現在の CWD / ホームディレクトリに基づく絶対パスに解決する。
   * @param {string} [inputPath] 入力パス
   * @returns {string} 解決された正規化絶対パス
   */
  #resolvePath(inputPath) {
    if (!inputPath) return this.#cwd;
    let path = String(inputPath).trim();
    const user = System?.currentUser?.id;
    const home = System?.homeDir ? System.homeDir(user) : `/home/${user}`;

    if (path === "~") return home;
    if (path.startsWith("~/")) return `${home}${path.slice(1)}`;
    if (path.startsWith("/")) return path;

    const base = this.#cwd.endsWith("/") ? this.#cwd : this.#cwd + "/";
    const full = base + path;
    const parts = full.split("/").filter((p) => p && p !== ".");
    const resolved = [];
    for (const part of parts) {
      if (part === "..") resolved.pop();
      else resolved.push(part);
    }
    return "/" + resolved.join("/");
  }

  /**
   * キー押下イベントハンドラ。Enter でコマンド実行、上下矢印キーで履歴を移動する。
   * @param {KeyboardEvent} e
   */
  async #onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const raw = this.#inputValue.value;
      this.#inputValue.value = "";
      await this.#execute(raw);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (this.#history.length === 0) return;
      if (this.#historyIndex === -1) {
        this.#historyIndex = this.#history.length - 1;
      } else if (this.#historyIndex > 0) {
        this.#historyIndex--;
      }
      this.#inputValue.value = this.#history[this.#historyIndex] ?? "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (this.#historyIndex === -1) return;
      if (this.#historyIndex < this.#history.length - 1) {
        this.#historyIndex++;
        this.#inputValue.value = this.#history[this.#historyIndex] ?? "";
      } else {
        this.#historyIndex = -1;
        this.#inputValue.value = "";
      }
    }
  }

  /**
   * 入力されたコマンド文字列を解析してディスパッチし、実行結果をログに追加する。
   * @param {string} rawInput
   */
  async #execute(rawInput) {
    const trimmed = rawInput.trim();
    const currentPrompt = this.#promptText.value;

    if (!trimmed) {
      this.#appendLine("command", "", currentPrompt);
      this.#scrollToBottom();
      return;
    }

    this.#history.push(rawInput);
    this.#historyIndex = -1;
    this.#appendLine("command", rawInput, currentPrompt);

    const [cmd, ...args] = this.#parseArgs(trimmed);

    try {
      const output = await this.#dispatch(cmd, args);
      if (output !== null && output !== undefined && output !== "") {
        this.#appendLine("success", String(output));
      }
    } catch (err) {
      this.#appendLine("error", err?.message ?? String(err));
    }

    this.#promptText.value = this.#getPrompt();
    this.#scrollToBottom();
  }

  /**
   * コマンドライン文字列をスペースで分割し、クォートで囲まれた文字列を考慮して引数配列に分解する。
   * @param {string} input
   * @returns {string[]}
   */
  #parseArgs(input) {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const args = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
      args.push(match[1] ?? match[2] ?? match[0]);
    }
    return args;
  }

  /**
   * コマンド名と引数を受け取り、対応するビルトイン処理を実行する。
   * @param {string} cmd コマンド名
   * @param {string[]} args 引数配列
   * @returns {Promise<string|null>} 出力テキストまたは null
   */
  async #dispatch(cmd, args) {
    switch (cmd) {
      // ─── ファイルシステム ──────────────────────────────────────────────────
      case "readFile":
      case "cat": {
        if (!args[0]) throw new Error("Usage: readFile <path>");
        const path = this.#resolvePath(args[0]);
        return await this.fs.readFile(path);
      }

      case "writeFile":
      case "write": {
        if (!args[0]) throw new Error("Usage: writeFile <path> [text...]");
        const path = this.#resolvePath(args[0]);
        const content = args.slice(1).join(" ");
        await this.fs.writeFile(path, content);
        return `Wrote ${new TextEncoder().encode(content).byteLength} bytes to ${path}`;
      }

      case "readDir":
      case "ls":
      case "dir": {
        const path = this.#resolvePath(args[0]);
        const entries = await this.fs.readdir(path);
        if (entries.length === 0) return "(empty directory)";
        return entries
          .map((e) => `${e.type === "dir" ? "[DIR]  " : "       "}${e.name}`)
          .join("\n");
      }

      case "makeDir":
      case "mkdir": {
        if (!args[0]) throw new Error("Usage: makeDir <path>");
        const path = this.#resolvePath(args[0]);
        await this.fs.mkdir(path, { recursive: true });
        return `Created directory ${path}`;
      }

      case "remove":
      case "rm": {
        if (!args[0]) throw new Error("Usage: remove <path>");
        const path = this.#resolvePath(args[0]);
        await this.fs.remove(path, { recursive: true });
        return `Removed ${path}`;
      }

      case "rename":
      case "mv": {
        if (args.length < 2) throw new Error("Usage: rename <from> <to>");
        const from = this.#resolvePath(args[0]);
        const to = this.#resolvePath(args[1]);
        await this.fs.rename(from, to);
        return `Renamed ${from} -> ${to}`;
      }

      case "stat": {
        if (!args[0]) throw new Error("Usage: stat <path>");
        const path = this.#resolvePath(args[0]);
        const info = await this.fs.stat(path);
        return JSON.stringify(info, null, 2);
      }

      // ─── ナビゲーション ────────────────────────────────────────────────────
      case "changeDir":
      case "cd": {
        const target = this.#resolvePath(args[0] || "~");
        const exists = await this.fs.exists(target);
        if (!exists) throw new Error(`Directory not found: ${target}`);
        this.#cwd = target;
        return "";
      }

      case "currentDir":
      case "pwd": {
        return this.#cwd;
      }

      // ─── プロセス / アプリ ────────────────────────────────────────────────
      case "listProcesses":
      case "ps": {
        const procs = await this.listProcesses();
        if (procs.length === 0) return "(no running processes)";
        return ["UUID      NAME                  STATE", "─".repeat(45)]
          .concat(procs.map((p) => `${p.uuid.slice(0, 8)}  ${p.name.padEnd(20)}  ${p.state}`))
          .join("\n");
      }

      case "listApps":
      case "apps": {
        const apps = System.registry.list();
        if (apps.length === 0) return "(no registered apps)";
        return ["ID                      NAME             VERSION  DESCRIPTION", "─".repeat(65)]
          .concat(apps.map((a) => `${a.id.padEnd(24)}  ${a.name.padEnd(16)}  ${(a.version || "0.0.1").padEnd(8)}  ${a.description || ""}`))
          .join("\n");
      }

      case "loadApp":
      case "open": {
        if (!args[0]) throw new Error("Usage: loadApp <appDir|appId>");
        let appDir = args[0];
        if (!appDir.endsWith("/") && !appDir.includes(".")) {
          appDir = `apps/${appDir}/`;
        }
        const uuid = await System.loadApp(appDir);
        return `Loaded app "${appDir}" (UUID: ${uuid.slice(0, 8)})`;
      }

      case "closeApp":
      case "kill": {
        if (!args[0]) throw new Error("Usage: closeApp <uuid>");
        const uuid = args[0];
        System.closeApp(uuid);
        return `Closed app ${uuid}`;
      }

      case "focusApp":
      case "focus": {
        if (!args[0]) throw new Error("Usage: focusApp <uuid|prefix>");
        const targetUuid = await this.#resolveProcessUuid(args[0]);
        System.WindowSystem?.activateWindow(targetUuid);
        return `Focused app ${targetUuid.slice(0, 8)}`;
      }

      case "sendMessage":
      case "send":
      case "ipc": {
        if (args.length < 2) throw new Error("Usage: sendMessage <uuid|prefix> <data...>");
        const targetUuid = await this.#resolveProcessUuid(args[0]);
        const rawPayload = args.slice(1).join(" ");
        let payload = rawPayload;
        try {
          payload = JSON.parse(rawPayload);
        } catch {
          // JSON 以外は文字列のまま送信
        }
        await this.sendMessage(targetUuid, payload);
        return `Sent message to process ${targetUuid.slice(0, 8)}`;
      }

      // ─── ユーザー ──────────────────────────────────────────────────────────
      case "currentUser":
      case "whoami": {
        const user = System.currentUser;
        if (!user) return "No active user session";
        return `${user.name} (${user.id}) ${user.isAdmin ? "[admin]" : "[user]"}`;
      }

      case "listUsers":
      case "users": {
        const list = System.users.list();
        return ["ID            NAME              ROLE", "─".repeat(40)]
          .concat(list.map((u) => `${u.id.padEnd(12)}  ${u.name.padEnd(16)}  ${u.isAdmin ? "admin" : "user"}`))
          .join("\n");
      }

      case "logout": {
        System.logout();
        return "Logging out…";
      }

      // ─── システム / その他 ────────────────────────────────────────────────
      case "systemInfo":
      case "sysinfo": {
        const user = System.currentUser;
        const procs = await this.listProcesses();
        const apps = System.registry.list();
        return [
          "ESKit System Information",
          "────────────────────────",
          `  OS:                 ESKit v1.0.0`,
          `  User:               ${user ? `${user.name} (${user.id}) [${user.isAdmin ? "admin" : "user"}]` : "None"}`,
          `  Shell Mode:         ${System.shellMode.current}${System.shellMode.isLocked ? " (locked)" : " (auto)"}`,
          `  Current Directory:  ${this.#cwd}`,
          `  Running Processes:  ${procs.length}`,
          `  Registered Apps:    ${apps.length}`,
          `  Screen Resolution:  ${window.innerWidth}x${window.innerHeight}`,
        ].join("\n");
      }

      case "setShellMode":
      case "mode": {
        if (!args[0]) {
          return `Current shell mode: ${System.shellMode.current}${System.shellMode.isLocked ? " (locked)" : " (auto)"}`;
        }
        const target = args[0].toLowerCase();
        if (target === "auto") {
          System.setShellMode("auto");
          return `Shell mode set to auto (current: "${System.shellMode.current}")`;
        }
        if (target !== "desktop" && target !== "mobile") {
          throw new Error("Usage: setShellMode [desktop|mobile|auto]");
        }
        System.setShellMode(target);
        return `Shell mode changed to "${target}"`;
      }

      case "history": {
        if (this.#history.length === 0) return "(no command history)";
        return this.#history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${cmd}`).join("\n");
      }

      case "notify": {
        const title = args[0] || "ESKish";
        const message = args.slice(1).join(" ") || "Notification from ESKish";
        await this.showNotification({ title, message });
        return "Notification sent";
      }

      case "eval":
      case "js": {
        if (!args[0]) throw new Error("Usage: eval <javascript code...>");
        const code = args.join(" ");
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const fn = new AsyncFunction("System", "app", "fs", `return (${code});`);
        const result = await fn.call(this, System, this, this.fs);
        if (typeof result === "object" && result !== null) {
          return JSON.stringify(result, null, 2);
        }
        return String(result);
      }

      case "clear":
      case "cls": {
        this.#lines.value = [];
        return null;
      }

      case "help":
      case "?": {
        return [
          this.t("terminal.helpTitle"),
          "  File Operations:",
          `    readFile (cat) <path>            - ${this.t("terminal.helpDesc.readFile")}`,
          `    writeFile (write) <path> <text>  - ${this.t("terminal.helpDesc.writeFile")}`,
          `    readDir (ls, dir) [path]         - ${this.t("terminal.helpDesc.readDir")}`,
          `    makeDir (mkdir) <path>           - ${this.t("terminal.helpDesc.makeDir")}`,
          `    remove (rm) <path>               - ${this.t("terminal.helpDesc.remove")}`,
          `    rename (mv) <from> <to>          - ${this.t("terminal.helpDesc.rename")}`,
          `    stat <path>                      - ${this.t("terminal.helpDesc.stat")}`,
          "  Navigation:",
          `    changeDir (cd) [path]            - ${this.t("terminal.helpDesc.changeDir")}`,
          `    currentDir (pwd)                 - ${this.t("terminal.helpDesc.currentDir")}`,
          "  Processes & Apps:",
          `    listProcesses (ps)               - ${this.t("terminal.helpDesc.listProcesses")}`,
          `    listApps (apps)                  - ${this.t("terminal.helpDesc.listApps")}`,
          `    loadApp (open) <dir|id>          - ${this.t("terminal.helpDesc.loadApp")}`,
          `    closeApp (kill) <uuid>           - ${this.t("terminal.helpDesc.closeApp")}`,
          `    focusApp (focus) <uuid>          - ${this.t("terminal.helpDesc.focusApp")}`,
          `    sendMessage (send) <uuid> <msg>  - ${this.t("terminal.helpDesc.sendMessage")}`,
          "  User & Session:",
          `    currentUser (whoami)             - ${this.t("terminal.helpDesc.currentUser")}`,
          `    listUsers (users)                - ${this.t("terminal.helpDesc.listUsers")}`,
          `    logout                           - ${this.t("terminal.helpDesc.logout")}`,
          "  System & Utilities:",
          `    systemInfo (sysinfo)             - ${this.t("terminal.helpDesc.systemInfo")}`,
          `    setShellMode (mode) [mode]       - ${this.t("terminal.helpDesc.setShellMode")}`,
          `    history                          - ${this.t("terminal.helpDesc.history")}`,
          `    notify <title> [message]         - ${this.t("terminal.helpDesc.notify")}`,
          `    eval (js) <code...>              - ${this.t("terminal.helpDesc.eval")}`,
          `    clear (cls)                      - ${this.t("terminal.helpDesc.clear")}`,
          `    help (?)                         - ${this.t("terminal.helpDesc.help")}`,
        ].join("\n");
      }

      default:
        throw new Error(this.t("terminal.cmdNotFound", { cmd }));
    }
  }

  /**
   * ターミナル出力バッファに行を追加する。
   * @param {"command"|"success"|"error"|"info"} type 行の種類
   * @param {string} text 表示テキスト
   * @param {string} [prompt] コマンド行の場合のプロンプト文字列
   */
  #appendLine(type, text, prompt = null) {
    this.#lines.value = [...this.#lines.value, { type, text, prompt }];
  }

  /**
   * 出力エリアを最下部へ自動スクロールする。
   */
  #scrollToBottom() {
    requestAnimationFrame(() => {
      const output = this.querySelector("#output");
      if (output) {
        output.scrollTop = output.scrollHeight;
      }
    });
  }
}
