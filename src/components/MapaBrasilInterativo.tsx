import { useMemo, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Brazil from '@svg-maps/brazil'
import { destinos } from '../data/destinos'
import { infoDaCategoria } from '../utils/categorias'
import { contagemPorEstado } from '../utils/destinos'
import { ESTADOS_POR_SIGLA } from '../utils/estados'
import ImagemDestino from './ImagemDestino'

type Regiao = 'norte' | 'nordeste' | 'centro-oeste' | 'sudeste' | 'sul'

const regioesPorEstado: Record<string, Regiao> = {
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste',
  PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro-oeste', GO: 'centro-oeste', MT: 'centro-oeste', MS: 'centro-oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
}

const nomesRegioes: Record<Regiao, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  'centro-oeste': 'Centro-Oeste',
  sudeste: 'Sudeste',
  sul: 'Sul',
}

// Do mais claro (poucos destinos) ao mais escuro (muitos destinos)
const CORES_DOS_NIVEIS = ['#E5E7EB', '#D3E6AE', '#B1CF7A', '#7E9F3B', '#485C11']

const estilosVoltar =
  'w-fit shrink-0 cursor-pointer rounded-full border-none bg-bm-light-green px-4 py-3 font-extrabold text-bm-dark-green transition hover:bg-bm-light-green-hover'

/** Nível de cor (1 a 4) de um estado, pelos quartis da quantidade de destinos. */
function criarCalculoDeNivel(contagem: Record<string, number>) {
  const valores = Object.values(contagem).filter((n) => n > 0).sort((a, b) => a - b)
  const corte = (fracao: number) => valores[Math.min(valores.length - 1, Math.floor(valores.length * fracao))] ?? 0
  const [q1, q2, q3] = [corte(0.25), corte(0.5), corte(0.75)]

  return (quantidade: number) => {
    if (quantidade <= 0) return 0
    if (quantidade <= q1) return 1
    if (quantidade <= q2) return 2
    if (quantidade <= q3) return 3
    return 4
  }
}

