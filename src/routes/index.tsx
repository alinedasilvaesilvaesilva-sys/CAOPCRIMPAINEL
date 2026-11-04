import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { verificarSenha } from "@/lib/senha.functions";
import { lerPlanilha } from "@/lib/planilha";
import { listarRegistros, salvarRegistros } from "@/lib/registros.functions";
import type { Registro } from "@/lib/painel-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RotateCcw, Upload, Lock, Unlock } from "lucide-react";
import logo from "@/assets/logo-mpma.jpg.asset.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {

  moeda,
  moedaCurta,
} from "@/lib/painel-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel BI | Execução de Pena de Multa - MPMA" },
      {
        name: "description",
        content:
          "Painel interativo de acompanhamento das execuções de pena de multa das Promotorias de Justiça do MPMA, por ano, promotor e comarca.",
      },
      { property: "og:title", content: "Painel BI | Execução de Pena de Multa - MPMA" },
      {
        property: "og:description",
        content:
          "Acompanhe valores executados e número de execuções por ano, promotor e comarca.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Painel,
});

const TODOS = "Todos";

function Filtro({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: (string | number)[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3 shadow-[var(--shadow-panel)]">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-secondary/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={String(o)} value={String(o)}>
              {String(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Painel() {
  const [ano, setAno] = useState(TODOS);
  const [promotor, setPromotor] = useState(TODOS);
  const [comarca, setComarca] = useState(TODOS);
  const [comarcaFoco, setComarcaFoco] = useState<string | null>(null);

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [temPlanilha, setTemPlanilha] = useState(false);
  const [liberado, setLiberado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const checar = useServerFn(verificarSenha);

  const listar = useServerFn(listarRegistros);
  const salvar = useServerFn(salvarRegistros);
  const [senhaUsada, setSenhaUsada] = useState("");

  useEffect(() => {
    listar()
      .then((r) => {
        setRegistros(r);
        setTemPlanilha(r.length > 0);
      })
      .catch(() => {});
  }, [listar]);

  const ANOS_DISPONIVEIS = useMemo(() => [...new Set(registros.map((r) => r.ano))].sort(), [registros]);
  const PROMOTORES = useMemo(() => [...new Set(registros.map((r) => r.promotor))].sort(), [registros]);
  const COMARCAS = useMemo(() => [...new Set(registros.map((r) => r.comarca))].sort(), [registros]);

  const enviarPlanilha = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const novos = await lerPlanilha(file);
      if (!novos.length) {
        toast.error("Não encontrei linhas válidas. Use colunas: Ano, Promotor, Comarca, Valor, Execuções.");
        return;
      }
      await salvar({ data: { senha: senhaUsada, registros: novos } });
      setRegistros(novos);
      setTemPlanilha(true);
      limpar();
      toast.success(`${novos.length} registros carregados.`);
    } catch {
      toast.error("Não foi possível ler a planilha.");
    }
  };

  const trancar = () => setLiberado(false);

  const destrancar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok } = await checar({ data: { senha } });
    if (ok) {
      setLiberado(true);
      setSenhaUsada(senha);
      setAberto(false);
      setSenha("");
      setErro(false);
    } else setErro(true);
  };

  const dados = useMemo(
    () =>
      registros.filter(
        (r) =>
          (ano === TODOS || String(r.ano) === ano) &&
          (promotor === TODOS || r.promotor === promotor) &&
          (comarca === TODOS || r.comarca === comarca),
      ),
    [registros, ano, promotor, comarca],
  );

  const totalValor = dados.reduce((s, r) => s + r.valor, 0);
  const totalExec = dados.reduce((s, r) => s + r.execucoes, 0);

  const porAno = ANOS_DISPONIVEIS.map((a) => {
    const sub = dados.filter((r) => r.ano === a);
    return {
      ano: String(a),
      valor: sub.reduce((s, r) => s + r.valor, 0),
      execucoes: sub.reduce((s, r) => s + r.execucoes, 0),
    };
  });

  const porComarca = COMARCAS.map((c) => ({
    comarca: c,
    valor: dados.filter((r) => r.comarca === c).reduce((s, r) => s + r.valor, 0),
  }))
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const limpar = () => {
    setAno(TODOS);
    setPromotor(TODOS);
    setComarca(TODOS);
  };


  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <Toaster />
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-card/40 shadow-[var(--shadow-panel)]">
        <header className="bg-brand px-6 py-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Execução de Pena de Multa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel de acompanhamento — Ministério Público do Estado do Maranhão
          </p>
        </header>

        <div className="grid gap-4 p-4 md:p-6 lg:grid-cols-[230px_1fr_300px]">
          {/* Filtros */}
          <aside className="space-y-4">
            <div className="rounded-lg bg-card p-3">
              <img src={logo.url} alt="MPMA CAO-Crim" className="w-full rounded" />
            </div>
            <Filtro label="Ano" value={ano} options={ANOS_DISPONIVEIS} onChange={setAno} />
            <Filtro
              label="Promotor"
              value={promotor}
              options={PROMOTORES}
              onChange={setPromotor}
            />
            <Filtro
              label="Comarca"
              value={comarca}
              options={COMARCAS}
              onChange={setComarca}
            />
            <Button variant="secondary" className="w-full gap-2" onClick={limpar}>
              <RotateCcw className="size-4" /> Limpar filtros
            </Button>
            <div className="rounded-lg border border-border bg-card/70 p-3">
              <button
                type="button"
                onClick={() => (liberado ? trancar() : setAberto((v) => !v))}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {liberado ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                  Área restrita — Equipe CAO Criminal
                </span>
                <span className="text-xs text-muted-foreground">
                  {liberado ? "Fechar" : aberto ? "Cancelar" : "Abrir"}
                </span>
              </button>
              {!liberado && aberto && (
                <form onSubmit={destrancar} className="mt-3 space-y-2">
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Senha"
                    autoFocus
                  />
                  {erro && <p className="text-xs text-destructive">Senha incorreta.</p>}
                  <Button type="submit" size="sm" className="w-full">Entrar</Button>
                </form>
              )}
              {liberado && (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={enviarPlanilha}
                  />
                  <Button className="mt-3 w-full gap-2" onClick={() => inputRef.current?.click()}>
                    <Upload className="size-4" /> Enviar planilha
                  </Button>
                </>
              )}
            </div>
            <p className="rounded-md bg-secondary/50 px-3 py-2 text-[11px] text-muted-foreground">
              {temPlanilha
                ? "Dados da planilha enviada."
                : "Nenhum dado carregado ainda."}
            </p>
          </aside>

          {/* Gráficos centrais */}
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Kpi titulo="Número de Execuções" valor={String(totalExec)} />
              <Kpi titulo="Valor Executado" valor={moeda(totalValor)} />
            </div>

            <Painelzinho titulo="Valor de Execução de Pena de Multa por Ano">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porAno}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="ano" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    tickFormatter={moedaCurta}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    width={70}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [moeda(v), "Valor"]}
                  />
                  <Bar dataKey="valor" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Painelzinho>

            <Painelzinho titulo="Número de Execuções Realizadas">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porAno}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="ano" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} width={40} />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [v, "Execuções"]}
                  />
                  <Bar dataKey="execucoes" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Painelzinho>
          </section>

          {/* Valor por comarca */}
          <Painelzinho titulo="Valor por Comarca">
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {porComarca.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sem dados para os filtros selecionados.
                </p>
              )}
              <ResponsiveContainer width="100%" height={Math.max(160, porComarca.length * 36)}>
                <BarChart data={porComarca} layout="vertical" margin={{ left: 8, right: 60 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="comarca"
                    width={90}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [moeda(v), "Valor"]}
                  />
                  <Bar
                    dataKey="valor"
                    radius={[0, 6, 6, 0]}
                    onClick={(d: { comarca?: string }) =>
                      setComarcaFoco(d?.comarca === comarcaFoco ? null : (d?.comarca ?? null))
                    }
                  >
                    {porComarca.map((c) => (
                      <Cell
                        key={c.comarca}
                        fill={
                          comarcaFoco === c.comarca ? "var(--chart-3)" : "var(--chart-1)"
                        }
                        cursor="pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Painelzinho>
        </div>
      </div>
    </main>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
} as const;

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card className="gap-1 border-border bg-card p-4">
      <p className="text-2xl font-bold text-foreground">{valor}</p>
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
    </Card>
  );
}

function Painelzinho({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card p-4">
      <h2 className="mb-3 text-center text-sm font-semibold text-foreground">{titulo}</h2>
      {children}
    </Card>
  );
}
