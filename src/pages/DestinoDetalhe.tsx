import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BedDouble,
  BookOpen,
  CalendarDays,
  Camera,
  Clock,
  Compass,
  ExternalLink,
  Gauge,
  Gem,
  Info,
  Leaf,
  Lightbulb,
  MapPin,
  Navigation,
  Plane,
  Route,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { destinos, type FotoGaleria } from '../data/destinos'
import { carregarGaleria } from '../data/galerias'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useWikipediaResumo } from '../hooks/useWikipediaResumo'
import { infoDaCategoria } from '../utils/categorias'
import { destinosSimilares, localizacaoTexto } from '../utils/destinos'
import {
  aoFalharMiniatura,
  ehWikimedia,
  emLargura,
  larguraPermitida,
  srcSetWikimedia,
} from '../utils/imagem'
import AtracoesCard from '../components/AtracoesCard'
import CardDestino from '../components/CardDestino'
import ClimaCard from '../components/ClimaCard'
import FavoritoButton from '../components/FavoritoButton'
import FeriadosCard from '../components/FeriadosCard'
import GaleriaFotos from '../components/GaleriaFotos'
import SectionCard from '../components/SectionCard'
import NotFound from './NotFound'

interface Informacao {
  icone: LucideIcon
  rotulo: string
  valor: string
}

const linkExterno =
  'inline-flex w-full items-center justify-center gap-2 rounded-full border border-bm-dark-green/20 bg-white px-5 py-3 text-center font-extrabold text-bm-dark-green no-underline transition hover:bg-bm-light-green'

function DestinoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = destinos.find((item) => item.id === id)

  useDocumentTitle(destino?.nome, destino?.descricao)

  // Sem texto próprio, o "Sobre" usa o resumo da Wikipédia (com a fonte sempre visível)
  const resumo = useWikipediaResumo(destino && !destino.sobre ? destino.wikipedia : undefined)

  // Galeria: carregada à parte (arquivo próprio), só quando a página do destino é aberta
  const [galeria, setGaleria] = useState<FotoGaleria[]>([])
  useEffect(() => {
    let ativo = true
    setGaleria([])
    if (id) carregarGaleria(id).then((fotos) => ativo && setGaleria(fotos))
    return () => {
      ativo = false
    }
  }, [id])

  if (!destino) {
    return (
      <NotFound
        titulo="Destino não encontrado"
        mensagem="Esse destino não está cadastrado no RotaBrasil. Veja a lista completa para encontrar outro lugar incrível."
      />
    )
  }

  const { latitude, longitude } = destino.localizacao
  const local = localizacaoTexto(destino)
  const categoria = infoDaCategoria(destino.categoria)
  const IconeCategoria = categoria.icone
  const credito = destino.imagemCredito

  // "Voltar" volta de verdade quando a pessoa veio de outra página do site;
  // se abriu o link direto, leva para o Explorar.
  const voltar = () => (location.key !== 'default' ? navigate(-1) : navigate('/explorar'))

  const informacoes: Informacao[] = [
    { icone: MapPin, rotulo: 'Localização', valor: local },
    { icone: IconeCategoria, rotulo: 'Tipo de lugar', valor: categoria.rotulo },
    { icone: Leaf, rotulo: 'Bioma', valor: destino.bioma },
    { icone: Route, rotulo: 'Região', valor: destino.regiao },
    destino.melhorEpoca && { icone: CalendarDays, rotulo: 'Melhor época', valor: destino.melhorEpoca },
    destino.duracaoRecomendada && {
      icone: Clock,
      rotulo: 'Duração recomendada',
      valor: destino.duracaoRecomendada,
    },
    { icone: Compass, rotulo: 'Tipo de viagem', valor: destino.tipoViagem },
    { icone: Gauge, rotulo: 'Nível de acesso', valor: destino.nivelAcesso },
    destino.publicoIdeal && { icone: Users, rotulo: 'Público ideal', valor: destino.publicoIdeal },
  ].filter((item): item is Informacao => Boolean(item && item.valor))

  // Faixa de dados rápidos logo abaixo da foto (os quatro que mais ajudam a decidir)
  const dadosRapidos: Informacao[] = [
    destino.duracaoRecomendada && { icone: Clock, rotulo: 'Duração', valor: destino.duracaoRecomendada },
    { icone: Gauge, rotulo: 'Acesso', valor: destino.nivelAcesso },
    destino.melhorEpoca && { icone: CalendarDays, rotulo: 'Melhor época', valor: destino.melhorEpoca },
    { icone: Leaf, rotulo: 'Bioma', valor: destino.bioma },
    { icone: Compass, rotulo: 'Tipo de viagem', valor: destino.tipoViagem },
  ]
    .filter((item): item is Informacao => Boolean(item && item.valor))
    .slice(0, 4)

  const similares = destinosSimilares(destino, 3)

  const margem = { lon: 0.08, lat: 0.05 }
  const bbox = [
    longitude - margem.lon,
    latitude - margem.lat,
    longitude + margem.lon,
    latitude + margem.lat,
  ]
    .map((valor) => valor.toFixed(4))
    .join('%2C')
  const mapaIncorporado = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`

  const mostrarSobre = Boolean(destino.sobre) || resumo.status === 'carregando' || resumo.status === 'ok'

  const larguraFoto = larguraPermitida(1920, credito?.largura)
  const fotoHero = ehWikimedia(destino.imagem) ? emLargura(destino.imagem, Math.min(1280, larguraFoto)) : destino.imagem

  const menu = [
    mostrarSobre && { href: '#sobre', rotulo: 'Sobre' },
    galeria.length >= 2 && { href: '#galeria', rotulo: 'Fotos' },
    { href: '#informacoes', rotulo: 'Informações' },
    { href: '#mapa-local', rotulo: 'Mapa' },
    { href: '#clima', rotulo: 'Clima' },
    { href: '#feriados', rotulo: 'Feriadões' },
    { href: '#perto', rotulo: 'Perto daqui' },
  ].filter((item): item is { href: string; rotulo: string } => Boolean(item))

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[540px] overflow-hidden bg-bm-forest">
        {destino.imagem ? (
          <img
            src={fotoHero}
            srcSet={srcSetWikimedia(destino.imagem, credito?.largura)}
            sizes="100vw"
            alt={`Foto de ${destino.nome}`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={aoFalharMiniatura(destino.imagem)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // Sem foto: fundo de cores da marca com o ícone do tipo de lugar bem suave
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-end bg-linear-to-br from-bm-forest via-bm-dark-green to-bm-teal-strong pr-[8%] text-white/10"
          >
            <IconeCategoria size={320} strokeWidth={1} className="max-md:hidden" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-black/5" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/25" />

        <div className="relative z-10 mx-auto flex min-h-[540px] max-w-7xl flex-col justify-end px-6 pb-24 pt-10">
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={voltar}
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border-none bg-white/90 px-5 py-3 font-extrabold text-bm-dark-green backdrop-blur transition hover:bg-white"
            >
              <ArrowLeft size={18} aria-hidden="true" /> Voltar
            </button>

            <FavoritoButton destinoId={destino.id} nome={destino.nome} variante="botao" />
          </div>

          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rotulo inline-flex items-center gap-2 rounded-full bg-bm-light-green px-4 py-2 text-bm-dark-green">
                <MapPin size={14} aria-hidden="true" /> {local}
              </span>
              <span className="rotulo inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur">
                <IconeCategoria size={14} aria-hidden="true" /> {categoria.rotulo}
              </span>
              {destino.escondido && (
                <span className="rotulo inline-flex items-center gap-2 rounded-full bg-bm-sun px-4 py-2 text-bm-forest">
                  <Gem size={14} aria-hidden="true" /> Tesouro escondido
                </span>
              )}
            </div>

            <h1 className="titulo-pagina text-[clamp(2.5rem,7vw,5rem)] text-white">{destino.nome}</h1>

            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-white/90">{destino.descricao}</p>

            <ul className="m-0 mt-6 flex list-none flex-wrap gap-3 p-0">
              {destino.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {credito && (
          <p className="absolute bottom-[3.75rem] right-4 z-10 m-0 max-w-[calc(100%-2rem)] rounded-2xl bg-black/45 px-3 py-1.5 text-[11px] leading-snug text-white/90 backdrop-blur sm:right-6 sm:text-xs">
            Foto:{' '}
            <a
              href={credito.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 no-underline hover:underline"
            >
              {credito.autor} / {credito.licenca}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </p>
        )}
      </section>

      {/* Dados rápidos */}
      <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-6">
        <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-xl lg:grid-cols-4">
          {dadosRapidos.map(({ icone: Icone, rotulo, valor }) => (
            <div key={rotulo} className="flex items-center gap-4 bg-white p-5 max-sm:p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bm-light-green text-bm-dark-green">
                <Icone size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="rotulo text-slate-600">{rotulo}</dt>
                <dd className="m-0 line-clamp-2 font-bold leading-snug text-bm-dark-green">{valor}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      {/* Menu da página */}
      <nav
        aria-label="Seções desta página"
        className="sticky top-[76px] z-30 mt-8 border-b border-slate-200 bg-white/90 backdrop-blur"
      >
        <ul className="m-0 mx-auto flex max-w-7xl list-none gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none]">
          {menu.map((item) => (
            <li key={item.href} className="shrink-0">
              <a
                href={item.href}
                className="inline-block rounded-full px-4 py-2 text-sm font-bold text-slate-700 no-underline transition hover:bg-bm-light-green hover:text-bm-dark-green"
              >
                {item.rotulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Conteúdo */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 space-y-8">
          {mostrarSobre && (
            <SectionCard id="sobre" titulo="Sobre o destino" icone={Info} tamanho="grande">
              {destino.sobre ? (
                <p className="text-lg leading-relaxed text-slate-600">{destino.sobre}</p>
              ) : resumo.status === 'carregando' ? (
                <div className="space-y-3" role="status" aria-label="Carregando texto">
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              ) : resumo.status === 'ok' ? (
                <>
                  <p className="text-lg leading-relaxed text-slate-600">{resumo.resumo.texto}</p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <BookOpen size={16} aria-hidden="true" />
                    Texto: Wikipédia, sob licença CC BY-SA 4.0.
                    <a
                      href={resumo.resumo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-bm-teal-strong no-underline hover:underline"
                    >
                      Ler o artigo completo <ExternalLink size={14} aria-hidden="true" />
                      <span className="sr-only">(abre em nova aba)</span>
                    </a>
                  </p>
                </>
              ) : null}
            </SectionCard>
          )}

          {galeria.length >= 2 && (
            <SectionCard id="galeria" titulo="Fotos" icone={Camera} cor="azul" tamanho="grande">
              <GaleriaFotos fotos={galeria} nome={destino.nome} />
              <p className="mt-4 text-sm text-slate-500">
                Fotos da Wikimedia Commons. Toque em uma foto para ampliar e ver o autor e a licença.
              </p>
            </SectionCard>
          )}

          <SectionCard
            id="informacoes"
            titulo="Informações da viagem"
            icone={Compass}
            cor="azul"
            tamanho="grande"
          >
            <dl className="m-0 grid gap-4 sm:grid-cols-2">
              {informacoes.map(({ icone: Icone, rotulo, valor }) => (
                <div key={rotulo} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <Icone className="shrink-0 text-bm-teal-strong" size={24} aria-hidden="true" />
                  <div>
                    <dt className="font-extrabold text-bm-dark-green">{rotulo}</dt>
                    <dd className="m-0 text-slate-600">{valor}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </SectionCard>

          {destino.comoChegar && (
            <SectionCard titulo="Como chegar" icone={Navigation} cor="azul" tamanho="grande">
              <p className="text-lg leading-relaxed text-slate-600">{destino.comoChegar}</p>
            </SectionCard>
          )}

          {destino.destaques && destino.destaques.length > 0 && (
            <SectionCard titulo="Destaques" icone={Sparkles} tamanho="grande">
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
                {destino.destaques.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl bg-slate-50 p-5 font-bold leading-relaxed text-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {destino.dicas && destino.dicas.length > 0 && (
            <SectionCard titulo="Dicas para visitar" icone={Lightbulb} tamanho="grande">
              <ul className="m-0 list-none space-y-3 p-0">
                {destino.dicas.map((dica) => (
                  <li
                    key={dica}
                    className="rounded-2xl bg-bm-light-green p-5 font-bold leading-relaxed text-bm-dark-green"
                  >
                    {dica}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard id="mapa-local" titulo="Localização no mapa" icone={MapPin} tamanho="grande">
            <p className="mb-5 leading-relaxed text-slate-600">
              Localização aproximada de {destino.nome}.
            </p>

            <iframe
              title={`Mapa da região de ${destino.nome}`}
              src={mapaIncorporado}
              loading="lazy"
              className="h-80 w-full rounded-2xl border border-slate-200"
            />

            <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-bm-teal-strong no-underline hover:underline"
              >
                Abrir no Google Maps <ExternalLink size={14} aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=11/${latitude}/${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-bm-teal-strong no-underline hover:underline"
              >
                Ver no OpenStreetMap <ExternalLink size={14} aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </div>
          </SectionCard>
        </div>

        {/* Barra lateral */}
        <aside className="min-w-0 space-y-8">
          <ClimaCard key={`clima-${destino.id}`} latitude={latitude} longitude={longitude} />

          <FeriadosCard />

          <AtracoesCard
            key={`atracoes-${destino.id}`}
            latitude={latitude}
            longitude={longitude}
            nomeDestino={destino.nome}
          />

          <SectionCard titulo="Planeje sua viagem" icone={Compass}>
            <p className="mb-5 leading-relaxed text-slate-600">
              Busque pacotes, hospedagem e passagens para{' '}
              <strong className="text-bm-dark-green">{destino.nome}</strong> nos sites abaixo.
            </p>

            <div className="flex flex-col gap-3">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `pacote de viagem para ${destino.nome} ${destino.estado}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkExterno}
              >
                <Search size={18} aria-hidden="true" /> Pacotes no Google
                <span className="sr-only">(abre em nova aba)</span>
              </a>

              <a
                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
                  `${destino.cidade}, Brasil`
                )}&lang=pt-br`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkExterno}
              >
                <BedDouble size={18} aria-hidden="true" /> Hospedagens no Booking
                <span className="sr-only">(abre em nova aba)</span>
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `passagens aéreas para ${destino.cidade}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkExterno}
              >
                <Plane size={18} aria-hidden="true" /> Passagens aéreas
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Links externos. O RotaBrasil não vende viagens nem recebe comissão.
            </p>
          </SectionCard>

          <div className="rounded-[2rem] bg-bm-forest p-8 text-white shadow-sm">
            <h2 className="mb-3 text-2xl font-extrabold">Monte seu roteiro</h2>

            <p className="mb-6 leading-relaxed text-white/85">
              Salve este destino e compare com outros lugares incríveis pelo Brasil.
            </p>

            <Link
              to="/explorar"
              className="inline-flex rounded-full bg-bm-sun px-6 py-3 font-extrabold text-bm-forest no-underline transition hover:brightness-105"
            >
              Ver outros destinos
            </Link>
          </div>
        </aside>
      </div>

      {/* Destinos parecidos */}
      {similares.length > 0 && (
        <section
          aria-labelledby="titulo-similares"
          className="mx-auto max-w-7xl px-6 pb-12"
        >
          <h2 id="titulo-similares" className="titulo-secao mb-8 text-bm-dark-green">
            Você também pode gostar
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {similares.map((outro) => (
              <CardDestino key={outro.id} destino={outro} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default DestinoDetalhe
