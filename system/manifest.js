/**
 * ESKitManifest — アプリマニフェスト (`define.json`) のロードとバリデーション
 *
 * Manifest 型:
 *   { id, name, entry, icon, version, description, permissions[] }
 */
export default class ESKitManifest {
  static #REQUIRED = ["id", "name", "entry"];

  static #VALID_PERMISSIONS = new Set([
    "fs.read",
    "fs.write",
    "fs.read.all",
    "fs.write.all",
    "fs.shared",
    "notifications",
    "ipc",
    "network",
    "system.info",
    "clipboard",
    "user.info",
    "user.manage",
  ]);

  /**
   * アプリディレクトリから define.json を fetch してバリデーション済みの Manifest を返す。
   * @param {string} appDir  末尾スラッシュ付きのパス (例: "apps/myapp/")
   * @returns {Promise<Manifest>}
   */
  static async load(appDir) {
    const dir = appDir.endsWith("/") ? appDir : appDir + "/";
    const res = await fetch(dir + "define.json");
    if (!res.ok) {
      throw new Error(`[ESKitManifest] Failed to fetch ${dir}define.json: HTTP ${res.status}`);
    }
    const obj = await res.json();
    return ESKitManifest.validate(obj, dir);
  }

  /**
   * パースされたオブジェクトをバリデーションし、正規化した Manifest を返す。
   * @param {object} obj
   * @param {string} appDir  エラーメッセージ用のパス
   * @returns {Manifest}
   */
  static validate(obj, appDir = "(unknown)") {
    for (const key of ESKitManifest.#REQUIRED) {
      if (!obj[key]) {
        throw new Error(`[ESKitManifest] define.json is missing required field "${key}" (in ${appDir})`);
      }
    }

    const permissions = Array.isArray(obj.permissions) ? obj.permissions : [];
    const unknownPerms = permissions.filter((p) => !ESKitManifest.#VALID_PERMISSIONS.has(p));
    if (unknownPerms.length > 0) {
      console.warn(`[ESKitManifest] Unknown permissions in ${appDir}: ${unknownPerms.join(", ")}`);
    }

    return {
      id:          String(obj.id),
      name:        String(obj.name),
      entry:       String(obj.entry),
      icon:        obj.icon  ? String(obj.icon)  : null,
      version:     obj.version     ? String(obj.version)     : "0.0.1",
      description: obj.description ? String(obj.description) : "",
      permissions,
    };
  }
}
