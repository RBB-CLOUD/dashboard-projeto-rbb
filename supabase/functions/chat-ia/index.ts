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

  let { mensagem, historico = [], imagem } = await req.json().catch(()=>({}));

  const msgs:any[] = [
    { role:"system", content:"Você é o Arquiteto IA do RBB (modo conversa apenas, PT-BR, direto)." },
    ...historico.slice(-8).map((h:any)=>({ role: h.tipo==="user"?"user":"assistant", content:h.texto }))
  ];
  if (imagem?.base64) {
    msgs.push({ role:"user", content:[
      { type:"text", text: mensagem || "Descreva a imagem." },
      { type:"image_url", image_url:{ url: imagem.base64 } }
    ]});
  } else {
    msgs.push({ role:"user", content: mensagem || "Olá" });
  }

  // OpenAI (REST)
  const model = imagem ? "gpt-4o" : "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{ "Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json" },
    body: JSON.stringify({ model, messages: msgs, temperature:0.7, max_tokens: imagem?1500:1000 })
  });
  const j = await r.json();
  if (!r.ok) return new Response(JSON.stringify({success:false,error:j?.error?.message||"OpenAI error"}),{status:500,headers:{"Access-Control-Allow-Origin":"*"}});

  const resposta = j.choices?.[0]?.message?.content ?? "";

  // responde já
  const out = new Response(JSON.stringify({ success:true, resposta, timestamp:new Date().toISOString() }),{
    headers:{ "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }
  });

  // grava no realtime (role compatível com seu CHECK)
  supabase.from("messages").insert([{ agent:"Arquiteto_IA", message:resposta, role:"agent" }]).catch(console.error);

  return out;
});

