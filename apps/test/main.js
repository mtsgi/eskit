import ESKitApp from "system/app.js";
import hamon, { signal, list } from "system/hamon.js";
import style from "./style.js";

const System = globalThis.System;

/**
 * System Verifier — ESKit システム機能の網羅的な検証アプリ
 *
 * 検証カテゴリ:
 *   - EventBus (on / once / off / emit)
 *   - FileSystem (text / binary / mkdir / readdir / stat / rename / remove)
 *   - Registry (list / search)
 *   - System API (listProcesses / nextZIndex / sendMessage)
 *   - ESKitApp API (setTitle / querySelector / querySelectorAll)
 */
export default class SystemVerifier extends ESKitApp {
  static style    = style;

  #ipcReceived    = false;
  #results        = [];
  #resultItems    = signal([]);
  #summaryText    = signal("");
  #summaryClass   = signal("");

  constructor() {
    super();
    this.name     = "SystemVerifier";
    this.template = hamon`
      <div class="runner">
        <div class="toolbar">
          <button @click=${() => this.#runAll()} class="kit-button -primary -small">▶ Run All Tests</button>
          <button @click=${() => this.#testNotify()} class="kit-button -small">🔔 Test Notification</button>
          <span :class=${() => `summary ${this.#summaryClass.value}`}>${() => this.#summaryText.value}</span>
        </div>
        <ol id="results" class="results">
          ${list(
            () => this.#resultItems.value,
            (item) => {
              if (item.type === "section") {
                const li = document.createElement("li");
                li.className = "section-header";
                li.textContent = item.label;
                return li;
              }
              return hamon`
                <li :class=${() => {
                  const { pass } = item.state.value;
                  return `result ${pass === null ? "run" : pass ? "pass" : "fail"}`;
                }}>
                  <span class="icon">${() => { const { pass } = item.state.value; return pass === null ? "⏳" : pass ? "✅" : "❌"; }}</span>
                  <span class="name">${item.name}</span>
                  <span class="detail">${() => item.state.value.detail ?? ""}</span>
                </li>
              `;
            },
          )}
        </ol>
      </div>
    `;
  }

  initialize() {
    this.setTitle("System Verifier");
  }

  onMessage(data) {
    this.#ipcReceived = true;
    this.#appendResult("IPC: receive onMessage", true, JSON.stringify(data));
  }

  // ─── テスト エントリポイント ───────────────────────────────────────────────

  async #runAll() {
    this.#results = [];
    this.#resultItems.value  = [];
    this.#summaryText.value  = "Running…";
    this.#summaryClass.value = "";
    this.#ipcReceived = false;

    await this.#runSection("EventBus", [
      () => this.#testEventBusOnEmit(),
      () => this.#testEventBusOnce(),
      () => this.#testEventBusOff(),
    ]);

    await this.#runSection("FileSystem — テキスト", [
      () => this.#testFsMkdir(),
      () => this.#testFsWriteReadText(),
      () => this.#testFsStat(),
      () => this.#testFsReaddir(),
      () => this.#testFsRename(),
      () => this.#testFsRemove(),
    ]);

    await this.#runSection("FileSystem — バイナリ", [
      () => this.#testFsWriteBinary(),
      () => this.#testFsReadBinary(),
      () => this.#testFsReadBinaryAsText(),
    ]);

    await this.#runSection("Registry", [
      () => this.#testRegistryList(),
      () => this.#testRegistrySearch(),
    ]);

    await this.#runSection("System API", [
      () => this.#testListProcesses(),
      () => this.#testNextZIndex(),
      () => this.#testSendMessage(),
    ]);

    await this.#runSection("ESKitApp API", [
      () => this.#testSetTitle(),
      () => this.#testQuerySelector(),
      () => this.#testQuerySelectorAll(),
    ]);

    this.#updateSummary();
  }

  // ─── セクション実行ヘルパー ────────────────────────────────────────────────

  async #runSection(label, fns) {
    this.#appendSectionHeader(label);
    for (const fn of fns) {
      await fn().catch((e) => console.error("[SystemVerifier]", e));
    }
  }

  async #test(name, fn) {
    const item = this.#appendResult(name, null, "…");
    try {
      const detail = await fn();
      this.#updateResult(item, true, detail ?? "");
      this.#results.push(true);
    } catch (err) {
      this.#updateResult(item, false, err?.message ?? String(err));
      this.#results.push(false);
    }
  }

  #assert(cond, msg = "assertion failed") {
    if (!cond) throw new Error(msg);
  }

  // ─── EventBus テスト ──────────────────────────────────────────────────────

  async #testEventBusOnEmit() {
    await this.#test("EventBus: on / emit", () => {
      let received = null;
      const off = System.events.on("__eskit_test__", (d) => { received = d; });
      System.events.emit("__eskit_test__", { ok: true });
      off();
      this.#assert(received?.ok === true, `received: ${JSON.stringify(received)}`);
    });
  }

  async #testEventBusOnce() {
    await this.#test("EventBus: once (一度だけ呼ばれる)", () => {
      let count = 0;
      System.events.once("__eskit_once__", () => count++);
      System.events.emit("__eskit_once__");
      System.events.emit("__eskit_once__");
      this.#assert(count === 1, `count=${count}`);
      return `count=${count}`;
    });
  }

  async #testEventBusOff() {
    await this.#test("EventBus: off (購読解除)", () => {
      let count = 0;
      const handler = () => count++;
      System.events.on("__eskit_off__", handler);
      System.events.emit("__eskit_off__");
      System.events.off("__eskit_off__", handler);
      System.events.emit("__eskit_off__");
      this.#assert(count === 1, `count=${count}`);
    });
  }

  // ─── FileSystem テスト (テキスト) ─────────────────────────────────────────

  async #testFsMkdir() {
    await this.#test("FS: mkdir + exists", async () => {
      await System.fs.mkdir("/home/user/.eskit-verify", { recursive: true });
      this.#assert(await System.fs.exists("/home/user/.eskit-verify"), "dir not found");
    });
  }

  async #testFsWriteReadText() {
    await this.#test("FS: writeFile (text) + readFile", async () => {
      const data = "Hello, ESKit! 🎉";
      await System.fs.writeFile("/home/user/.eskit-verify/hello.txt", data);
      const read = await System.fs.readFile("/home/user/.eskit-verify/hello.txt");
      this.#assert(read === data, `got: ${read}`);
    });
  }

  async #testFsStat() {
    await this.#test("FS: stat (size)", async () => {
      const stat = await System.fs.stat("/home/user/.eskit-verify/hello.txt");
      const expectedSize = new TextEncoder().encode("Hello, ESKit! 🎉").byteLength;
      this.#assert(stat.size === expectedSize, `size=${stat.size}, expected=${expectedSize}`);
      this.#assert(stat.type === "file", `type=${stat.type}`);
      this.#assert(typeof stat.createdAt === "number", "createdAt missing");
      return `size=${stat.size} bytes`;
    });
  }

  async #testFsReaddir() {
    await this.#test("FS: readdir", async () => {
      const entries = await System.fs.readdir("/home/user/.eskit-verify");
      this.#assert(entries.length >= 1, `entries.length=${entries.length}`);
      this.#assert(entries.some((e) => e.name === "hello.txt"), "hello.txt not in readdir");
      return `${entries.length} entries`;
    });
  }

  async #testFsRename() {
    await this.#test("FS: rename", async () => {
      await System.fs.rename(
        "/home/user/.eskit-verify/hello.txt",
        "/home/user/.eskit-verify/renamed.txt",
      );
      this.#assert(await System.fs.exists("/home/user/.eskit-verify/renamed.txt"), "renamed not found");
      this.#assert(!await System.fs.exists("/home/user/.eskit-verify/hello.txt"), "old still exists");
    });
  }

  async #testFsRemove() {
    await this.#test("FS: remove (recursive)", async () => {
      await System.fs.remove("/home/user/.eskit-verify", { recursive: true });
      this.#assert(!await System.fs.exists("/home/user/.eskit-verify"), "dir still exists after remove");
    });
  }

  // ─── FileSystem テスト (バイナリ) ─────────────────────────────────────────

  async #testFsWriteBinary() {
    await this.#test("FS: writeFile (Uint8Array)", async () => {
      const bytes = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF]);
      await System.fs.mkdir("/home/user/.eskit-verify-bin", { recursive: true });
      await System.fs.writeFile("/home/user/.eskit-verify-bin/data.bin", bytes);
      this.#assert(await System.fs.exists("/home/user/.eskit-verify-bin/data.bin"), "bin not found");
      return "6 bytes";
    });
  }

  async #testFsReadBinary() {
    await this.#test("FS: readFileAsBytes (Uint8Array 一致)", async () => {
      const expected = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF]);
      const read = await System.fs.readFileAsBytes("/home/user/.eskit-verify-bin/data.bin");
      this.#assert(read.length === expected.length, `length=${read.length}`);
      for (let i = 0; i < expected.length; i++) {
        this.#assert(read[i] === expected[i], `byte[${i}]: ${read[i]} ≠ ${expected[i]}`);
      }
      await System.fs.remove("/home/user/.eskit-verify-bin", { recursive: true });
      return `${read.length} bytes match`;
    });
  }

  async #testFsReadBinaryAsText() {
    await this.#test("FS: ArrayBuffer → writeFile → readFile", async () => {
      const text   = "ArrayBuffer test 🚀";
      const buffer = new TextEncoder().encode(text).buffer;
      await System.fs.writeFile("/home/user/.eskit-verify-tmp.txt", buffer);
      const result = await System.fs.readFile("/home/user/.eskit-verify-tmp.txt");
      this.#assert(result === text, `got: ${result}`);
      await System.fs.remove("/home/user/.eskit-verify-tmp.txt");
    });
  }

  // ─── Registry テスト ──────────────────────────────────────────────────────

  async #testRegistryList() {
    await this.#test("Registry: list()", () => {
      const list = System.registry.list();
      this.#assert(list.length >= 2, `list.length=${list.length}`);
      return `${list.length} apps`;
    });
  }

  async #testRegistrySearch() {
    await this.#test("Registry: search('verifier')", () => {
      const results = System.registry.search("verifier");
      this.#assert(results.some((m) => m.id === "eskit.test"), "eskit.test not found");
      return `${results.length} hit(s)`;
    });
  }

  // ─── System API テスト ────────────────────────────────────────────────────

  async #testListProcesses() {
    await this.#test("System: listProcesses()", () => {
      const procs = System.listProcesses();
      this.#assert(procs.some((p) => p.uuid === this._uuid), "self not in process list");
      return `${procs.length} process(es)`;
    });
  }

  async #testNextZIndex() {
    await this.#test("System: nextZIndex() 単調増加", () => {
      const z1 = System.nextZIndex();
      const z2 = System.nextZIndex();
      this.#assert(z2 > z1, `z1=${z1}, z2=${z2}`);
      return `${z1} → ${z2}`;
    });
  }

  async #testSendMessage() {
    await this.#test("System: sendMessage → onMessage", () => {
      this.#ipcReceived = false;
      System.sendMessage(this._uuid, { ping: true });
      this.#assert(this.#ipcReceived, "onMessage not called");
      return "ping → pong";
    });
  }

  // ─── ESKitApp API テスト ──────────────────────────────────────────────────

  async #testSetTitle() {
    await this.#test("ESKitApp: setTitle()", () => {
      this.setTitle("System Verifier ✓");
      const span = this._windowElement?.shadowRoot?.querySelector(".app-title");
      this.#assert(span?.textContent === "System Verifier ✓", `title="${span?.textContent}"`);
    });
  }

  async #testQuerySelector() {
    await this.#test("ESKitApp: querySelector()", () => {
      const el = this.querySelector("#results");
      this.#assert(el !== null, "element not found");
      this.#assert(el.id === "results", `id=${el.id}`);
    });
  }

  async #testQuerySelectorAll() {
    await this.#test("ESKitApp: querySelectorAll('button')", () => {
      const buttons = this.querySelectorAll("button");
      this.#assert(buttons.length >= 2, `length=${buttons.length}`);
      return `${buttons.length} buttons`;
    });
  }

  // ─── 通知テスト (ユーザー確認が必要) ────────────────────────────────────────

  async #testNotify() {
    await this.showNotification({
      title:    "Test Notification",
      message:  "ESKit 通知システムのテストです",
      duration: 3000,
    });
  }

  // ─── UI ヘルパー ──────────────────────────────────────────────────────────

  #appendSectionHeader(label) {
    this.#resultItems.value = [...this.#resultItems.value, { type: "section", label }];
  }

  #appendResult(name, pass, detail) {
    const item = { type: "result", name, state: signal({ pass, detail }) };
    this.#resultItems.value = [...this.#resultItems.value, item];
    return item;
  }

  #updateResult(item, pass, detail) {
    item.state.value = { pass, detail };
  }

  #updateSummary() {
    const total  = this.#results.length;
    const passed = this.#results.filter(Boolean).length;
    const failed = total - passed;
    this.#summaryText.value  = `${passed}/${total} passed${failed > 0 ? ` · ${failed} failed` : ""}`;
    this.#summaryClass.value = failed > 0 ? "fail" : "ok";
  }
}

