import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res
    .status(200)
    .json({ status: "Servidor ativo 🚀", timestamp: new Date().toISOString() });
}