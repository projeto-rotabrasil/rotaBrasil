import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { ehWikimedia, emLargura, srcSetWikimedia } from '../utils/imagem'

interface ImagemDestinoProps {
  src: string
  alt: string
  /** Tamanho e formato da caixa (ex.: "aspect-[4/3] w-full rounded-3xl"). A foto preenche a caixa toda. */
  className?: string
  /** Imagem principal da página (acima da dobra): carrega na hora, sem lazy loading. */
  prioridade?: boolean
  /** Largura do arquivo original, usada para escolher os tamanhos disponíveis no srcset. */
  largura?: number
  /** Largura (em px) da miniatura principal pedida à Wikimedia. */
  larguraBase?: number
  sizes?: string
}

/**
 * Foto de destino: carrega sob demanda, mostra um esqueleto enquanto chega, aparece com fade
 * e, se o link estiver fora do ar, cai num placeholder em vez de deixar um buraco na página.
 */
function ImagemDestino({
  src,
  alt,
  className = '',
  prioridade = false,
  largura,
  larguraBase = 960,
  sizes,
}: ImagemDestinoProps) {
  const [srcComErro, setSrcComErro] = useState<string | null>(null)
  const [srcCarregada, setSrcCarregada] = useState<string | null>(null)
  // Se a miniatura da Wikimedia falhar, tentamos o endereço original antes de desistir
  const [srcSemMiniatura, setSrcSemMiniatura] = useState<string | null>(null)

  if (!src || srcComErro === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-linear-to-br from-bm-light-green to-bm-light-blue text-bm-dark-green/50 ${className}`}
      >
        <MapPin size={40} aria-hidden="true" />
      </div>
    )
  }

  const carregada = srcCarregada === src
  const posicao = /\b(absolute|fixed|sticky)\b/.test(className) ? '' : 'relative'
  const usaMiniatura = ehWikimedia(src) && srcSemMiniatura !== src
  const principal = usaMiniatura ? emLargura(src, Math.min(larguraBase, largura ?? larguraBase)) : src
  const srcSet = usaMiniatura ? srcSetWikimedia(src, largura) : undefined

  return (
    <div className={`${posicao} overflow-hidden bg-slate-200 ${className}`}>
      {!carregada && (
        <div
          className="absolute inset-0 animate-pulse bg-linear-to-br from-slate-200 to-slate-100"
          aria-hidden="true"
        />
      )}

      <img
        ref={(img) => {
          // Foto já em cache: o evento "load" pode ter acontecido antes do React ouvir
          if (img?.complete && img.naturalWidth > 0) setSrcCarregada(src)
        }}
        src={principal}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={prioridade ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={() => setSrcCarregada(src)}
        onError={() => (usaMiniatura ? setSrcSemMiniatura(src) : setSrcComErro(src))}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          carregada ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

export default ImagemDestino
