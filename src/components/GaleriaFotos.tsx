import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import type { FotoGaleria } from '../data/destinos'
import {
  aoFalharMiniatura,
  ehWikimedia,
  emLargura,
  larguraPermitida,
  srcSetWikimedia,
} from '../utils/imagem'
import ImagemDestino from './ImagemDestino'

interface GaleriaFotosProps {
  fotos: FotoGaleria[]
  nome: string
}

const botaoRedondo =
  'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-none bg-white/15 text-white backdrop-blur transition hover:bg-white/30'

/** Grade de fotos que abre em tela cheia (setas do teclado navegam, Esc fecha). */
function GaleriaFotos({ fotos, nome }: GaleriaFotosProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const botaoFechar = useRef<HTMLButtonElement>(null)
  const [atual, setAtual] = useState(0)

  const total = fotos.length
  const foto = fotos[atual]

  function abrir(indice: number) {
    setAtual(indice)
    dialogo.current?.showModal()
    botaoFechar.current?.focus()
  }

  function fechar() {
    dialogo.current?.close()
  }

  const anterior = () => setAtual((indice) => (indice - 1 + total) % total)
  const proxima = () => setAtual((indice) => (indice + 1) % total)

  function aoApertarTecla(evento: KeyboardEvent<HTMLDialogElement>) {
    if (evento.key === 'ArrowLeft') anterior()
    if (evento.key === 'ArrowRight') proxima()
  }

  // Clicar no fundo escuro (fora da foto) fecha a galeria
  function aoClicar(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === dialogo.current) fechar()
  }

  const larguraGrande = foto ? larguraPermitida(1920, foto.credito.largura) : 960
  const srcGrande =
    foto && ehWikimedia(foto.imagem) ? emLargura(foto.imagem, Math.min(1280, larguraGrande)) : foto?.imagem

  return (
    <>
      <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 md:auto-rows-[11rem] md:grid-cols-3">
        {fotos.map((item, i) => (
          <button
            key={item.imagem}
            type="button"
            onClick={() => abrir(i)}
            aria-label={`Ampliar foto ${i + 1} de ${total} de ${nome}`}
            className={`group relative cursor-zoom-in overflow-hidden rounded-2xl border-none bg-slate-100 p-0 ${
              i === 0 ? 'col-span-2 row-span-2' : ''
            }`}
          >
            <ImagemDestino
              src={item.imagem}
              alt=""
              largura={item.credito.largura}
              larguraBase={i === 0 ? 960 : 500}
              sizes={i === 0 ? '(min-width: 768px) 520px, 100vw' : '(min-width: 768px) 260px, 50vw'}
              className="h-full w-full transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogo}
        onKeyDown={aoApertarTecla}
        onClick={aoClicar}
        aria-label={`Fotos de ${nome}`}
        className="m-auto w-[min(1100px,94vw)] max-w-none overflow-hidden rounded-3xl border-none bg-black p-0 text-white backdrop:bg-black/85"
      >
        {foto && (
          <figure className="m-0">
            <div className="relative flex items-center justify-center bg-black">
              <img
                key={foto.imagem}
                src={srcGrande}
                srcSet={srcSetWikimedia(foto.imagem, foto.credito.largura)}
                sizes="94vw"
                alt={`${nome}, foto ${atual + 1} de ${total}`}
                referrerPolicy="no-referrer"
                onError={aoFalharMiniatura(foto.imagem)}
                className="max-h-[78vh] w-full object-contain"
              />

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={anterior}
                    aria-label="Foto anterior"
                    className={`${botaoRedondo} absolute left-3 top-1/2 -translate-y-1/2`}
                  >
                    <ChevronLeft size={24} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={proxima}
                    aria-label="Próxima foto"
                    className={`${botaoRedondo} absolute right-3 top-1/2 -translate-y-1/2`}
                  >
                    <ChevronRight size={24} aria-hidden="true" />
                  </button>
                </>
              )}

              <button
                ref={botaoFechar}
                type="button"
                onClick={fechar}
                aria-label="Fechar galeria"
                className={`${botaoRedondo} absolute right-3 top-3`}
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <figcaption className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm text-white/80">
              <span className="font-bold text-white">
                {atual + 1} / {total}
              </span>
              <span>
                Foto:{' '}
                <a
                  href={foto.credito.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white/90 no-underline hover:underline"
                >
                  {foto.credito.autor} / {foto.credito.licenca}
                  <ExternalLink size={13} aria-hidden="true" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  )
}

export default GaleriaFotos
