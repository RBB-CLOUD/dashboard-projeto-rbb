// api/RBB_AgentePaginas.ts
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { shouldDryRun } from "./tools/guard";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function executar(tarefa: any) {
  const { payload } = tarefa;
  let { pathName, path_name, html, descricao } = payload;
  const dry = shouldDryRun(payload);
  const finalPath = pathName || path_name;

  if (!html && descricao) {
    const prompt = `Você é dev web expert. Gere HTML COMPLETO para ${finalPath}. Requisitos: hero, responsivo, SEO, CSS inline, sem libs externas. Retorne apenas HTML.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Gere somente HTML válido e limpo." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });
    html = completion.choices[0].message.content || "";
  }
  if (!html) throw new Error("HTML não fornecido e não foi possível gerar");

  if (dry) {
    await supabase.from("agentes_execucoes").insert({
      tarefa_id: tarefa.id,
      agente: "RBB_AgentePaginas",
      status: "ok",
      resultado: `Página gerada (preview): ${finalPath}`,
      meta: { preview: true, htmlSize: html.length },
    });
    return { success: true, preview: true, htmlSize: html.length };
  }

  const { data, error } = await supabase
    .from("paginas_geradas")
    .upsert({ path_name: finalPath, html }, { onConflict: "path_name" })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const paginasDir = path.join(process.cwd(), "paginas_geradas");
  if (!fs.existsSync(paginasDir)) fs.mkdirSync(paginasDir, { recursive: true });
  const fileName =
    (finalPath.startsWith("/") ? finalPath.slice(1) : finalPath).replace(
      /[^a-z0-9-_]/gi,
      "-",
    ) + ".html";
  const filePath = path.join(paginasDir, fileName);
  fs.writeFileSync(filePath, html, "utf-8");

  await supabase.from("agentes_execucoes").insert({
    tarefa_id: tarefa.id,
    agente: "RBB_AgentePaginas",
    status: "ok",
    resultado: `Página gerada: ${finalPath} → ${fileName}`,
    meta: { pageId: data.id, pathName: finalPath, filePath: fileName },
  });
  return {
    success: true,
    page: data,
    filePath: fileName,
    htmlSize: html.length,
  };
}
