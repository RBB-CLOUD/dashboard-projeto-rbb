// api/RBB_AgenteExecutor.ts
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { shouldDryRun, requireFields } from "./tools/guard";

const execAsync = promisify(exec);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export async function executar(tarefa: any) {
  const { payload } = tarefa;
  requireFields(payload, ["language", "code"]);
  const { language, code, args = [] } = payload;
  const dry = shouldDryRun(payload);

  try {
    if (dry) {
      await supabase
        .from("agentes_execucoes")
        .insert({
          tarefa_id: tarefa.id,
          agente: "RBB_AgenteExecutor",
          status: "ok",
          resultado: "Prévia de execução (dry-run)",
          meta: { language, size: code.length },
        });
      return { success: true, preview: true, language, size: code.length };
    }

    let result;
    if (language === "python") result = await executarPython(code, args);
    else if (language === "node" || language === "javascript")
      result = await executarNode(code, args);
    else if (language === "java") result = await executarJava(code, args);
    else throw new Error(`Linguagem não suportada: ${language}`);

    await supabase
      .from("agentes_execucoes")
      .insert({
        tarefa_id: tarefa.id,
        agente: "RBB_AgenteExecutor",
        status: "ok",
        resultado: `Código ${language} executado`,
        meta: { language, output: result.stdout, stderr: result.stderr },
      });
    return { success: true, output: result.stdout, stderr: result.stderr };
  } catch (err: any) {
    await supabase
      .from("agentes_execucoes")
      .insert({
        tarefa_id: tarefa.id,
        agente: "RBB_AgenteExecutor",
        status: "erro",
        resultado: err.message,
        meta: { error: err.message },
      });
    throw err;
  }
}

async function executarPython(code: string, args: string[]) {
  const tmpFile = `/tmp/exec_${Date.now()}.py`;
  await fs.writeFile(tmpFile, code);
  try {
    const { stdout, stderr } = await execAsync(
      `python3 ${tmpFile} ${args.join(" ")}`,
    );
    return { stdout, stderr };
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}
async function executarNode(code: string, args: string[]) {
  const tmpFile = `/tmp/exec_${Date.now()}.js`;
  await fs.writeFile(tmpFile, code);
  try {
    const { stdout, stderr } = await execAsync(
      `node ${tmpFile} ${args.join(" ")}`,
    );
    return { stdout, stderr };
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}
async function executarJava(code: string, args: string[]) {
  const className = code.match(/public\s+class\s+(\w+)/)?.[1] || "Main";
  const tmpDir = `/tmp/java_${Date.now()}`;
  const tmpFile = path.join(tmpDir, `${className}.java`);
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(tmpFile, code);
  try {
    await execAsync(`javac ${tmpFile}`, { cwd: tmpDir });
    const { stdout, stderr } = await execAsync(
      `java ${className} ${args.join(" ")}`,
      { cwd: tmpDir },
    );
    return { stdout, stderr };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
