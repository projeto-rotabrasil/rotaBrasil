// Atrações próximas de um destino.
// - Com VITE_OPENTRIPMAP_KEY definida: usa a OpenTripMap.
// - Sem chave (ou se ela falhar): usa a busca por coordenadas da Wikipédia, que não exige chave.

const OPENTRIPMAP_KEY = import.meta.env.VITE_OPENTRIPMAP_KEY as string | undefined

export interface AtracaoProxima {
  id: string
  nome: string
  /** Distância em metros */
  distancia?: number
  link?: string
}

export interface ResultadoAtracoes {
  atracoes: AtracaoProxima[]
  fonte: 'OpenTripMap' | 'Wikipédia'
}

interface LugarOpenTripMap {
  xid: string
  name: string
  dist?: number
}

async function buscarOpenTripMap(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<AtracaoProxima[]> {
  const params = new URLSearchParams({
    radius: '15000',
    lon: String(longitude),
    lat: String(latitude),
    rate: '2',
    limit: '8',
    format: 'json',
    apikey: OPENTRIPMAP_KEY ?? '',
  })

  const response = await fetch(`https://api.opentripmap.com/0.1/en/places/radius?${params}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`OpenTripMap respondeu ${response.status}`)
  }

  const lugares: LugarOpenTripMap[] = await response.json()

  return lugares
    .filter((lugar) => lugar.name)
    .map((lugar) => ({ id: lugar.xid, nome: lugar.name, distancia: lugar.dist }))
}

interface ArtigoWikipedia {
  pageid: number
  title: string
  dist: number
}

async function buscarWikipedia(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<AtracaoProxima[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${latitude}|${longitude}`,
    gsradius: '10000',
    gslimit: '12',
    format: 'json',
    origin: '*',
  })

  const response = await fetch(`https://pt.wikipedia.org/w/api.php?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Wikipédia respondeu ${response.status}`)
  }

  const dados: { query?: { geosearch?: ArtigoWikipedia[] } } = await response.json()

  return (dados.query?.geosearch ?? []).map((artigo) => ({
    id: String(artigo.pageid),
    nome: artigo.title,
    distancia: artigo.dist,
    link: `https://pt.wikipedia.org/?curid=${artigo.pageid}`,
  }))
}

// A busca por coordenadas da Wikipédia também devolve emissoras de rádio, associações,
// escolas etc. Esses termos são descartados para sobrar só o que interessa a quem viaja.
const NAO_TURISTICO =
  /^(FM|AM|TV|Rádio)\b|\b(Associação|Sindicato|Grupo|Escola|Colégio|Universidade|Faculdade|Câmara|Prefeitura|Secretaria|Supermercado|Hospital|Clínica|Cooperativa|Restaurante)\b|^Bar\b/i

function semRuido(atracoes: AtracaoProxima[], nomeDestino: string): AtracaoProxima[] {
  const normalizar = (texto: string) =>
    texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

  const nomeDestinoNormalizado = normalizar(nomeDestino)
  const vistos = new Set<string>()

  return atracoes.filter((atracao) => {
    const nome = normalizar(atracao.nome)

    // Evita listar o próprio destino como "atração próxima", repetidos e itens que não são turísticos
    if (nome === nomeDestinoNormalizado || vistos.has(nome) || NAO_TURISTICO.test(atracao.nome)) {
      return false
    }

    vistos.add(nome)
    return true
  })
}

export async function getAtracoesProximas(
  latitude: number,
  longitude: number,
  nomeDestino: string,
  signal?: AbortSignal
): Promise<ResultadoAtracoes> {
  if (OPENTRIPMAP_KEY) {
    try {
      const atracoes = await buscarOpenTripMap(latitude, longitude, signal)

      if (atracoes.length > 0) {
        return { atracoes: semRuido(atracoes, nomeDestino).slice(0, 6), fonte: 'OpenTripMap' }
      }
    } catch (error) {
      if (signal?.aborted) throw error
      console.warn('OpenTripMap indisponível, usando a Wikipédia:', error)
    }
  }

  const atracoes = await buscarWikipedia(latitude, longitude, signal)

  return { atracoes: semRuido(atracoes, nomeDestino).slice(0, 6), fonte: 'Wikipédia' }
}
