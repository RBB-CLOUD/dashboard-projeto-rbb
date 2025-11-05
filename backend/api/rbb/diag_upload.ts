import fs from "fs/promises";
import path from "path";
import { isOwner } from "../tools/guard";
import { paths } from "../tools/provider";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    const {
      owner_name,
      owner_pass,
      filename = "screenshot.png",
      data_base64,
      instrucao_proprietario,
    } = req.body || {};
    if (
      !isOwner({
        ownerName: owner_name,
        ownerPass: owner_pass,
        text: instrucao_proprietario,
      })
    )
      return res.status(401).json({ error: "Unauthorized" });
    if (!data_base64)
      return res.status(400).json({ error: "Missing data_base64" });

    await fs.mkdir(paths.uploadsDir(), { recursive: true });
    const safe = filename.replace(/[^a-z0-9_.-]/gi, "_");
    const id = Date.now().toString(36);
    const filePath = path.join(paths.uploadsDir(), `${id}_${safe}`);
    const raw = data_base64.replace(/^data:.*;base64,/, "");
    await fs.writeFile(filePath, Buffer.from(raw, "base64"));

    return res.status(201).json({ id, filename: safe, path: filePath });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
