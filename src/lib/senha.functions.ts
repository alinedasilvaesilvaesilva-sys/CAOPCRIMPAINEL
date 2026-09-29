import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

export const verificarSenha = createServerFn({ method: "POST" })
  .inputValidator((data: { senha: string }) => ({ senha: String(data?.senha ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const esperada = process.env["SITE_PASSWORD"];
    if (!esperada) return { ok: false };
    const a = createHash("sha256").update(data.senha, "utf8").digest();
    const b = createHash("sha256").update(esperada, "utf8").digest();
    return { ok: timingSafeEqual(a, b) };
  });
