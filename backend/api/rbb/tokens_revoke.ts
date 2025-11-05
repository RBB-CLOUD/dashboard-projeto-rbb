import { createClient } from "@supabase/supabase-js";
import { hashToken } from "../tools/tokens";
import { isOwner } from "../tools/guard";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    const { owner_name, owner_pass, token } = req.body || {};
    if (!isOwner({ ownerName: owner_name, ownerPass: owner_pass }))
      return res.status(401).json({ error: "Unauthorized" });
    const { error } = await supabase
      .from("rbb_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("hash", hashToken(token));
    if (error) throw new Error(error.message);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
