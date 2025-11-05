import { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { user_id, plan } = req.body;
  if (!user_id || !plan) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const expiresIn = plan === "demo" ? "30d" : "30d";
  const token = jwt.sign({ user_id, plan }, process.env.JWT_SECRET!, {
    expiresIn,
  });

  res.status(200).json({
    license_token: token,
    expires_in: expiresIn,
    status: "Licença criada com sucesso 🚀",
  });
}
