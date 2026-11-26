export interface RegiaoIBGE {
  id: number
  sigla: string
  nome: string
}

export interface EstadoIBGE {
  id: number
  sigla: string
  nome: string
  regiao: RegiaoIBGE
}

const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'

// Regiões e estados quase nunca mudam: uma chamada por sessão é suficiente.
function comCache<T>(carregar: () => Promise<T>): () => Promise<T> {
  let promessa: Promise<T> | null = null

  return () => {
    if (!promessa) {
      promessa = carregar().catch((erro) => {
        promessa = null
        throw erro
      })
    }

    return promessa
  }
}

async function buscar<T>(caminho: string, mensagemErro: string): Promise<T> {
  const response = await fetch(`${IBGE_BASE_URL}${caminho}`)

  if (!response.ok) {
    throw new Error(mensagemErro)
  }

  return response.json()
}

export const getRegioes = comCache(() =>
  buscar<RegiaoIBGE[]>('/regioes', 'Erro ao buscar regiões do IBGE')
)

export const getEstados = comCache(() =>
  buscar<EstadoIBGE[]>('/estados?orderBy=nome', 'Erro ao buscar estados do IBGE')
)
