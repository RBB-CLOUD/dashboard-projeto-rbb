import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

function isOwner({
  name,
  pass,
  text,
}: {
  name?: string;
  pass?: string;
  text?: string;
}) {
  const okName =
    (name || "").toUpperCase() === (process.env.OWNER_NAME || "").toUpperCase();
  const okPass = (pass || "") === (process.env.OWNER_PASSPHRASE || "");
  const t = (text || "").toUpperCase();
  const okText =
    t.includes("PROPRIETÁRIO") &&
    t.includes((process.env.OWNER_NAME || "").toUpperCase());
  return (okName && okPass) || okText;
}

async function call(path: string, body: any) {
  const mod = await import(`./${path}.ts`);
  const req: any = { method: "POST", body };
  const r: any = {
    _status: 200,
    _data: null,
    status(c: number) {
      this._status = c;
      return this;
    },
    json(d: any) {
      this._data = d;
      return this;
    },
    setHeader() {},
    send(d: any) {
      this._data = d;
      return this;
    },
  };
  await mod.default(req, r);
  return { status: r._status, data: r._data };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    const { text = "", owner_name, owner_pass } = req.body || {};
    const lower = text.toLowerCase();

    // 1) Guard proprietário
    const ownerOK = isOwner({ name: owner_name, pass: owner_pass, text });
    const confirmed =
      ownerOK &&
      (lower.includes("confirmo execução") ||
        lower.includes("confirmo execucao"));

    // 2) Intenções rápidas sem fila (resposta instantânea)
    if (lower.includes("gerar token")) {
      if (!ownerOK) return res.status(401).json({ error: "Unauthorized" });
      const ttl = Number(
        (text.match(/\b(\d+)\s*(min|minutos|h|horas)\b/) || [])[1] || 60,
      );
      const out = await call("tokens_create", {
        owner_name,
        owner_pass,
        name: "Painel",
        scope: "dashboard",
        ttl_minutes: ttl,
        instrucao_proprietario: text,
      });
      return res.status(out.status).json(out.data);
    }
    if (lower.includes("limpar cache")) {
      if (!ownerOK) return res.status(401).json({ error: "Unauthorized" });
      const hours = Number(
        (text.match(/\b(\d+)\s*(h|horas)\b/) || [])[1] || 12,
      );
      const out = await call("cache_clean", { owner_name, owner_pass, hours });
      return res.status(out.status).json(out.data);
    }

    // 3) Injetar botões no HTML (manda pro AgenteDashboard)
    if (
      lower.includes("inserir botão token") ||
      lower.includes("botão token")
    ) {
      const payload = {
        action: "edit",
        filePath: "dist/dashboard.html",
        oldString: "<!-- GEN_TOKEN_BTN -->",
        newString: `<form id="gen-token"><input name="owner_name" value="LUIS" required><input name="owner_pass" placeholder="OWNER_PASSPHRASE" required><input name="name" value="Painel" required><input name="scope" value="dashboard" required><input name="ttl_minutes" type="number" value="60" min="5" required><button type="submit">Gerar token</button></form><pre id="gen-out"></pre><script>document.getElementById('gen-token').onsubmit=async(e)=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target).entries());const r=await fetch('/api/rbb/tokens_create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();document.getElementById('gen-out').textContent=r.ok?('TOKEN: '+j.token+'\\nexpira: '+j.expires_at):('Erro: '+j.error);};</script>`,
      };
      await supabase
        .from("agentes_tarefas")
        .insert({
          agente: "RBB_AgenteDashboard",
          tipo: "edit",
          payload,
          status: "fila",
          prioridade: confirmed ? 100 : 10,
        });
      return res.json({ ok: true, queued: "RBB_AgenteDashboard" });
    }

    if (
      lower.includes("inserir botão limpar") ||
      lower.includes("botão limpar cache")
    ) {
      const payload = {
        action: "edit",
        filePath: "dist/dashboard.html",
        oldString: "<!-- CLEAR_CACHE_BTN -->",
        newString: `<button id="btn-clear">Limpar cache</button><script>document.getElementById('btn-clear').onclick=async()=>{const owner_pass=prompt('Senha do proprietário');const r=await fetch('/api/rbb/cache_clean',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner_name:'LUIS',owner_pass,hours:12})});const j=await r.json();alert(r.ok?'Cache limpo':'Erro: '+j.error);};</script>`,
      };
      await supabase
        .from("agentes_tarefas")
        .insert({
          agente: "RBB_AgenteDashboard",
          tipo: "edit",
          payload,
          status: "fila",
          prioridade: confirmed ? 100 : 10,
        });
      return res.json({ ok: true, queued: "RBB_AgenteDashboard" });
    }

    // 4) Qualquer outra ordem → fila no ComandoGeral (autônomo)
    await supabase.from("agentes_tarefas").insert({
      agente: "RBB_AgenteComandoGeral",
      tipo: "resposta_direta",
      payload: { instrucao_proprietario: text, owner_name, owner_pass },
      status: "fila",
      prioridade: confirmed ? 100 : 5,
    });
    return res.json({ ok: true, routed: "RBB_AgenteComandoGeral" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
