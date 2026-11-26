import type { FotoGaleria } from './destinos'

// As galerias (até 6 fotos por destino, escolhidas pelo scripts/fotos.mjs) ficam em galerias.json.
// O arquivo é carregado sob demanda: só quem abre a página de um destino baixa as galerias.
let galerias: Promise<Record<string, FotoGaleria[]>> | null = null

export async function carregarGaleria(id: string): Promise<FotoGaleria[]> {
  galerias ??= import('./galerias.json').then((modulo) => modulo.default as Record<string, FotoGaleria[]>)
  return (await galerias)[id] ?? []
}
