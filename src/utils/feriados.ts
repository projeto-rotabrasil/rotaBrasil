import type { FeriadoNacional } from '../services/brasilApiService'

export type TipoPeriodo = 'feriadao' | 'emenda' | 'fim-de-semana' | 'meio-de-semana'

export interface PeriodoFeriado {
  chave: string
  nome: string
  /** Primeiro e último dia de feriado do período */
  inicio: Date
  fim: Date
  tipo: TipoPeriodo
  /** Dias seguidos de folga (contando fins de semana e emenda) */
  diasSeguidos?: number
  /** Dias úteis que precisam ser emendados (0 quando não precisa) */
  diasDeEmenda: number
  resumo: string
}

const DIA_MS = 86_400_000

function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

function somarDias(data: Date, dias: number): Date {
  const copia = new Date(data)
  copia.setDate(copia.getDate() + dias)
  return copia
}

function diferencaEmDias(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DIA_MS)
}

function ehFimDeSemana(data: Date): boolean {
  const dia = data.getDay()
  return dia === 0 || dia === 6
}

/** Estende o período por todos os sábados e domingos colados nele. */
function estenderPelosFinsDeSemana(inicio: Date, fim: Date): { inicio: Date; fim: Date } {
  let novoInicio = inicio
  let novoFim = fim

  while (ehFimDeSemana(somarDias(novoInicio, -1))) novoInicio = somarDias(novoInicio, -1)
  while (ehFimDeSemana(somarDias(novoFim, 1))) novoFim = somarDias(novoFim, 1)

  return { inicio: novoInicio, fim: novoFim }
}

/**
 * Melhor "emenda": quantos dias úteis (no máximo 2) é preciso tirar antes ou depois do
 * feriado para encostar no fim de semana, e quantos dias seguidos isso rende.
 */
function melhorEmenda(inicio: Date, fim: Date): { ponte: number; dias: number } | null {
  const opcoes: { ponte: number; dias: number }[] = []

  // Emendar ANTES do feriado
  let ponte = 0
  let novoInicio = inicio
  while (!ehFimDeSemana(somarDias(novoInicio, -1)) && ponte <= 2) {
    novoInicio = somarDias(novoInicio, -1)
    ponte++
  }
  if (ponte >= 1 && ponte <= 2) {
    const estendido = estenderPelosFinsDeSemana(novoInicio, fim)
    opcoes.push({ ponte, dias: diferencaEmDias(estendido.inicio, estendido.fim) + 1 })
  }

  // Emendar DEPOIS do feriado
  ponte = 0
  let novoFim = fim
  while (!ehFimDeSemana(somarDias(novoFim, 1)) && ponte <= 2) {
    novoFim = somarDias(novoFim, 1)
    ponte++
  }
  if (ponte >= 1 && ponte <= 2) {
    const estendido = estenderPelosFinsDeSemana(inicio, novoFim)
    opcoes.push({ ponte, dias: diferencaEmDias(estendido.inicio, estendido.fim) + 1 })
  }

  if (opcoes.length === 0) return null

  // Mais dias seguidos primeiro; em empate, a emenda mais curta.
  opcoes.sort((a, b) => b.dias - a.dias || a.ponte - b.ponte)
  return opcoes[0].dias >= 4 ? opcoes[0] : null
}

function montarPeriodo(bloco: { data: Date; nome: string }[]): PeriodoFeriado {
  const inicio = bloco[0].data
  const fim = bloco[bloco.length - 1].data
  const nome = [...new Set(bloco.map((item) => item.nome))].join(' + ')
  const chave = `${inicio.getTime()}-${nome}`

  if (bloco.every((item) => ehFimDeSemana(item.data))) {
    return {
      chave,
      nome,
      inicio,
      fim,
      tipo: 'fim-de-semana',
      diasDeEmenda: 0,
      resumo: 'Cai no fim de semana: sem folga extra.',
    }
  }

  const estendido = estenderPelosFinsDeSemana(inicio, fim)
  const diasSeguidos = diferencaEmDias(estendido.inicio, estendido.fim) + 1

  if (diasSeguidos >= 3) {
    return {
      chave,
      nome,
      inicio,
      fim,
      tipo: 'feriadao',
      diasSeguidos,
      diasDeEmenda: 0,
      resumo: `${diasSeguidos} dias seguidos de folga, sem tirar dia nenhum.`,
    }
  }

  const emenda = melhorEmenda(inicio, fim)

  if (emenda) {
    return {
      chave,
      nome,
      inicio,
      fim,
      tipo: 'emenda',
      diasSeguidos: emenda.dias,
      diasDeEmenda: emenda.ponte,
      resumo: `Emendando ${emenda.ponte} ${emenda.ponte === 1 ? 'dia' : 'dias'}, são ${emenda.dias} dias seguidos.`,
    }
  }

  return {
    chave,
    nome,
    inicio,
    fim,
    tipo: 'meio-de-semana',
    diasDeEmenda: 0,
    resumo: 'Cai no meio da semana: pouca vantagem para viajar.',
  }
}

/**
 * Agrupa feriados consecutivos (como o Carnaval) e diz, para cada período futuro,
 * se ele rende um feriadão, se vale emendar ou se não ajuda no planejamento.
 */
export function calcularPeriodos(
  feriados: FeriadoNacional[],
  hoje: Date = new Date()
): PeriodoFeriado[] {
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

  const ordenados = feriados
    .map((feriado) => ({ data: paraData(feriado.date), nome: feriado.name }))
    .sort((a, b) => a.data.getTime() - b.data.getTime())

  const blocos: { data: Date; nome: string }[][] = []

  for (const feriado of ordenados) {
    const ultimoBloco = blocos[blocos.length - 1]
    const ultimo = ultimoBloco?.[ultimoBloco.length - 1]
    const diferenca = ultimo ? diferencaEmDias(ultimo.data, feriado.data) : null

    if (ultimoBloco && diferenca !== null && diferenca <= 1) {
      ultimoBloco.push(feriado)
    } else {
      blocos.push([feriado])
    }
  }

  return blocos.map(montarPeriodo).filter((periodo) => periodo.fim >= inicioDeHoje)
}
