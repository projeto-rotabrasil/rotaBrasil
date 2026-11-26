import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Gem,
  Heart,
  Mountain,
  TreePine,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { destinos } from '../data/destinos'
import CardDestino from '../components/CardDestino'
import HeroHome from '../components/HeroHome'
import ImagemDestino from '../components/ImagemDestino'
import MapaBrasilInterativo from '../components/MapaBrasilInterativo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { contarPorBioma, contarPorBusca, sorteioDoDia, temFoto } from '../utils/destinos'

// Destinos escolhidos a dedo para a vitrine da Home
const IDS_EM_DESTAQUE = [
  'fernando-de-noronha',
  'lencois-maranhenses',
  'chapada-diamantina',
  'cataratas-do-iguacu',
  'bonito',
  'jericoacoara',
]

const emDestaque = IDS_EM_DESTAQUE.map((id) => destinos.find((destino) => destino.id === id)).filter(
  (destino): destino is (typeof destinos)[number] => Boolean(destino)
)

const BENEFICIOS = [
  {
    titulo: 'Exploração completa',
    texto: 'Descubra destinos em todos os estados, dos mais famosos aos escondidos.',
    Icone: Compass,
  },
  {
    titulo: 'Planejamento de verdade',
    texto: 'Clima, previsão dos próximos dias e feriadões que rendem mais dias de folga.',
    Icone: CalendarDays,
  },
  {
    titulo: 'Seu roteiro, do seu jeito',
    texto: 'Salve os destinos que gostou e compare duração, acesso e tipo de viagem.',
    Icone: Heart,
  },
]

interface Paisagem {
  titulo: string
  texto: string
  Icone: LucideIcon
  para: string
  total: number
  /** Destino cuja foto aparece no fundo do cartão */
  destinoId: string
  classe: string
}

const PAISAGENS: Paisagem[] = [
  {
    titulo: 'Amazônia',
    texto: 'O pulmão do mundo em sua forma selvagem.',
    Icone: TreePine,
    para: `/explorar?bioma=${encodeURIComponent('Amazônia')}`,
    total: contarPorBioma('Amazônia'),
    destinoId: 'anavilhanas',
    classe: 'col-span-2 max-lg:col-span-1',
  },
  {
    titulo: 'Litoral',
    texto: 'Paraísos de águas cristalinas.',
    Icone: Waves,
    para: `/explorar?bioma=${encodeURIComponent('Litoral')}`,
    total: contarPorBioma('Litoral'),
    destinoId: 'maragogi',
    classe: '',
  },
  {
    titulo: 'Chapadas',
    texto: 'Cânions e mirantes de tirar o fôlego.',
    Icone: Mountain,
    para: '/explorar?q=chapada',
    total: contarPorBusca('chapada'),
    destinoId: 'chapada-dos-veadeiros',
    classe: '',
  },
  {
    titulo: 'Pantanal',
    texto: 'A maior planície alagada do planeta.',
    Icone: Waves,
    para: `/explorar?bioma=${encodeURIComponent('Pantanal')}`,
    total: contarPorBioma('Pantanal'),
    destinoId: 'pantanal-sul',
    classe: 'col-span-2 max-lg:col-span-1',
  },
]

function CartaoPaisagem({ paisagem }: { paisagem: Paisagem }) {
  const destino = destinos.find((item) => item.id === paisagem.destinoId)
  const { Icone } = paisagem

  return (
    <Link
      to={paisagem.para}
      className={`group relative isolate flex flex-col justify-between overflow-hidden rounded-[2rem] p-10 text-white no-underline max-lg:min-h-[260px] max-sm:p-7 ${paisagem.classe}`}
    >
      {destino && temFoto(destino) ? (
        <ImagemDestino
          src={destino.imagem}
          alt=""
          largura={destino.imagemCredito?.largura}
          sizes="(min-width: 1024px) 600px, 100vw"
          className="absolute inset-0 -z-20 transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 -z-20 bg-bm-olive" />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/75 via-black/25 to-black/10" />

      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
        <Icone size={26} aria-hidden="true" />
      </span>

      <div>
        <h3 className="text-3xl font-extrabold tracking-tight">{paisagem.titulo}</h3>
        <p className="mt-2 text-white/90">{paisagem.texto}</p>
        <p className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold">
          {paisagem.total} {paisagem.total === 1 ? 'destino' : 'destinos'}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </p>
      </div>
    </Link>
  )
}

function Home() {
  useDocumentTitle()

  // Muda a cada dia: a vitrine de "tesouros escondidos" não fica sempre igual
  const escondidos = sorteioDoDia(
    destinos.filter((destino) => destino.escondido && temFoto(destino)),
    3
  )

  return (
    <>
      <HeroHome />

      {/* Paisagens */}
      <section
        aria-labelledby="titulo-paisagens"
        className="mx-auto w-full max-w-[1200px] px-8 py-20 max-[600px]:px-4"
      >
        <h2 id="titulo-paisagens" className="titulo-secao mb-10 text-bm-dark-green">
          Escolha sua paisagem
        </h2>

        <div className="grid w-full auto-rows-[300px] grid-cols-3 gap-6 max-lg:auto-rows-auto max-lg:grid-cols-1">
          {PAISAGENS.map((paisagem) => (
            <CartaoPaisagem key={paisagem.titulo} paisagem={paisagem} />
          ))}
        </div>
      </section>

      {/* Destinos em destaque */}
      <section
        id="destinos"
        className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-8 pb-20 text-left max-[600px]:px-4"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="titulo-secao text-bm-dark-green">Destinos em destaque</h2>
          <Link
            to="/explorar"
            className="inline-flex items-center gap-2 font-extrabold text-bm-teal-strong no-underline hover:underline"
          >
            Ver todos os {destinos.length} destinos <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {emDestaque.map((destino) => (
            <CardDestino key={destino.id} destino={destino} />
          ))}
        </div>
      </section>

      <MapaBrasilInterativo />

      {/* Tesouros escondidos */}
      {escondidos.length > 0 && (
        <section aria-labelledby="titulo-escondidos" className="bg-bm-forest py-20 text-white">
          <div className="mx-auto w-full max-w-[1200px] px-8 max-[600px]:px-4">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="rotulo mb-3 inline-flex items-center gap-2 text-bm-sun">
                  <Gem size={16} aria-hidden="true" /> Fora do circuito
                </p>
                <h2 id="titulo-escondidos" className="titulo-secao">
                  Tesouros escondidos
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-white/80">
                  Lugares incríveis que quase ninguém conhece. A seleção muda todos os dias.
                </p>
              </div>
              <Link
                to="/explorar?escondido=1"
                className="inline-flex items-center gap-2 rounded-full bg-bm-sun px-6 py-3 font-extrabold text-bm-forest no-underline transition hover:brightness-105"
              >
                Ver todos <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {escondidos.map((destino) => (
                <CardDestino key={destino.id} destino={destino} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefícios */}
      <section className="mx-auto w-full max-w-[1200px] px-8 py-20 text-center max-[600px]:px-4">
        <h2 className="titulo-secao mb-12 text-bm-dark-green">Por que viajar com a RotaBrasil?</h2>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
          {BENEFICIOS.map(({ titulo, texto, Icone }) => (
            <div
              key={titulo}
              className="w-full rounded-[1.5rem] border border-slate-100 bg-white p-8 shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bm-light-green text-bm-dark-green">
                <Icone size={24} aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-lg font-extrabold text-bm-dark-green">{titulo}</h3>
              <p className="text-slate-600">{texto}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default Home
