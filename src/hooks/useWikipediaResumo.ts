import { useEffect, useState } from 'react'

export interface ResumoWikipedia {
  texto: string
  url: string
}

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; resumo: ResumoWikipedia }

// Uma promessa por artigo: visitar o mesmo destino de novo não repete a chamada.
const cache = new Map<string, Promise<ResumoWikipedia | null>>()

const LIMITE_CARACTERES = 700

// O começo dos artigos sobre cidades traz dados administrativos (população, latitude...),
// que não ajudam quem está planejando uma viagem. Essas frases são puladas.
const FRASE_ESTATISTICA =
  /\b(latitude|longitude|habitantes|popula[cç][aã]o|altitude m[eé]dia|densidade|km²|IBGE|censo|\bIDH\b|\bPIB\b)\b/i

/** Monta um texto curto e útil a partir da introdução do artigo (cortando em fim de frase). */
function montarResumo(introducao: string): string | null {
  const limpo = introducao
    .replace(/\s*\((?:AFI|IPA|pronúncia|em inglês|em espanhol)[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const frases = limpo
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“(])/)
    .filter((frase) => !FRASE_ESTATISTICA.test(frase))

  let texto = ''

  for (const frase of frases) {
    if (texto && (texto + ' ' + frase).length > LIMITE_CARACTERES) break
    texto = texto ? `${texto} ${frase}` : frase
  }

  return texto.length >= 100 ? texto : null
}

function buscarResumo(titulo: string): Promise<ResumoWikipedia | null> {
  const emCache = cache.get(titulo)
  if (emCache) return emCache

  const parametros = new URLSearchParams({
    action: 'query',
    prop: 'extracts|info|pageprops',
    exintro: '1',
    explaintext: '1',
    inprop: 'url',
    ppprop: 'disambiguation',
    titles: titulo,
    redirects: '1',
    format: 'json',
    origin: '*',
  })

  const requisicao = fetch(`https://pt.wikipedia.org/w/api.php?${parametros}`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Wikipédia respondeu ${response.status}`)

      const dados: {
        query?: {
          pages?: Record<
            string,
            {
              missing?: string
              extract?: string
              fullurl?: string
              pageprops?: Record<string, string>
            }
          >
        }
      } = await response.json()

      const pagina = Object.values(dados.query?.pages ?? {})[0]
      if (!pagina || pagina.missing !== undefined || pagina.pageprops?.disambiguation !== undefined) return null

      const texto = pagina.extract ? montarResumo(pagina.extract) : null
      if (!texto) return null

      return {
        texto,
        url: pagina.fullurl ?? `https://pt.wikipedia.org/wiki/${encodeURIComponent(titulo.replace(/ /g, '_'))}`,
      }
    })
    .catch((erro) => {
      cache.delete(titulo)
      throw erro
    })

  cache.set(titulo, requisicao)
  return requisicao
}

/**
 * Resumo do artigo da Wikipédia (texto sob licença CC BY-SA 4.0: sempre mostrar a fonte e o link).
 * Fica em "erro" quando não há artigo ou o texto não é aproveitável.
 */
export function useWikipediaResumo(titulo?: string) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  useEffect(() => {
    if (!titulo) return

    let ativo = true
    setEstado({ status: 'carregando' })

    buscarResumo(titulo)
      .then((resumo) => {
        if (ativo) setEstado(resumo ? { status: 'ok', resumo } : { status: 'erro' })
      })
      .catch(() => {
        if (ativo) setEstado({ status: 'erro' })
      })

    return () => {
      ativo = false
    }
  }, [titulo])

  if (!titulo) return { status: 'erro' as const }
  return estado
}
