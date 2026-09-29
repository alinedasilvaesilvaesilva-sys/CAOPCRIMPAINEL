import * as XLSX from "xlsx";
import type { Registro } from "./painel-data";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function numero(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[R$\s]/g, "");
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) ? n : 0;
}

export async function lerPlanilha(file: File): Promise<Registro[]> {
  const wb = XLSX.read(await file.arrayBuffer());
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
  return linhas
    .map((l) => {
      const get = (...nomes: string[]) => {
        const k = Object.keys(l).find((c) => nomes.some((n) => norm(c).includes(n)));
        return k ? l[k] : undefined;
      };
      return {
        ano: numero(get("ano")),
        promotor: String(get("promotor") ?? "").trim(),
        comarca: String(get("comarca") ?? "").trim(),
        valor: numero(get("valor")),
        execucoes: numero(get("execu")) || 1,
      };
    })
    .filter((r) => r.ano > 0 && r.promotor && r.comarca);
}
