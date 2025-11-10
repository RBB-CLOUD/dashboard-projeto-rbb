<!-- use como arquivo .js normal -->
<script>
window.RBB_ENV = window.RBB_ENV || {};
// já está apontado na Vercel, mas garantimos fallback:
window.RBB_ENV.API_BASE = window.RBB_ENV.API_BASE || "https://tvxuaxirrwzycauwjzih.supabase.co/functions/v1";
/* Se quiser passar a ANON_KEY pelo HTML, setar:
   window.RBB_ENV.SUPABASE_ANON_KEY = "COLAR_A_ANON_KEY_AQUI (opcional)";
*/

window.RBB = {
  _headers() {
    const h = { "Content-Type": "application/json" };
    // Se a função exigir JWT e você quiser mandar o header:
    if (window.RBB_ENV.SUPABASE_ANON_KEY) {
      h.Authorization = "Bearer " + window.RBB_ENV.SUPABASE_ANON_KEY;
    }
    return h;
  },
  async post(path, body) {
    const url = `${window.RBB_ENV.API_BASE}${path}`;
    const r = await fetch(url, { method: "POST", headers: this._headers(), body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data: j };
  },
  chatIA(payload){ return this.post("/chat-ia", payload); },
  chatCentral(payload){ return this.post("/chat-central", payload); },
  deploy(){ return this.post("/deploy", {}); }
};
</script>
