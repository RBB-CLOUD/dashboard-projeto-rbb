export type Platform = "rapid" | "vercel";
export const PLATFORM: Platform = (process.env.PLATFORM as Platform) || "rapid";
export function isVercel() {
  return PLATFORM === "vercel";
}
export function isRapid() {
  return PLATFORM === "rapid";
}
export const paths = {
  pagesDir: () => "paginas_geradas",
  tmpDir: () => "tmp",
  logsDir: () => "logs",
  uploadsDir: () => "tmp/uploads",
};
