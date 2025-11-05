import fs from "fs/promises";
import path from "path";
import { isOwner } from "../tools/guard";
import { paths } from "../tools/provider";

async function rmOlderThan(dir: string, ms: number) {
  const now = Date.now();
  const list = await fs.readdir(dir).catch(() => []);
  for (const name of list) {
    const p = path.join(dir, name);
    const st = await fs.stat(p).catch(() => null);
    if (!st) continue;
    const old = now - st.mtimeMs > ms;
    if (old) await fs.rm(p, { recursive: true, force: true });
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    const {
      owner_name,
      owner_pass,
      hours = 12,
      clearPages = false,
    } = req.body || {};
    if (!isOwner({ ownerName: owner_name, ownerPass: owner_pass }))
      return res.status(401).json({ error: "Unauthorized" });

    const ttl = Math.max(1, Number(hours)) * 60 * 60 * 1000;
    await fs.mkdir(paths.tmpDir(), { recursive: true });
    await fs.mkdir(paths.uploadsDir(), { recursive: true });
    await rmOlderThan(paths.tmpDir(), ttl);
    await rmOlderThan(paths.uploadsDir(), ttl);
    if (clearPages) await rmOlderThan(paths.pagesDir(), ttl);

    return res.json({
      ok: true,
      cleared: ["tmp", "uploads", clearPages ? "pages" : null].filter(Boolean),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
