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
          <button @click=${() => this.#runAll()} class="kit-button -primary -small kit-flex kit-items-center kit-gap-xs">
            <eskit-icon set="lucide" name="sparkles" size="14"></eskit-icon>
            Run All Tests
          </button>
          <button @click=${() => this.#testNotify()} class="kit-button -small kit-flex kit-items-center kit-gap-xs">
            <eskit-icon set="lucide" name="bell" size="14"></eskit-icon>
            Test Notification
          </button>
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
                  <span class="icon">${() => {
                    const { pass } = item.state.value;
                    if (pass === null) return hamon`<eskit-icon set="lucide" name="clock" size="14"></eskit-icon>`;
                    if (pass) return hamon`<eskit-icon set="lucide" name="check-circle-2" size="14" color="var(--kit-color-success, #22c55e)"></eskit-icon>`;
                    return hamon`<eskit-icon set="lucide" name="x-circle" size="14" color="var(--kit-color-danger, #ef4444)"></eskit-icon>`;
                  }}</span>
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

    await this.#runSection("FileSystem — App Facade (this.fs) & ディレクトリ Rename", [
      () => this.#testAppFsWriteRead(),
      () => this.#testAppFsDirectoryRecursiveRename(),
    ]);

    await this.#runSection("Users & Permissions", [
      () => this.#testUserSingleCharId(),
      () => this.#testUserAdminProtection(),
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

    await this.#runSection("Icon System (ESKitIcons & <eskit-icon>)", [
      () => this.#testIconRegistryGetHas(),
      () => this.#testIconRegistryRegisterSet(),
      () => this.#testIconElementRender(),
      () => this.#testIconElementFallback(),
      () => this.#testCreateAppIcon(),
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

  #homePath(suffix = "") {
    const userId = System?.currentUser?.id;
    if (!userId) throw new Error("current user is not available");
    const root = `/home/${userId}`;
    return suffix ? `${root}/${suffix}` : root;
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
      const dir = this.#homePath(".eskit-verify");
      await System.fs.mkdir(dir, { recursive: true });
      this.#assert(await System.fs.exists(dir), "dir not found");
    });
  }

  async #testFsWriteReadText() {
    await this.#test("FS: writeFile (text) + readFile", async () => {
      const data = "Hello, ESKit! 🎉";
      const file = this.#homePath(".eskit-verify/hello.txt");
      await System.fs.writeFile(file, data);
      const read = await System.fs.readFile(file);
      this.#assert(read === data, `got: ${read}`);
    });
  }

  async #testFsStat() {
    await this.#test("FS: stat (size)", async () => {
      const stat = await System.fs.stat(this.#homePath(".eskit-verify/hello.txt"));
      const expectedSize = new TextEncoder().encode("Hello, ESKit! 🎉").byteLength;
      this.#assert(stat.size === expectedSize, `size=${stat.size}, expected=${expectedSize}`);
      this.#assert(stat.type === "file", `type=${stat.type}`);
      this.#assert(typeof stat.createdAt === "number", "createdAt missing");
      return `size=${stat.size} bytes`;
    });
  }

  async #testFsReaddir() {
    await this.#test("FS: readdir", async () => {
      const entries = await System.fs.readdir(this.#homePath(".eskit-verify"));
      this.#assert(entries.length >= 1, `entries.length=${entries.length}`);
      this.#assert(entries.some((e) => e.name === "hello.txt"), "hello.txt not in readdir");
      return `${entries.length} entries`;
    });
  }

  async #testFsRename() {
    await this.#test("FS: rename", async () => {
      const from = this.#homePath(".eskit-verify/hello.txt");
      const to = this.#homePath(".eskit-verify/renamed.txt");
      await System.fs.rename(
        from,
        to,
      );
      this.#assert(await System.fs.exists(to), "renamed not found");
      this.#assert(!await System.fs.exists(from), "old still exists");
    });
  }

  async #testFsRemove() {
    await this.#test("FS: remove (recursive)", async () => {
      const dir = this.#homePath(".eskit-verify");
      await System.fs.remove(dir, { recursive: true });
      this.#assert(!await System.fs.exists(dir), "dir still exists after remove");
    });
  }

  // ─── FileSystem テスト (バイナリ) ─────────────────────────────────────────

  async #testFsWriteBinary() {
    await this.#test("FS: writeFile (Uint8Array)", async () => {
      const bytes = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF]);
      const dir = this.#homePath(".eskit-verify-bin");
      const file = this.#homePath(".eskit-verify-bin/data.bin");
      await System.fs.mkdir(dir, { recursive: true });
      await System.fs.writeFile(file, bytes);
      this.#assert(await System.fs.exists(file), "bin not found");
      return "6 bytes";
    });
  }

  async #testFsReadBinary() {
    await this.#test("FS: readFileAsBytes (Uint8Array 一致)", async () => {
      const expected = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF]);
      const file = this.#homePath(".eskit-verify-bin/data.bin");
      const dir = this.#homePath(".eskit-verify-bin");
      const read = await System.fs.readFileAsBytes(file);
      this.#assert(read.length === expected.length, `length=${read.length}`);
      for (let i = 0; i < expected.length; i++) {
        this.#assert(read[i] === expected[i], `byte[${i}]: ${read[i]} ≠ ${expected[i]}`);
      }
      await System.fs.remove(dir, { recursive: true });
      return `${read.length} bytes match`;
    });
  }

  async #testFsReadBinaryAsText() {
    await this.#test("FS: ArrayBuffer → writeFile → readFile", async () => {
      const text   = "ArrayBuffer test 🚀";
      const buffer = new TextEncoder().encode(text).buffer;
      const file = this.#homePath(".eskit-verify-tmp.txt");
      await System.fs.writeFile(file, buffer);
      const result = await System.fs.readFile(file);
      this.#assert(result === text, `got: ${result}`);
      await System.fs.remove(file);
    });
  }

  // ─── FileSystem — App Facade (this.fs) & ディレクトリ Rename ───────────────

  async #testAppFsWriteRead() {
    await this.#test("App FS Facade: this.fs.writeFile + readFile", async () => {
      const data = "App FS Facade verified! ✨";
      const file = this.#homePath(".eskit-verify-appfs.txt");
      await this.fs.writeFile(file, data);
      const read = await this.fs.readFile(file);
      this.#assert(read === data, `got: ${read}`);
      await this.fs.remove(file);
      return "permission & facade ok";
    });
  }

  async #testAppFsDirectoryRecursiveRename() {
    await this.#test("FS: ディレクトリ再帰的 rename (子ファイル・子ディレクトリ)", async () => {
      const baseDir = this.#homePath(".eskit-verify-tree");
      const subDir  = `${baseDir}/sub`;
      const file1   = `${baseDir}/root.txt`;
      const file2   = `${subDir}/child.txt`;

      await this.fs.mkdir(subDir, { recursive: true });
      await this.fs.writeFile(file1, "root file");
      await this.fs.writeFile(file2, "child file");

      const newBaseDir = this.#homePath(".eskit-verify-tree-renamed");
      await this.fs.rename(baseDir, newBaseDir);

      const newFile1 = `${newBaseDir}/root.txt`;
      const newFile2 = `${newBaseDir}/sub/child.txt`;

      this.#assert(await this.fs.exists(newFile1), "renamed root file not found");
      this.#assert(await this.fs.exists(newFile2), "renamed child file not found");
      this.#assert((await this.fs.readFile(newFile2)) === "child file", "child content mismatch");

      const entries = await this.fs.readdir(`${newBaseDir}/sub`);
      this.#assert(entries.some((e) => e.name === "child.txt"), "child.txt not in readdir");

      this.#assert(!await this.fs.exists(baseDir), "old dir still exists");
      await this.fs.remove(newBaseDir, { recursive: true });
      return "recursive move verified";
    });
  }

  // ─── Users & Permissions テスト ───────────────────────────────────────────

  async #testUserSingleCharId() {
    await this.#test("Users: 1文字 ID ユーザーの作成・削除", async () => {
      const testId = "u";
      if (System.users.get(testId)) {
        await System.users.delete(testId);
      }

      const user = await System.users.create({
        id: testId,
        name: "User U",
        password: "password123",
        isAdmin: false,
      });
      this.#assert(user.id === "u", `user.id=${user.id}`);
      this.#assert(System.users.get("u") !== null, "user 'u' not found in get()");

      await System.users.delete("u");
      this.#assert(System.users.get("u") === null, "user 'u' still exists after delete");
      return "1-char id allowed & deleted";
    });
  }

  async #testUserAdminProtection() {
    await this.#test("Users: 一般ユーザーによる管理者作成・削除の拒否", async () => {
      const regularId = "testuser";
      if (System.users.get(regularId)) {
        await System.users.delete(regularId);
      }
      await System.users.create({
        id: regularId,
        name: "Regular User",
        password: "password123",
        isAdmin: false,
      });

      const adminUser = System.currentUser;
      await System.users.login(regularId, "password123");

      let createAdminBlocked = false;
      try {
        await System.users.create({
          id: "fakeadmin",
          name: "Fake Admin",
          password: "password123",
          isAdmin: true,
        });
      } catch {
        createAdminBlocked = true;
      }

      let deleteBlocked = false;
      try {
        await System.users.delete(adminUser.id);
      } catch {
        deleteBlocked = true;
      }

      // 管理者に復帰 (デフォルトadminはパスワード空)
      await System.users.login(adminUser.id, "");

      // クリーンアップ
      await System.users.delete(regularId);

      this.#assert(createAdminBlocked, "Regular user was able to create an admin!");
      this.#assert(deleteBlocked, "Regular user was able to delete a user!");
      return "privilege escalation & unauthorized delete blocked";
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
    await this.#test("ESKitApp: this.listProcesses() (system.info 権限)", async () => {
      const procs = await this.listProcesses();
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
    await this.#test("ESKitApp: this.sendMessage() → onMessage (ipc 権限)", async () => {
      this.#ipcReceived = false;
      await this.sendMessage(this._uuid, { ping: true });
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

  // ─── Icon System テスト ───────────────────────────────────────────────────

  async #testIconRegistryGetHas() {
    await this.#test("Icons: System.icons.get() & has()", () => {
      this.#assert(System.icons !== undefined, "System.icons is undefined");
      this.#assert(System.icons.has("lucide"), "lucide set not found");
      this.#assert(System.icons.has("lucide", "search"), "lucide:search not found");
      this.#assert(!System.icons.has("lucide", "non_existent_icon_xyz"), "non-existent icon found");

      const svgContent = System.icons.get("lucide", "search");
      this.#assert(typeof svgContent === "string" && svgContent.length > 0, "svgContent is invalid");
      return "OK";
    });
  }

  async #testIconRegistryRegisterSet() {
    await this.#test("Icons: System.icons.registerSet() & listSets()", () => {
      System.icons.registerSet("test-custom-set", {
        "custom-star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      });
      this.#assert(System.icons.has("test-custom-set", "custom-star"), "custom icon not registered");
      this.#assert(System.icons.listSets().includes("test-custom-set"), "test-custom-set not in listSets");
      this.#assert(System.icons.listIcons("test-custom-set").includes("custom-star"), "custom-star not in listIcons");
      return "OK";
    });
  }

  async #testIconElementRender() {
    await this.#test("Icons: <eskit-icon> DOM レンダリング & 属性反映", () => {
      const el = document.createElement("eskit-icon");
      el.setAttribute("set", "lucide");
      el.setAttribute("name", "terminal");
      el.setAttribute("size", "24");
      el.setAttribute("color", "#ff0000");

      const container = document.createElement("div");
      container.appendChild(el);
      document.body.appendChild(container);

      try {
        const svg = el.shadowRoot?.querySelector("svg");
        this.#assert(svg !== null, "SVG element not rendered in shadowRoot");
        this.#assert(el.style.width === "24px", `width=${el.style.width}`);
        this.#assert(el.style.color === "rgb(255, 0, 0)", `color=${el.style.color}`);
      } finally {
        container.remove();
      }
      return "OK";
    });
  }

  async #testIconElementFallback() {
    await this.#test("Icons: 未登録アイコン指定時のフォールバック (help-circle)", () => {
      const el = document.createElement("eskit-icon");
      el.setAttribute("set", "lucide");
      el.setAttribute("name", "unknown_missing_icon");

      const container = document.createElement("div");
      container.appendChild(el);
      document.body.appendChild(container);

      try {
        const svg = el.shadowRoot?.querySelector("svg");
        this.#assert(svg !== null, "SVG element not rendered");
        this.#assert(svg.innerHTML.length > 0, "SVG innerHTML is empty on fallback");
      } finally {
        container.remove();
      }
      return "OK";
    });
  }

  async #testCreateAppIcon() {
    await this.#test("Icons: System.icons.createAppIcon() (set & image)", () => {
      // 1. set 指定
      const setIcon = System.icons.createAppIcon({ type: "set", set: "lucide", name: "terminal" }, { size: 20 });
      this.#assert(setIcon.tagName.toLowerCase() === "eskit-icon", "setIcon is not <eskit-icon>");
      this.#assert(setIcon.getAttribute("name") === "terminal", "setIcon name != terminal");

      // 2. image 指定
      const imgIcon = System.icons.createAppIcon({ type: "image", src: "icon.png" }, { size: 20 });
      this.#assert(imgIcon.tagName.toLowerCase() === "img", "imgIcon is not <img>");
      this.#assert(imgIcon.getAttribute("src") === "icon.png", "imgIcon src != icon.png");

      // 3. null フォールバック
      const nullIcon = System.icons.createAppIcon(null, { size: 20 });
      this.#assert(nullIcon.tagName.toLowerCase() === "eskit-icon", "nullIcon is not <eskit-icon>");
      this.#assert(nullIcon.getAttribute("name") === "package", "nullIcon name != package");
      return "OK";
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

