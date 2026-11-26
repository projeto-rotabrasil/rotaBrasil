import { ArrowRight, Clock, Gauge, Gem, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DestinoType } from '../data/destinos'
import { infoDaCategoria } from '../utils/categorias'
import { siglaDoEstado } from '../utils/estados'
import FavoritoButton from './FavoritoButton'
import ImagemDestino from './ImagemDestino'

interface CardDestinoProps {
  destino: DestinoType
}

const CardDestino = ({ destino }: CardDestinoProps) => {
  const url = `/destino/${destino.id}`
  const categoria = infoDaCategoria(destino.categoria)
  const IconeCategoria = categoria.icone

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={url} tabIndex={-1} aria-hidden="true" className="relative block">
        <ImagemDestino
          src={destino.imagem}
          alt={`Foto de ${destino.nome}`}
          largura={destino.imagemCredito?.largura}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-bm-dark-green shadow-sm backdrop-blur">
        <IconeCategoria size={14} aria-hidden="true" />
        {categoria.rotulo}
      </span>

      <FavoritoButton
        destinoId={destino.id}
        nome={destino.nome}
        className="absolute right-4 top-4"
      />

      {destino.escondido && (
        <span className="pointer-events-none absolute left-4 top-14 inline-flex items-center gap-1.5 rounded-full bg-bm-sun px-3 py-1.5 text-xs font-extrabold text-bm-forest shadow-sm">
          <Gem size={14} aria-hidden="true" />
          Tesouro escondido
        </span>
      )}

      <div className="flex flex-1 flex-col p-6">
        <p className="rotulo flex items-center gap-1 text-bm-teal-strong">
          <MapPin size={14} aria-hidden="true" />
          {destino.cidade ? `${destino.cidade} · ${siglaDoEstado(destino.estado)}` : destino.estado}
        </p>

        <h3 className="mb-2 mt-2 text-2xl font-extrabold leading-tight text-bm-dark-green">
          <Link to={url} className="no-underline hover:underline">
            {destino.nome}
          </Link>
        </h3>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{destino.descricao}</p>

        <ul className="m-0 mb-5 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-sm font-semibold text-slate-600">
          {destino.duracaoRecomendada && (
            <li className="flex items-center gap-1.5">
              <Clock size={16} className="text-bm-teal-strong" aria-hidden="true" />
              {destino.duracaoRecomendada}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <Gauge size={16} className="text-bm-teal-strong" aria-hidden="true" />
            Acesso {destino.nivelAcesso.toLowerCase()}
          </li>
        </ul>

        <Link
          to={url}
          className="mt-auto inline-flex items-center gap-1 font-extrabold text-bm-teal-strong no-underline hover:underline"
        >
          Ver destino
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  )
}

export default CardDestino
