// backend/agents/tools/guard.ts
export function shouldDryRun(payload: any): boolean {
  return payload?.dry_run === true;
}
