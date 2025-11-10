import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"*"}});
  if (req.method !== "POST") return new Response("Method not allowed",{status:405});

  const { mensagem, historico = [], imagem } = await req.json();

  // memória leve
  const { data:tarefas } = await supabase
    .from("agentes_tarefas")
    .select("mensagem_inicial,resposta,created_at")
    .order("created_at",{ascending:false})
    .limit(10);

  const { data:paginas } = await supabase
    .from("paginas_geradas")
    .select("titulo,path_name,created_at")
    .order("created_at",{ascending:false})
    .limit(5);

  let memoria = "MEMÓRIA:\n";
  tarefas?.slice(0,5).reverse().forEach(t=>{
    if(t.mensagem_inicial) memoria += `U:${t.mensagem_inicial}\n`;
    if(t.resposta)         memoria += `A:${t.resposta}\n`;
  });
  if (paginas?.length){
    memoria += "\nPÁGINAS:\n";
    paginas.forEach(p => memoria += `- ${p.titulo} (${p.path_name})\n`);
  }

  const sys = { role:"system", content:
`Você é o Arquiteto IA do RBB. ${memoria}
Retorne SEMPRE JSON.
- Conversa: {"tipo":"conversa","resposta":"..."}
- Executar: {"tipo":"executar","agente":"RBB_AgentePaginas|RBB_AgenteExecutor|RBB_AgenteEmail|RBB_AgenteGitHub","tipo_tarefa":"...","payload":{...},"mensagem":"..."}
`};

  const msgs:any[] = [sys, ...historico.slice(-8).map((h:any)=>({ role:h.tipo==="user"?"user":"assistant", content:h.texto }))];
  if (imagem?.url || imagem?.base64){
    const url = imagem.url ?? imagem.base64;
    msgs.push({ role:"user", content:[{type:"text",text: mensagem||"Descreva a imagem"},{type:"image_url",image_url:{url}}]});
  } else {
    msgs.push({ role:"user", content: mensagem || "Olá" });
  }

  const r = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{ "Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json" },
    body: JSON.stringify({ model: imagem?"gpt-4o":"gpt-4o-mini", messages: msgs, temperature:0.5, max_tokens: imagem?1500:800, response_format:{type:"json_object"} })
  });
  const j = await r.json();
  if (!r.ok) return new Response(JSON.stringify({tipo:"erro",error:j?.error?.message||"OpenAI error"}),{status:500,headers:{"Access-Control-Allow-Origin":"*"}});

  let out:any; try{ out = JSON.parse(j.choices?.[0]?.message?.content ?? "{}"); } catch { out = { tipo:"conversa", resposta:(j.choices?.[0]?.message?.content ?? "").trim() }; }

  if (out.tipo === "executar"){
    const { data:tarefa, error } = await supabase
      .from("agentes_tarefas")
      .insert({ agente: out.agente, tipo: out.tipo_tarefa, payload: out.payload, status:"fila", prioridade:100 })
      .select()
      .single();

    if (error || !tarefa)
      return new Response(JSON.stringify({ tipo:"conversa", resposta:"❌ Erro ao criar tarefa." }),{headers:{ "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }});

    return new Response(JSON.stringify({ tipo:"tarefa_criada", tarefa_id:tarefa.id, resposta: out.mensagem, execucao:true }),{
      headers:{ "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }
    });
  }

  return new Response(JSON.stringify({ tipo:"conversa", resposta: out.resposta ?? "", execucao:false }),{
    headers:{ "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }
  });
});
