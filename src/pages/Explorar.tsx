import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Gem, Search } from 'lucide-react'
import { destinos } from '../data/destinos'
import { getEstados, getRegioes } from '../services/ibgeService'
import CardDestino from '../components/CardDestino'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { CATEGORIAS } from '../utils/categorias'
import {
  BIOMAS,
  contarPorCategoria,
  correspondeBusca,
  pertenceAoBioma,
  tagsMaisFrequentes,
} from '../utils/destinos'

const ORDEM_REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
const ATIVIDADES_RAPIDAS = tagsMaisFrequentes(14)
const POR_PAGINA = 18
const TOTAL_ESCONDIDOS = destinos.filter((destino) => destino.escondido).length

interface EstadoLista {
  nome: string
  regiao: string
}

interface ListasGeograficas {
  regioes: string[]
  estados: EstadoLista[]
}

// Listas montadas a partir dos próprios destinos: valem enquanto o IBGE não responde
// (ou caso ele esteja fora do ar).
const listasLocais: ListasGeograficas = {
  regioes: ORDEM_REGIOES.filter((regiao) => destinos.some((destino) => destino.regiao === regiao)),
  estados: [...new Map(destinos.map((d) => [d.estado, { nome: d.estado, regiao: d.regiao }])).values()].sort(
    (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')
  ),
}

const estiloCampo =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-bm-teal-strong disabled:cursor-not-allowed disabled:opacity-60'

function Explorar() {
  useDocumentTitle(
    'Explorar destinos',
    'Filtre parques nacionais, praias, cachoeiras e cidades históricas do Brasil por região, estado, bioma e atividade.'
  )

  const [params, setParams] = useSearchParams()

  const regiao = params.get('regiao') ?? ''
  const estado = params.get('estado') ?? ''
  const cidade = params.get('cidade') ?? ''
  const bioma = params.get('bioma') ?? ''
  const categoria = params.get('categoria') ?? ''
  const atividade = params.get('atividade') ?? ''
  const q = params.get('q') ?? ''
  const soEscondidos = params.get('escondido') === '1'
  const ordem = params.get('ordem') === 'nome' ? 'nome' : 'estado'

  function atualizar(mudancas: Record<string, string>) {
    setParams(
      (anterior) => {
        const novos = new URLSearchParams(anterior)

        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor) novos.set(chave, valor)
          else novos.delete(chave)
        }

        return novos
      },
      { replace: true }
    )
  }

  // Campo de busca: digita à vontade e a URL só é atualizada quando a pessoa para de digitar.
  const [busca, setBusca] = useState(q)

  useEffect(() => {
    setBusca(q)
  }, [q])

  useEffect(() => {
    if (busca.trim() === q) return

    const espera = setTimeout(() => atualizar({ q: busca.trim() }), 250)
    return () => clearTimeout(espera)
  }, [busca])

  // Regiões e estados vêm do IBGE; se a chamada falhar, ficam as listas locais.
  const [listas, setListas] = useState<ListasGeograficas>(listasLocais)

  useEffect(() => {
    let ativo = true

    Promise.all([getRegioes(), getEstados()])
      .then(([regioesIBGE, estadosIBGE]) => {
        if (!ativo) return

        setListas({
          regioes: regioesIBGE
            .map((item) => item.nome)
            .sort((a, b) => ORDEM_REGIOES.indexOf(a) - ORDEM_REGIOES.indexOf(b)),
          estados: estadosIBGE.map((item) => ({ nome: item.nome, regiao: item.regiao.nome })),
        })
      })
      .catch((erro) => console.warn('IBGE indisponível, usando as listas locais:', erro))

    return () => {
      ativo = false
    }
  }, [])

  const estadosDisponiveis = useMemo(
    () => (regiao ? listas.estados.filter((item) => item.regiao === regiao) : listas.estados),
    [listas, regiao]
  )

  const cidadesDisponiveis = useMemo(() => {
    if (!estado) return []

    const cidades = destinos.filter((d) => d.estado === estado).map((d) => d.cidade).filter(Boolean)
    return [...new Set(cidades)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [estado])

  const destinosFiltrados = useMemo(() => {
    const lista = destinos.filter(
      (d) =>
        (!regiao || d.regiao === regiao) &&
        (!estado || d.estado === estado) &&
        (!cidade || d.cidade === cidade) &&
        (!bioma || pertenceAoBioma(d, bioma)) &&
        (!categoria || d.categoria === categoria) &&
        (!atividade || d.tags.includes(atividade)) &&
        (!soEscondidos || d.escondido) &&
        correspondeBusca(d, q)
    )

    return ordem === 'nome' ? [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : lista
  }, [regiao, estado, cidade, bioma, categoria, atividade, soEscondidos, q, ordem])

  // "Mostrar mais": volta para a primeira página sempre que os filtros mudam.
  const [limite, setLimite] = useState(POR_PAGINA)
  const chaveFiltros = params.toString()

  useEffect(() => {
    setLimite(POR_PAGINA)
  }, [chaveFiltros])

  const temFiltro = Boolean(regiao || estado || cidade || bioma || categoria || atividade || soEscondidos || q)

  function limparFiltros() {
    setBusca('')
    atualizar({
      regiao: '',
      estado: '',
      cidade: '',
      bioma: '',
      categoria: '',
      atividade: '',
      escondido: '',
      q: '',
    })
  }

  const visiveis = destinosFiltrados.slice(0, limite)

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <h1 className="titulo-pagina text-bm-dark-green">Explore os destinos</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          {destinos.length} lugares para conhecer. Busque pelo nome ou combine filtros: o endereço da
          página guarda sua busca, então você pode compartilhar o link.
        </p>
      </header>

      <section
        aria-label="Filtros"
        className="mb-10 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm max-sm:p-4"
      >
        <div className="relative mb-6">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={20}
            aria-hidden="true"
          />
          <label htmlFor="busca" className="sr-only">
            Buscar destino
          </label>
          <input
            id="busca"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cidade, estado ou atividade (ex.: cachoeira)"
            autoComplete="off"
            className={`${estiloCampo} pl-12`}
          />
        </div>

        {/* Tipo de lugar */}
        <div className="mb-6">
          <p className="mb-3 font-extrabold text-bm-dark-green" id="rotulo-categorias">
            Tipo de lugar
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="rotulo-categorias">
            {CATEGORIAS.map((item) => {
              const ativa = categoria === item.id
              const Icone = item.icone

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => atualizar({ categoria: ativa ? '' : item.id })}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                    ativa
                      ? 'border-bm-dark-green bg-bm-dark-green text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-bm-light-green'
                  }`}
                >
                  <Icone size={16} aria-hidden="true" />
                  {item.plural}
                  <span className={`text-xs ${ativa ? 'text-white/80' : 'text-slate-500'}`}>
                    {contarPorCategoria(item.id)}
                  </span>
                </button>
              )
            })}

            <button
              type="button"
              aria-pressed={soEscondidos}
              onClick={() => atualizar({ escondido: soEscondidos ? '' : '1' })}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                soEscondidos
                  ? 'border-bm-sun bg-bm-sun text-bm-forest'
                  : 'border-bm-sun bg-bm-sun-soft text-bm-forest hover:bg-bm-sun'
              }`}
            >
              <Gem size={16} aria-hidden="true" />
              Tesouros escondidos
              <span className="text-xs">{TOTAL_ESCONDIDOS}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block font-extrabold text-bm-dark-green">Região</span>
            <select
              value={regiao}
              onChange={(e) => atualizar({ regiao: e.target.value, estado: '', cidade: '' })}
              className={estiloCampo}
            >
              <option value="">Todas as regiões</option>
              {listas.regioes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-extrabold text-bm-dark-green">Estado</span>
            <select
              value={estado}
              onChange={(e) => atualizar({ estado: e.target.value, cidade: '' })}
              className={estiloCampo}
            >
              <option value="">Todos os estados</option>
              {estadosDisponiveis.map((item) => (
                <option key={item.nome} value={item.nome}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-extrabold text-bm-dark-green">Cidade</span>
            <select
              value={cidade}
              disabled={!estado}
              onChange={(e) => atualizar({ cidade: e.target.value })}
              className={estiloCampo}
            >
              <option value="">{estado ? 'Todas as cidades' : 'Escolha um estado primeiro'}</option>
              {cidadesDisponiveis.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-extrabold text-bm-dark-green">Bioma</span>
            <select
              value={bioma}
              onChange={(e) => atualizar({ bioma: e.target.value })}
              className={estiloCampo}
            >
              <option value="">Todos os biomas</option>
              {BIOMAS.map((item) => (
                <option key={item.nome} value={item.nome}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <p className="mb-3 font-extrabold text-bm-dark-green" id="rotulo-atividades">
            Atividade
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="rotulo-atividades">
            {ATIVIDADES_RAPIDAS.map((tag) => {
              const ativa = atividade === tag

              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => atualizar({ atividade: ativa ? '' : tag })}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition ${
                    ativa
                      ? 'border-bm-dark-green bg-bm-dark-green text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-bm-light-green'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {temFiltro && (
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-6 cursor-pointer rounded-full border-none bg-bm-light-green px-5 py-3 font-extrabold text-bm-dark-green transition hover:bg-bm-light-green-hover"
          >
            Limpar filtros
          </button>
        )}
      </section>

      <section aria-label="Resultados">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-bm-dark-green" role="status">
            {destinosFiltrados.length === 1
              ? '1 destino encontrado'
              : `${destinosFiltrados.length} destinos encontrados`}
          </h2>

          <label className="flex items-center gap-3 font-bold text-slate-600">
            Ordenar por
            <select
              value={ordem}
              onChange={(e) => atualizar({ ordem: e.target.value === 'nome' ? 'nome' : '' })}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700"
            >
              <option value="estado">Estado</option>
              <option value="nome">Nome (A–Z)</option>
            </select>
          </label>
        </div>

        {destinosFiltrados.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
            <h3 className="text-2xl font-extrabold text-bm-dark-green">Nenhum destino encontrado</h3>
            <p className="mt-3 text-slate-600">
              Tente buscar outro termo ou escolher outra combinação de filtros.
            </p>
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-6 cursor-pointer rounded-full border-none bg-bm-dark-green px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {visiveis.map((destino) => (
                <CardDestino key={destino.id} destino={destino} />
              ))}
            </div>

            {visiveis.length < destinosFiltrados.length && (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-slate-600">
                  Mostrando {visiveis.length} de {destinosFiltrados.length}
                </p>
                <button
                  type="button"
                  onClick={() => setLimite((atual) => atual + POR_PAGINA)}
                  className="cursor-pointer rounded-full border-2 border-bm-dark-green bg-transparent px-8 py-4 font-bold text-bm-dark-green transition-all hover:bg-bm-dark-green hover:text-white"
                >
                  Mostrar mais
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default Explorar
