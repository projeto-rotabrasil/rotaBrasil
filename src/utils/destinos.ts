import { destinos, type Categoria, type DestinoType } from '../data/destinos'
import { normalizar } from './texto'

/**
 * O campo `bioma` dos dados é texto livre ("Mata Atlântica e Litoral", "Costeiro / Dunas"...).
 * Cada bioma abaixo reúne os termos que o identificam nesse texto.
 */
export const BIOMAS = [
  { nome: 'Amazônia', termos: ['amazonia'] },
  { nome: 'Cerrado', termos: ['cerrado'] },
  { nome: 'Caatinga', termos: ['caatinga'] },
  { nome: 'Mata Atlântica', termos: ['mata atlantica'] },
  { nome: 'Pantanal', termos: ['pantanal'] },
  { nome: 'Litoral', termos: ['litoral', 'costeiro', 'dunas'] },
  { nome: 'Pampa e Campos', termos: ['pampa', 'campos gerais'] },
] as const

export function pertenceAoBioma(destino: DestinoType, nomeBioma: string): boolean {
  const bioma = BIOMAS.find((item) => item.nome === nomeBioma)
  if (!bioma) return false

  const texto = normalizar(destino.bioma)
  return bioma.termos.some((termo) => texto.includes(termo))
}

/** Todas as palavras da busca precisam aparecer em algum campo do destino. */
export function correspondeBusca(destino: DestinoType, busca: string): boolean {
  const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
  if (palavras.length === 0) return true

  const texto = normalizar(
    [
      destino.nome,
      destino.cidade,
      destino.estado,
      destino.regiao,
      destino.bioma,
      destino.descricao,
      destino.tipoViagem,
      ...destino.tags,
    ].join(' ')
  )

  return palavras.every((palavra) => texto.includes(palavra))
}

export function contarPorBioma(nomeBioma: string): number {
  return destinos.filter((destino) => pertenceAoBioma(destino, nomeBioma)).length
}

export function contarPorBusca(busca: string): number {
  return destinos.filter((destino) => correspondeBusca(destino, busca)).length
}

/** Atividades (tags) mais frequentes, usadas como filtros rápidos no Explorar. */
export function tagsMaisFrequentes(limite: number): string[] {
  const contagem = new Map<string, number>()

  for (const destino of destinos) {
    for (const tag of destino.tags) {
      contagem.set(tag, (contagem.get(tag) ?? 0) + 1)
    }
  }

  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, limite)
    .map(([tag]) => tag)
}

export function localizacaoTexto(destino: DestinoType): string {
  return destino.cidade ? `${destino.cidade}, ${destino.estado}` : `${destino.estado}, Brasil`
}

export function contarPorCategoria(categoria: Categoria): number {
  return destinos.filter((destino) => destino.categoria === categoria).length
}

/** Quantidade de destinos por estado (pelo nome completo do estado). */
export function contagemPorEstado(): Record<string, number> {
  const contagem: Record<string, number> = {}

  for (const destino of destinos) {
    contagem[destino.estado] = (contagem[destino.estado] ?? 0) + 1
  }

  return contagem
}

/** Destinos parecidos: mesma categoria e, de preferência, o mesmo estado ou a mesma região. */
export function destinosSimilares(destino: DestinoType, limite = 3): DestinoType[] {
  return destinos
    .filter((outro) => outro.id !== destino.id)
    .map((outro) => ({
      outro,
      pontos:
        (outro.categoria === destino.categoria ? 3 : 0) +
        (outro.estado === destino.estado ? 2 : 0) +
        (outro.regiao === destino.regiao ? 1 : 0) +
        (outro.imagemCredito || outro.imagem ? 0.5 : 0),
    }))
    .filter(({ pontos }) => pontos >= 3)
    .sort((a, b) => b.pontos - a.pontos || a.outro.nome.localeCompare(b.outro.nome, 'pt-BR'))
    .slice(0, limite)
    .map(({ outro }) => outro)
}

/**
 * Escolhe `quantidade` itens da lista e muda a escolha a cada dia, de forma que a vitrine
 * da Home não fique sempre igual (e o resultado é o mesmo para quem acessa no mesmo dia).
 */
export function sorteioDoDia<T>(lista: T[], quantidade: number, hoje: Date = new Date()): T[] {
  if (lista.length <= quantidade) return lista

  const dias = Math.floor(hoje.getTime() / 86_400_000)
  const inicio = (dias * quantidade) % lista.length

  return Array.from({ length: quantidade }, (_, i) => lista[(inicio + i) % lista.length])
}

export function temFoto(destino: DestinoType): boolean {
  return Boolean(destino.imagem)
}
