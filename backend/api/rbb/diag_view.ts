import fs from "fs/promises";
import path from "path";
import { paths } from "../tools/provider";

export default async function handler(req: any, res: any) {
  try {
    const id = (req.query?.id || req.body?.id || "").toString();
    if (!id) return res.status(400).json({ error: "Missing id" });
    const list = await fs.readdir(paths.uploadsDir()).catch(() => []);
    const match = list.find((n) => n.startsWith(id + "_"));
    if (!match) return res.status(404).json({ error: "Not found" });

    const filePath = path.join(paths.uploadsDir(), match);
    const buf = await fs.readFile(filePath);
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(buf);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
