import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Registro } from "./painel-data";

function senhaOk(senha: string) {
  const esperada = process.env["SITE_PASSWORD"];
  if (!esperada) return false;
  const a = createHash("sha256").update(senha, "utf8").digest();
  const b = createHash("sha256").update(esperada, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const listarRegistros = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const todos: Registro[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabaseAdmin
      .from("registros")
      .select("ano, promotor, comarca, valor, execucoes")
      .range(de, de + 999);
    if (error) throw new Error(error.message);
    todos.push(...(data ?? []).map((r) => ({ ...r, valor: Number(r.valor) })));
    if (!data || data.length < 1000) break;
  }
  return todos;
});

export const salvarRegistros = createServerFn({ method: "POST" })
  .inputValidator((d: { senha: string; registros: Registro[] }) => ({
    senha: String(d?.senha ?? "").slice(0, 200),
    registros: (Array.isArray(d?.registros) ? d.registros : []).slice(0, 50000).map((r) => ({
      ano: Number(r.ano) || 0,
      promotor: String(r.promotor ?? "").slice(0, 200),
      comarca: String(r.comarca ?? "").slice(0, 200),
      valor: Number(r.valor) || 0,
      execucoes: Math.round(Number(r.execucoes) || 1),
    })),
  }))
  .handler(async ({ data }) => {
    if (!senhaOk(data.senha)) throw new Error("Senha incorreta");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const del = await supabaseAdmin.from("registros").delete().not("id", "is", null);
    if (del.error) throw new Error(del.error.message);
    for (let i = 0; i < data.registros.length; i += 1000) {
      const { error } = await supabaseAdmin.from("registros").insert(data.registros.slice(i, i + 1000));
      if (error) throw new Error(error.message);
    }
    return { ok: true, total: data.registros.length };
  });
