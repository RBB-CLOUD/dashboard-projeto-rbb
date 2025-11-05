export function isConfirmed(input?: string | boolean): boolean {
  if (typeof input === "boolean") return input;
  const s = (input || "").toString().toLowerCase();
  return s.includes("confirmo execução") || s.includes("confirmo execucao");
}
export function isOwner(params?: {
  ownerName?: string;
  ownerPass?: string;
  text?: string;
}) {
  const nameOK =
    (params?.ownerName || "").toUpperCase() ===
    (process.env.OWNER_NAME || "").toUpperCase();
  const passOK =
    (params?.ownerPass || "") === (process.env.OWNER_PASSPHRASE || "");
  const text = (params?.text || "").toUpperCase();
  const textOK =
    text.includes((process.env.OWNER_NAME || "").toUpperCase()) &&
    text.includes("PROPRIETÁRIO");
  return (nameOK && passOK) || textOK;
}
export function shouldDryRun(payload: any): boolean {
  if (
    isConfirmed(payload?.instrucao_proprietario) ||
    payload?.confirmed === true
  )
    return false;
  if (
    isOwner({
      ownerName: payload?.owner_name,
      ownerPass: payload?.owner_pass,
      text: payload?.instrucao_proprietario,
    })
  )
    return false;
  return payload?.dry_run === false ? false : true;
}
export function requireFields(obj: any, fields: string[]) {
  const miss = fields.filter((f) => !obj?.[f]);
  if (miss.length)
    throw new Error(`Campos obrigatórios faltando: ${miss.join(", ")}`);
}
