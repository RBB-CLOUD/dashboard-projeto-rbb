import { createClient } from "@supabase/supabase-js";
import { newToken, hashToken, tokenPrefix } from "../tools/tokens";
import { isOwner } from "../tools/guard";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    const {
      owner_name,
      owner_pass,
      name = "PAT",
      scope = "default",
      ttl_minutes = 60,
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
    const raw = newToken("rbb");
    const hash = hashToken(raw);
    const prefix = tokenPrefix(raw);
    const expires = new Date(
      Date.now() + ttl_minutes * 60 * 1000,
    ).toISOString();
    const { error } = await supabase
      .from("rbb_tokens")
      .insert({
        name,
        scope,
        prefix,
        hash,
        created_by: owner_name || "OWNER",
        expires_at: expires,
      });
    if (error) throw new Error(error.message);
    return res
      .status(201)
      .json({
        token: raw,
        scope,
        expires_at: expires,
        note: "Guarde o token. Não será mostrado novamente.",
      });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
