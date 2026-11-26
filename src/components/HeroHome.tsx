import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { destinos } from '../data/destinos'
import { CATEGORIAS } from '../utils/categorias'
import {
  aoFalharMiniatura,
  ehWikimedia,
  emLargura,
  larguraPermitida,
  srcSetWikimedia,
} from '../utils/imagem'

// Destinos que se revezam como foto de capa (só entram os que têm foto)
const IDS_CAPA = [
  'fernando-de-noronha',
  'lencois-maranhenses',
  'chapada-diamantina',
  'cataratas-do-iguacu',
  'jericoacoara',
  'bonito',
]

const CATEGORIAS_RAPIDAS = ['praia', 'parque-nacional', 'cachoeira-canion', 'serra-chapada', 'cidade-historica']

const totalEstados = new Set(destinos.map((destino) => destino.estado)).size

const INTERVALO_MS = 7000

function HeroHome() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [indice, setIndice] = useState(0)
  const [jaMostradas, setJaMostradas] = useState<Set<number>>(() => new Set([0]))

  const capas = IDS_CAPA.map((id) => destinos.find((destino) => destino.id === id)).filter(
    (destino): destino is (typeof destinos)[number] => Boolean(destino?.imagem)
  )

  // Troca a foto sozinha, a não ser que a pessoa prefira menos movimento
  useEffect(() => {
    if (capas.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const temporizador = setInterval(() => {
      setIndice((atual) => (atual + 1) % capas.length)
    }, INTERVALO_MS)

    return () => clearInterval(temporizador)
  }, [capas.length])

  useEffect(() => {
    setJaMostradas((anteriores) => (anteriores.has(indice) ? anteriores : new Set(anteriores).add(indice)))
  }, [indice])

  function buscar(evento: FormEvent) {
    evento.preventDefault()
    const termo = busca.trim()
    navigate(termo ? `/explorar?q=${encodeURIComponent(termo)}` : '/explorar')
  }

  const atual = capas[indice]

  return (
    <section className="relative isolate overflow-hidden bg-bm-forest text-white">
      {/* Fotos de fundo (decorativas: o crédito de cada uma aparece no canto) */}
      {capas.map((capa, i) => {
        if (!jaMostradas.has(i)) return null

        const largura = larguraPermitida(1920, capa.imagemCredito?.largura)

        return (
          <img
            key={capa.id}
            src={ehWikimedia(capa.imagem) ? emLargura(capa.imagem, Math.min(1280, largura)) : capa.imagem}
            srcSet={srcSetWikimedia(capa.imagem, capa.imagemCredito?.largura)}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={aoFalharMiniatura(capa.imagem)}
            className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-1000 ${
              i === indice ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )
      })}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-bm-forest/90 via-bm-forest/60 to-bm-forest/15" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-bm-forest/80 via-transparent to-bm-forest/30" />

      <div className="mx-auto flex min-h-[640px] w-full max-w-[1200px] flex-col justify-center px-8 pb-24 pt-20 max-[600px]:px-4 max-md:min-h-[600px]">
        <p className="rotulo mb-6 inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-2 text-white backdrop-blur">
          Parques, praias, serras e cidades
        </p>

        <h1 className="titulo-pagina max-w-3xl text-[clamp(3rem,8vw,5.75rem)] leading-[0.98]">
          A imensidão <br />
          <span className="text-bm-sun">que é nossa.</span>
        </h1>

        <p className="mt-6 max-w-xl text-xl leading-relaxed text-white/90">
          Explore {destinos.length} destinos em {totalEstados} estados, dos mais famosos aos tesouros
          escondidos do Brasil.
        </p>

        <form onSubmit={buscar} role="search" className="mt-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
              size={20}
              aria-hidden="true"
            />
            <label htmlFor="busca-home" className="sr-only">
              Para onde você quer ir?
            </label>
            <input
              id="busca-home"
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Para onde você quer ir? (ex.: cachoeira, Bonito, Bahia)"
              autoComplete="off"
              className="w-full rounded-full border-none bg-white py-4 pl-14 pr-5 text-base font-medium text-slate-800 shadow-lg outline-none placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-full border-none bg-bm-sun px-8 py-4 text-base font-extrabold text-bm-forest shadow-lg transition hover:brightness-105"
          >
            Buscar destinos
          </button>
        </form>

        <ul className="m-0 mt-6 flex list-none flex-wrap gap-3 p-0">
          {CATEGORIAS_RAPIDAS.map((id) => {
            const categoria = CATEGORIAS.find((item) => item.id === id)
            if (!categoria) return null
            const Icone = categoria.icone

            return (
              <li key={id}>
                <Link
                  to={`/explorar?categoria=${id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white no-underline backdrop-blur transition hover:bg-white/25"
                >
                  <Icone size={16} aria-hidden="true" />
                  {categoria.plural}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Crédito da foto + seletor de fotos */}
      {atual && (
        <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-8 pb-5 text-xs text-white/85 max-[600px]:px-4">
          <div className="flex gap-2" role="group" aria-label="Escolher foto de capa">
            {capas.map((capa, i) => (
              <button
                key={capa.id}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Mostrar foto de ${capa.nome}`}
                aria-pressed={i === indice}
                className={`h-2.5 cursor-pointer rounded-full border-none p-0 transition-all ${
                  i === indice ? 'w-8 bg-bm-sun' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          <p className="m-0 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur">
            <Link to={`/destino/${atual.id}`} className="font-bold text-white no-underline hover:underline">
              {atual.nome}
            </Link>
            {atual.imagemCredito && (
              <>
                {' · Foto: '}
                <a
                  href={atual.imagemCredito.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 no-underline hover:underline"
                >
                  {atual.imagemCredito.autor} / {atual.imagemCredito.licenca}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </section>
  )
}

export default HeroHome