function MapaBrasilInterativo() {
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<Regiao | null>(null)
  const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null)

  const contagem = useMemo(() => contagemPorEstado(), [])
  const nivelDe = useMemo(() => criarCalculoDeNivel(contagem), [contagem])

  const totalPorRegiao = useMemo(() => {
    const total: Record<string, number> = {}
    for (const destino of destinos) total[destino.regiao] = (total[destino.regiao] ?? 0) + 1
    return total
  }, [])

  function selecionarEstado(sigla: string) {
    setEstadoSelecionado(sigla)
    setRegiaoSelecionada(regioesPorEstado[sigla])
  }

  function selecionarRegiao(regiao: Regiao) {
    setRegiaoSelecionada(regiao)
    setEstadoSelecionado(null)
  }

  function limparSelecao() {
    setRegiaoSelecionada(null)
    setEstadoSelecionado(null)
  }

  function aoApertarTecla(evento: KeyboardEvent<SVGPathElement>, sigla: string) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      selecionarEstado(sigla)
    }
  }

  const nomeEstadoSelecionado = estadoSelecionado ? ESTADOS_POR_SIGLA[estadoSelecionado] : null

  const destinosDoEstado = nomeEstadoSelecionado
    ? destinos
        .filter((destino) => destino.estado === nomeEstadoSelecionado)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    : []

  const estadosDaRegiao = Object.entries(regioesPorEstado)
    .filter(([, regiao]) => regiao === regiaoSelecionada)
    .map(([sigla]) => sigla)

  return (
    <section id="mapa" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20">
      <div className="mb-10 max-w-3xl">
        <p className="rotulo mb-4 inline-block rounded-full bg-bm-light-green px-4 py-2 text-bm-dark-green">
          Mapa interativo
        </p>
        <h2 className="titulo-secao text-bm-dark-green">Explore o Brasil por região</h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Quanto mais escuro o estado, mais destinos ele tem aqui. Clique (ou use Tab e Enter) em um
          estado, ou escolha uma região pelos botões.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Mapa SVG */}
        <div className="flex h-[620px] flex-col items-center justify-center gap-5 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm max-sm:h-[500px] max-sm:p-4">
          <svg
            viewBox={Brazil.viewBox}
            className="block min-h-0 w-full max-w-[620px] flex-1"
            role="group"
            aria-label="Mapa do Brasil: selecione um estado"
          >
            {Brazil.locations.map((location) => {
              const sigla = location.id.toUpperCase()
              const regiao = regioesPorEstado[sigla]
              const nomeEstado = ESTADOS_POR_SIGLA[sigla]
              const quantidade = contagem[nomeEstado] ?? 0
              const rotulo = `${nomeEstado}: ${quantidade} ${quantidade === 1 ? 'destino' : 'destinos'}`

              let classe = 'estado-mapa'
              if (regiaoSelecionada && regiao !== regiaoSelecionada) classe += ' estado-desativado'
              if (estadoSelecionado === sigla) classe += ' estado-selecionado'

              return (
                <path
                  key={location.id}
                  id={location.id}
                  d={location.path}
                  className={classe}
                  style={{ fill: CORES_DOS_NIVEIS[nivelDe(quantidade)] }}
                  role="button"
                  tabIndex={0}
                  aria-label={rotulo}
                  aria-pressed={estadoSelecionado === sigla}
                  onClick={() => selecionarEstado(sigla)}
                  onKeyDown={(evento) => aoApertarTecla(evento, sigla)}
                >
                  <title>{rotulo}</title>
                </path>
              )
            })}
          </svg>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600" aria-hidden="true">
            <span>Menos destinos</span>
            <span className="flex overflow-hidden rounded-full border border-slate-200">
              {CORES_DOS_NIVEIS.slice(1).map((cor) => (
                <span key={cor} className="block h-3 w-8" style={{ backgroundColor: cor }} />
              ))}
            </span>
            <span>Mais destinos</span>
          </div>
        </div>

        {/* Painel lateral */}
        <aside
          className="flex h-[620px] flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm max-sm:p-6"
          aria-live="polite"
        >
          <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-bm-dark-green">
            {estadoSelecionado
              ? nomeEstadoSelecionado
              : regiaoSelecionada
                ? nomesRegioes[regiaoSelecionada]
                : 'Escolha uma região'}
          </h3>

          {/* Estado inicial */}
          {!regiaoSelecionada && !estadoSelecionado && (
            <>
              <p className="mb-6 text-lg leading-relaxed text-slate-600">
                Clique diretamente em um estado do mapa ou selecione uma região pelos botões abaixo.
              </p>
              <div className="flex flex-col gap-3">
                {(Object.entries(nomesRegioes) as [Regiao, string][]).map(([id, nome]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selecionarRegiao(id)}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left font-extrabold text-bm-dark-green transition hover:translate-x-1 hover:bg-bm-light-green"
                  >
                    {nome}
                    <span className="text-sm font-bold text-slate-600">
                      {totalPorRegiao[nome] ?? 0} destinos
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Região selecionada, sem estado */}
          {regiaoSelecionada && !estadoSelecionado && (
            <div className="flex min-h-0 flex-1 flex-col">
              <button type="button" onClick={limparSelecao} className={`mb-6 ${estilosVoltar}`}>
                ← Voltar para regiões
              </button>
              <p className="mb-5 text-lg leading-relaxed text-slate-600">
                Escolha um estado da região{' '}
                <strong className="text-bm-dark-green">{nomesRegioes[regiaoSelecionada]}</strong>.
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  {estadosDaRegiao.map((sigla) => {
                    const quantidade = contagem[ESTADOS_POR_SIGLA[sigla]] ?? 0

                    return (
                      <button
                        key={sigla}
                        type="button"
                        onClick={() => selecionarEstado(sigla)}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold text-bm-dark-green transition hover:-translate-y-1 hover:bg-bm-light-green"
                      >
                        <strong className="mb-1 block text-xl text-bm-teal-strong">{sigla}</strong>
                        {ESTADOS_POR_SIGLA[sigla]}
                        <span className="mt-1 block text-xs font-semibold text-slate-600">
                          {quantidade} {quantidade === 1 ? 'destino' : 'destinos'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <Link
                to={`/explorar?regiao=${encodeURIComponent(nomesRegioes[regiaoSelecionada])}`}
                className="mt-4 inline-flex shrink-0 items-center gap-1 font-extrabold text-bm-teal-strong no-underline hover:underline"
              >
                Ver todos os destinos do {nomesRegioes[regiaoSelecionada]}{' '}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* Estado selecionado */}
          {estadoSelecionado && nomeEstadoSelecionado && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <button type="button" onClick={limparSelecao} className={estilosVoltar}>
                Voltar para o mapa completo
              </button>
              <p className="shrink-0 leading-relaxed text-slate-600">
                {destinosDoEstado.length} {destinosDoEstado.length === 1 ? 'destino' : 'destinos'} em{' '}
                <strong className="text-bm-dark-green">{nomeEstadoSelecionado}</strong>:
              </p>

              {destinosDoEstado.length > 0 ? (
                <>
                  <ul className="m-0 min-h-0 flex-1 list-none space-y-2 overflow-y-auto p-0 pr-2">
                    {destinosDoEstado.map((destino) => {
                      const IconeCategoria = infoDaCategoria(destino.categoria).icone

                      return (
                        <li key={destino.id}>
                          <Link
                            to={`/destino/${destino.id}`}
                            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-2 no-underline transition hover:bg-bm-light-green"
                          >
                            <ImagemDestino
                              src={destino.imagem}
                              alt=""
                              largura={destino.imagemCredito?.largura}
                              larguraBase={500}
                              sizes="72px"
                              className="h-16 w-20 shrink-0 rounded-xl"
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-extrabold text-bm-dark-green">
                                {destino.nome}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                                <IconeCategoria size={13} aria-hidden="true" />
                                {destino.cidade}
                              </span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>

                  <Link
                    to={`/explorar?estado=${encodeURIComponent(nomeEstadoSelecionado)}`}
                    className="inline-flex shrink-0 items-center gap-1 font-extrabold text-bm-teal-strong no-underline hover:underline"
                  >
                    Ver no Explorar <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="m-0 text-slate-600">
                    Ainda não existem pontos turísticos cadastrados para esse estado.
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default MapaBrasilInterativo
