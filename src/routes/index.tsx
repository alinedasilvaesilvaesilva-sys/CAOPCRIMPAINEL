import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Scale, RotateCcw } from "lucide-react";
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
  ANOS_DISPONIVEIS,
  COMARCAS,
  PROMOTORES,
  REGISTROS,
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

  const dados = useMemo(
    () =>
      REGISTROS.filter(
        (r) =>
          (ano === TODOS || String(r.ano) === ano) &&
          (promotor === TODOS || r.promotor === promotor) &&
          (comarca === TODOS || r.comarca === comarca),
      ),
    [ano, promotor, comarca],
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
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/70 p-3">
              <Scale className="size-8 shrink-0 text-foreground" />
              <div className="text-[11px] leading-tight text-muted-foreground">
                <p className="font-semibold text-foreground">MINISTÉRIO PÚBLICO</p>
                <p>Estado do Maranhão</p>
                <p>Procuradoria Geral de Justiça</p>
              </div>
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
            <p className="rounded-md bg-secondary/50 px-3 py-2 text-[11px] text-muted-foreground">
              Dados de exemplo — aguardando base oficial.
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
