import fs from "fs/promises";
import { exec as _exec } from "child_process";
import { promisify } from "util";
import { paths } from "./provider";
const exec = promisify(_exec);

const MUST = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "RESEND_API_KEY",
  "GITHUB_TOKEN",
  "OWNER_NAME",
  "OWNER_PASSPHRASE",
];

export async function selfCheck(ping: string[] = ["https://api.github.com"]) {
  const miss = MUST.filter((k) => !process.env[k]);
  await fs.mkdir(paths.tmpDir(), { recursive: true });
  await fs.mkdir(paths.logsDir(), { recursive: true });
  await fs.mkdir(paths.uploadsDir(), { recursive: true });
  for (const u of ping) {
    try {
      await exec(`curl -s -o /dev/null -w "%{http_code}" "${u}"`);
    } catch {}
  }
  return { missingEnv: miss };
}
