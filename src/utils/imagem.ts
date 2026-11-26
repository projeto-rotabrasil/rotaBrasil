// As fotos vêm da Wikimedia Commons. Existem dois formatos de endereço:
//  - miniatura: .../commons/thumb/a/ab/Arquivo.jpg/960px-Arquivo.jpg
//  - original:  .../commons/a/ab/Arquivo.jpg   (pode ter vários MB: sempre preferimos a miniatura)
// A Wikimedia só serve com facilidade alguns tamanhos "padrão"; usamos só esses.

// A API da Commons devolve miniaturas em upload.wikimedia.org ou thumb.wikimedia.org (mesmo formato).
const MINIATURA = /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+)\/\d+px-([^/?#]+)(?:\?.*)?$/
const ORIGINAL = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(?!thumb\/)([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png))(?:\?.*)?$/i

const LARGURAS_PADRAO = [500, 960, 1280, 1920]

export function ehWikimedia(url: string): boolean {
  return MINIATURA.test(url) || ORIGINAL.test(url)
}

/** Endereço da miniatura na largura pedida. Devolve a própria URL se ela não for da Wikimedia. */
export function emLargura(url: string, largura: number): string {
  const miniatura = url.match(MINIATURA)
  if (miniatura) return `${miniatura[1]}/${largura}px-${miniatura[2]}`

  const original = url.match(ORIGINAL)
  if (original) {
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${original[1]}/${original[2]}/${largura}px-${original[2]}`
  }

  return url
}

/**
 * Monta o srcset com as larguras padrão que não passam do tamanho do arquivo original
 * (pedir uma miniatura maior que o original dá erro na Wikimedia).
 */
export function srcSetWikimedia(url: string, larguraOriginal?: number): string | undefined {
  if (!ehWikimedia(url)) return undefined

  const limite = larguraOriginal ?? 960
  const larguras = LARGURAS_PADRAO.filter((largura) => largura <= limite)

  return larguras.length > 1
    ? larguras.map((largura) => `${emLargura(url, largura)} ${largura}w`).join(', ')
    : undefined
}

/** Maior largura padrão permitida para o arquivo, até o teto informado. */
export function larguraPermitida(teto: number, larguraOriginal?: number): number {
  const limite = Math.min(teto, larguraOriginal ?? 960)
  return [...LARGURAS_PADRAO].reverse().find((largura) => largura <= limite) ?? LARGURAS_PADRAO[0]
}

/**
 * Para <img> que pedem uma miniatura: se ela falhar (tamanho que não existe, limite de requisições),
 * volta para o endereço original da foto em vez de deixar a imagem quebrada.
 */
export function aoFalharMiniatura(original: string) {
  return (evento: { currentTarget: HTMLImageElement }) => {
    const img = evento.currentTarget
    if (img.src === original) return

    img.removeAttribute('srcset')
    img.src = original
  }
}
