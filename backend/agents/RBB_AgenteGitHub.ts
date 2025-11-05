// api/RBB_AgenteGitHub.ts
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { shouldDryRun, requireFields } from "./tools/guard";

const execAsync = promisify(exec);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface GitHubPayload {
  pasta_local: string;
  repositorio: string;
  branch: string;
  mensagem_commit: string;
  pasta_destino?: string;
}

async function log(
  mensagem: string,
  nivel: "info" | "erro" | "sucesso" = "info",
) {
  console.log(`[RBB_AgenteGitHub] ${mensagem}`);
  await supabase
    .from("logs_agentes")
    .insert({
      agente: "RBB_AgenteGitHub",
      mensagem,
      nivel,
      criado_em: new Date().toISOString(),
    });
}

async function executarGitHub(payload: GitHubPayload): Promise<void> {
  requireFields(payload, [
    "pasta_local",
    "repositorio",
    "branch",
    "mensagem_commit",
  ]);
  const dry = shouldDryRun(payload);
  await log(`🚀 Iniciando push para ${payload.repositorio} (dryRun=${dry})`);

  if (dry) {
    await log(`📝 Prévia de commit: ${payload.mensagem_commit}`);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN não configurado");

  const pastaLocalCompleta = path.join(process.cwd(), payload.pasta_local);
  const exists = await fs
    .access(pastaLocalCompleta)
    .then(() => true)
    .catch(() => false);
  if (!exists) throw new Error(`Pasta não encontrada: ${payload.pasta_local}`);

  const tempDir = path.join(process.cwd(), ".temp_git", Date.now().toString());
  await fs.mkdir(tempDir, { recursive: true });

  await log(`📥 Clonando: ${payload.repositorio}`);
  const repoUrl = `https://${token}@github.com/${payload.repositorio}.git`;
  await execAsync(
    `git clone --depth 1 --branch ${payload.branch} ${repoUrl} ${tempDir}`,
    { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } },
  );

  const destino = payload.pasta_destino || path.basename(payload.pasta_local);
  const destinoCompleto = path.join(tempDir, destino);

  await log(`📋 Copiando ${payload.pasta_local} -> ${destino}`);
  await fs.mkdir(path.dirname(destinoCompleto), { recursive: true });
  await execAsync(
    `cp -r ${pastaLocalCompleta}/* ${destinoCompleto}/ 2>/dev/null || true`,
  );

  await log(`💾 Commit: ${payload.mensagem_commit}`);
  await execAsync('git config user.email "rbb@replit.dev"', { cwd: tempDir });
  await execAsync('git config user.name "Radio Business Brasil"', {
    cwd: tempDir,
  });
  await execAsync("git add .", { cwd: tempDir });
  try {
    await execAsync(`git commit -m "${payload.mensagem_commit}"`, {
      cwd: tempDir,
    });
  } catch (e: any) {
    if (e.message.includes("nothing to commit")) {
      await log("⚠️ Nada para commitar");
      await fs.rm(tempDir, { recursive: true, force: true });
      return;
    }
    throw e;
  }

  await log(`🚀 Push: ${payload.repositorio}/${payload.branch}`);
  await execAsync(`git push origin ${payload.branch}`, { cwd: tempDir });
  await fs.rm(tempDir, { recursive: true, force: true });

  await log(`✅ Push concluído!`, "sucesso");
}

export async function executar(tarefa: any) {
  await executarGitHub(tarefa.payload);
}
