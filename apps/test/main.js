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
        <div class="controls">
          <button @click=${() => this.#runAll()} class="kit-button -primary -small kit-flex kit-flex-middle kit-gap-xs">
            <eskit-icon set="lucide" name="play" size="14"></eskit-icon>
            <span>Run All Tests</span>
          </button>
          <button @click=${() => this.#testNotify()} class="kit-button -small kit-flex kit-flex-middle kit-gap-xs">
            <eskit-icon set="lucide" name="bell" size="14"></eskit-icon>
            <span>Test Notification</span>
          </button>
        </div>
        <span :class=${() => `summary ${this.#summaryClass.value}`}>${() => this.#summaryText.value}</span>
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

    await this.#runSection("Phase 5: Theme System (ESKitTheme)", [
      () => this.#testThemePresets(),
      () => this.#testThemeModeSwitching(),
      () => this.#testThemeApply(),
      () => this.#testThemeWallpaper(),
      () => this.#testThemeExport(),
    ]);

    await this.#runSection("Phase 5: i18n System (ESKitI18n)", [
      () => this.#testI18nTranslation(),
      () => this.#testI18nLocaleSwitch(),
      () => this.#testI18nExtend(),
      () => this.#testI18nDateTimeFormatting(),
      () => this.#testI18nAppResolution(),
      () => this.#testI18nPermissionDescriptions(),
      () => this.#testI18nDictionaryIntegrity(),
    ]);

    await this.#runSection("Phase 5: Dialog & Notifications Store", [
      () => this.#testDialogFacade(),
      () => this.#testNotificationsStore(),
    ]);

    await this.#runSection("Phase 5: Permission Management (ESKitPermissions)", [
      () => this.#testPermissionStateAndGrant(),
      () => this.#testPermissionSingleRevoke(),
      () => this.#testPermissionRevokeAll(),
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

  // ─── Phase 5: テーマテスト ──────────────────────────────────────────────────

  async #testThemePresets() {
    await this.#test("Theme: 組み込みプリセット一覧 (Catppuccin, Nord 等)", () => {
      const list = System.theme.list;
      this.#assert(Array.isArray(list) && list.length >= 6, `presets length=${list.length}`);
      const mocha = list.find((t) => t.id === "catppuccin-mocha");
      this.#assert(mocha !== undefined, "catppuccin-mocha not found in theme list");
      this.#assert(mocha.dark === true, "catppuccin-mocha is not dark");
      return `${list.length} presets registered`;
    });
  }

  async #testThemeModeSwitching() {
    await this.#test("Theme: カラーモード切替 (light / dark / auto)", () => {
      const prevMode = System.theme.mode;
      try {
        System.theme.setMode("dark");
        this.#assert(System.theme.isDark === true, "isDark is false when mode=dark");
        this.#assert(document.documentElement.classList.contains("kit-dark"), "html missing .kit-dark");

        System.theme.setMode("light");
        this.#assert(System.theme.isDark === false, "isDark is true when mode=light");
        this.#assert(document.documentElement.classList.contains("kit-light"), "html missing .kit-light");

        System.theme.setMode("auto");
        this.#assert(System.theme.mode === "auto", "mode is not auto");
      } finally {
        System.theme.setMode(prevMode);
      }
      return "OK";
    });
  }

  async #testThemeApply() {
    await this.#test("Theme: プリセット適用 (apply)", () => {
      const prevTheme = System.theme.current;
      try {
        System.theme.apply("catppuccin-mocha");
        this.#assert(System.theme.current === "catppuccin-mocha", `current=${System.theme.current}`);
        const vars = System.theme.vars;
        this.#assert(vars["--kit-color-primary"] === "#cba6f7", `primary=${vars["--kit-color-primary"]}`);
      } finally {
        System.theme.apply(prevTheme);
      }
      return "OK";
    });
  }

  async #testThemeWallpaper() {
    await this.#test("Theme: 壁紙設定 (setWallpaper)", () => {
      const prevWp = System.theme.wallpaper;
      try {
        const testGradient = "linear-gradient(90deg, #111, #222)";
        System.theme.setWallpaper(testGradient);
        this.#assert(System.theme.wallpaper === testGradient, `wallpaper=${System.theme.wallpaper}`);
      } finally {
        System.theme.setWallpaper(prevWp);
      }
      return "OK";
    });
  }

  async #testThemeExport() {
    await this.#test("Theme: エクスポート JSON 出力", () => {
      const jsonStr = System.theme.export();
      this.#assert(typeof jsonStr === "string", "export is not string");
      const parsed = JSON.parse(jsonStr);
      this.#assert(parsed.id !== undefined && parsed.vars !== undefined, "parsed export missing id or vars");
      return `Exported ${parsed.name}`;
    });
  }

  // ─── Phase 5: i18n テスト ───────────────────────────────────────────────────

  async #testI18nTranslation() {
    await this.#test("i18n: 翻訳取得 (t) & フォールバック", () => {
      const jaVal = System.i18n.t("system.desktop");
      this.#assert(typeof jaVal === "string" && jaVal.length > 0, `jaVal=${jaVal}`);

      const missingKey = "some.non.existent.key.12345";
      const fallback = System.i18n.t(missingKey);
      this.#assert(fallback === missingKey, `fallback=${fallback}`);
      return "OK";
    });
  }

  async #testI18nLocaleSwitch() {
    await this.#test("i18n: 言語切替 (setLocale)", async () => {
      const prevLocale = System.i18n.current;
      try {
        await System.i18n.setLocale("en");
        this.#assert(System.i18n.current === "en", `locale=${System.i18n.current}`);
        this.#assert(System.i18n.t("system.desktop") === "Desktop", `t()=${System.i18n.t("system.desktop")}`);

        await System.i18n.setLocale("ja");
        this.#assert(System.i18n.current === "ja", `locale=${System.i18n.current}`);
        this.#assert(System.i18n.t("system.desktop") === "デスクトップ", `t()=${System.i18n.t("system.desktop")}`);
      } finally {
        await System.i18n.setLocale(prevLocale);
      }
      return "OK";
    });
  }

  async #testI18nExtend() {
    await this.#test("i18n: アプリ独自辞書拡張 (extend)", () => {
      System.i18n.extend("verifierTest", "ja", { testGreeting: "こんにちは {name}" });
      const res = System.i18n.t("verifierTest.testGreeting", { name: "ESKit" });
      this.#assert(res === "こんにちは ESKit", `res=${res}`);
      return res;
    });
  }

  async #testI18nDateTimeFormatting() {
    await this.#test("i18n: 日時フォーマット (formatTime / formatDate)", async () => {
      const fixedDate = new Date("2026-08-28T14:30:00Z");
      const prevLocale = System.i18n.current;
      try {
        await System.i18n.setLocale("ja");
        const timeJa = System.i18n.formatTime(fixedDate);
        const dateJa = System.i18n.formatDate(fixedDate);
        this.#assert(typeof timeJa === "string" && timeJa.length > 0, `timeJa=${timeJa}`);
        this.#assert(typeof dateJa === "string" && dateJa.length > 0, `dateJa=${dateJa}`);

        await System.i18n.setLocale("en");
        const timeEn = System.i18n.formatTime(fixedDate);
        const dateEn = System.i18n.formatDate(fixedDate);
        this.#assert(typeof timeEn === "string" && timeEn.length > 0, `timeEn=${timeEn}`);
        this.#assert(typeof dateEn === "string" && dateEn.length > 0, `dateEn=${dateEn}`);
      } finally {
        await System.i18n.setLocale(prevLocale);
      }
      return "OK";
    });
  }

  async #testI18nAppResolution() {
    await this.#test("i18n: アプリ名 & 説明文解決 (getAppName / getAppDescription)", async () => {
      const prevLocale = System.i18n.current;
      const testManifest = { id: "eskit.welcome", name: "WelcomeApp", description: "Default desc" };
      try {
        await System.i18n.setLocale("ja");
        const nameJa = System.i18n.getAppName(testManifest);
        const descJa = System.i18n.getAppDescription(testManifest);
        this.#assert(nameJa === "ようこそ", `nameJa=${nameJa}`);
        this.#assert(descJa.includes("ESKit"), `descJa=${descJa}`);

        await System.i18n.setLocale("en");
        const nameEn = System.i18n.getAppName(testManifest);
        const descEn = System.i18n.getAppDescription(testManifest);
        this.#assert(nameEn === "Welcome", `nameEn=${nameEn}`);
        this.#assert(descEn.includes("ESKit"), `descEn=${descEn}`);
      } finally {
        await System.i18n.setLocale(prevLocale);
      }
      return "OK";
    });
  }

  async #testI18nPermissionDescriptions() {
    await this.#test("i18n: 権限説明文の解決 (getPermissionDescription)", async () => {
      const prevLocale = System.i18n.current;
      try {
        await System.i18n.setLocale("ja");
        const descJa = System.i18n.getPermissionDescription("fs.read");
        this.#assert(typeof descJa === "string" && descJa !== "fs.read", `descJa=${descJa}`);

        await System.i18n.setLocale("en");
        const descEn = System.i18n.getPermissionDescription("fs.read");
        this.#assert(typeof descEn === "string" && descEn.includes("home directory"), `descEn=${descEn}`);
      } finally {
        await System.i18n.setLocale(prevLocale);
      }
      return "OK";
    });
  }

  async #testI18nDictionaryIntegrity() {
    await this.#test("i18n: 辞書キー整合性チェック (ja ↔ en)", async () => {
      const jaUrl = new URL("../../system/i18n/ja.json", import.meta.url);
      const enUrl = new URL("../../system/i18n/en.json", import.meta.url);
      const [jaRes, enRes] = await Promise.all([fetch(jaUrl), fetch(enUrl)]);
      const [jaDict, enDict] = await Promise.all([jaRes.json(), enRes.json()]);

      const collectKeys = (obj, prefix = "") => {
        let keys = [];
        for (const [k, v] of Object.entries(obj)) {
          const path = prefix ? `${prefix}.${k}` : k;
          if (v && typeof v === "object" && !Array.isArray(v)) {
            keys.push(...collectKeys(v, path));
          } else {
            keys.push(path);
          }
        }
        return keys;
      };

      const jaKeys = new Set(collectKeys(jaDict));
      const enKeys = new Set(collectKeys(enDict));

      const missingInEn = [...jaKeys].filter(k => !enKeys.has(k));
      const missingInJa = [...enKeys].filter(k => !jaKeys.has(k));

      this.#assert(missingInEn.length === 0, `Keys missing in EN: ${missingInEn.join(", ")}`);
      this.#assert(missingInJa.length === 0, `Keys missing in JA: ${missingInJa.join(", ")}`);
      return `All ${jaKeys.size} translation keys matched across JA & EN`;
    });
  }

  // ─── Phase 5: Dialog & Notifications テスト ───────────────────────────────

  async #testDialogFacade() {
    await this.#test("Dialog: System.dialog ファサード API 存在確認", () => {
      this.#assert(System.dialog !== null && System.dialog !== undefined, "System.dialog is null");
      this.#assert(typeof System.dialog.alert === "function", "alert is not a function");
      this.#assert(typeof System.dialog.confirm === "function", "confirm is not a function");
      this.#assert(typeof System.dialog.prompt === "function", "prompt is not a function");
      this.#assert(typeof System.dialog.custom === "function", "custom is not a function");
      return "OK";
    });
  }

  async #testNotificationsStore() {
    await this.#test("Notifications: 通知ストア (add, list, clear, unreadCount)", () => {
      const initialCount = System.notifications.list().length;
      const item = System.notifications.add({
        title: "Test Note",
        message: "Store testing",
        type: "success",
      });
      this.#assert(item.id !== undefined, "item id is undefined");
      this.#assert(System.notifications.list().length === initialCount + 1, "list length did not increase");

      System.notifications.markAllRead();
      this.#assert(System.notifications.unreadCount === 0, "unreadCount is not 0 after markAllRead");

      System.notifications.clear();
      this.#assert(System.notifications.list().length === 0, "list is not empty after clear");
      return "OK";
    });
  }

  // ─── Phase 5: Permission テスト ──────────────────────────────────────────

  async #testPermissionStateAndGrant() {
    await this.#test("Permissions: grant / deny / getPermissionState", () => {
      const testAppId = "eskit.test.perm.demo";
      System.permissions.grant(testAppId, "fs.read", true);
      System.permissions.grant(testAppId, "notifications", false);

      this.#assert(System.permissions.getPermissionState(testAppId, "fs.read") === "granted", "fs.read is not granted");
      this.#assert(System.permissions.getPermissionState(testAppId, "notifications") === "denied", "notifications is not denied");
      this.#assert(System.permissions.getPermissionState(testAppId, "clipboard") === "unprompted", "clipboard is not unprompted");

      return "OK";
    });
  }

  async #testPermissionSingleRevoke() {
    await this.#test("Permissions: 個別権限の取り消し (revokePermission)", () => {
      const testAppId = "eskit.test.perm.demo";
      System.permissions.grant(testAppId, "fs.read", true);
      System.permissions.grant(testAppId, "fs.write", true);

      // fs.read のみ個別取り消し
      System.permissions.revokePermission(testAppId, "fs.read");

      this.#assert(System.permissions.getPermissionState(testAppId, "fs.read") === "unprompted", "fs.read was not revoked");
      this.#assert(System.permissions.getPermissionState(testAppId, "fs.write") === "granted", "fs.write should still be granted");

      return "Single permission revoked without affecting others";
    });
  }

  async #testPermissionRevokeAll() {
    await this.#test("Permissions: 全権限の一括取り消し (revokeAll)", () => {
      const testAppId = "eskit.test.perm.demo";
      System.permissions.grant(testAppId, "fs.read", true);
      System.permissions.grant(testAppId, "fs.write", true);

      System.permissions.revokeAll(testAppId);

      this.#assert(System.permissions.getPermissionState(testAppId, "fs.read") === "unprompted", "fs.read is not unprompted");
      this.#assert(System.permissions.getPermissionState(testAppId, "fs.write") === "unprompted", "fs.write is not unprompted");

      return "All permissions cleared";
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

