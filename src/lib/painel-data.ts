export type Registro = {
  ano: number;
  promotor: string;
  comarca: string;
  valor: number;
  execucoes: number;
};

export const PROMOTORES = [
  "Promotor A",
  "Promotor B",
  "Promotor C",
  "Promotor D",
  "Promotor E",
];

export const COMARCAS = [
  "Comarca 1",
  "Comarca 2",
  "Comarca 3",
  "Comarca 4",
  "Comarca 5",
  "Comarca 6",
  "Comarca 7",
  "Comarca 8",
];

const ANOS = [2023, 2024, 2025, 2026];

// Dados de exemplo (substituir pela base real do MPMA)
function gerar(): Registro[] {
  const registros: Registro[] = [];
  let semente = 7;
  const rand = () => {
    semente = (semente * 9301 + 49297) % 233280;
    return semente / 233280;
  };

  for (const ano of ANOS) {
    for (const comarca of COMARCAS) {
      for (const promotor of PROMOTORES) {
        if (rand() > 0.55) continue;
        registros.push({
          ano,
          comarca,
          promotor,
          valor: Math.round(rand() * 90000 + 1500),
          execucoes: Math.round(rand() * 6 + 1),
        });
      }
    }
  }
  return registros;
}

export const REGISTROS = gerar();
export const ANOS_DISPONIVEIS = ANOS;

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const moedaCurta = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toFixed(1)} Mi`
    : v >= 1000
      ? `R$ ${(v / 1000).toFixed(0)} mil`
      : `R$ ${v.toFixed(0)}`;
