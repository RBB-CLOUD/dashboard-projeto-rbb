// api/RBB_AgenteEmail.ts
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { shouldDryRun } from "./tools/guard";

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export async function executar(tarefa: any) {
  const { payload } = tarefa;
  const dry = shouldDryRun(payload);
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  try {
    if (dry) {
      const preview = {
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      };
      await supabase
        .from("agentes_execucoes")
        .insert({
          tarefa_id: tarefa.id,
          agente: "RBB_AgenteEmail",
          status: "ok",
          resultado: "Prévia de email (dry-run)",
          meta: preview,
        });
      return { success: true, preview };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    if (error) throw new Error(error.message);

    await supabase
      .from("agentes_execucoes")
      .insert({
        tarefa_id: tarefa.id,
        agente: "RBB_AgenteEmail",
        status: "ok",
        resultado: `Email enviado: ${data.id}`,
        meta: { emailId: data.id },
      });
    return { success: true, emailId: data.id };
  } catch (err: any) {
    await supabase
      .from("agentes_execucoes")
      .insert({
        tarefa_id: tarefa.id,
        agente: "RBB_AgenteEmail",
        status: "erro",
        resultado: err.message,
        meta: { error: err.message },
      });
    throw err;
  }
}
