export interface FeriadoNacional {
  date: string
  name: string
  type: string
}

// Guardamos a promessa por ano para não repetir a chamada a cada destino visitado.
const cache = new Map<number, Promise<FeriadoNacional[]>>()

export function getFeriadosNacionais(ano: number): Promise<FeriadoNacional[]> {
  const emCache = cache.get(ano)
  if (emCache) return emCache

  const requisicao = fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Erro ao buscar feriados nacionais')
      }

      return response.json() as Promise<FeriadoNacional[]>
    })
    .catch((erro) => {
      // Não deixa a falha em cache: a próxima tentativa refaz a chamada.
      cache.delete(ano)
      throw erro
    })

  cache.set(ano, requisicao)
  return requisicao
}
