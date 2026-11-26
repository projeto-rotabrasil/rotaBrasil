import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Heart, Trash2 } from 'lucide-react'
import { destinos, type DestinoType } from '../data/destinos'
import CardDestino from '../components/CardDestino'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFavoritos } from '../hooks/useFavoritos'
import { localizacaoTexto } from '../utils/destinos'

function MeuRoteiro() {
  useDocumentTitle('Meu roteiro', 'Os destinos que você salvou no RotaBrasil, lado a lado para comparar.')

  const { ids, limpar } = useFavoritos()
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)
  const [copiado, setCopiado] = useState<'sim' | 'erro' | null>(null)

  // Ignora ids que não existem mais nos dados
  const salvos = useMemo(
    () =>
      ids
        .map((id) => destinos.find((destino) => destino.id === id))
        .filter((destino): destino is DestinoType => Boolean(destino)),
    [ids]
  )

  async function copiarResumo() {
    const linhas = [
      'Meu roteiro no RotaBrasil',
      '',
      ...salvos.map((destino, i) => `${i + 1}. ${destino.nome}, ${localizacaoTexto(destino)}`),
      '',
      'https://projeto-rotabrasil.github.io/rotaBrasil/',
    ]

    try {
      await navigator.clipboard.writeText(linhas.join('\n'))
      setCopiado('sim')
    } catch {
      setCopiado('erro')
    }

    setTimeout(() => setCopiado(null), 2500)
  }

  if (salvos.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-bm-light-green text-bm-dark-green">
          <Heart size={40} aria-hidden="true" />
        </div>

        <h1 className="titulo-secao text-bm-dark-green">Seu roteiro está vazio</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Toque no coração dos destinos que você gostar. Eles ficam salvos neste navegador e
          aparecem aqui, lado a lado, para você comparar.
        </p>

        <Link
          to="/explorar"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-bm-dark-green px-8 py-4 font-bold text-white no-underline transition-opacity hover:opacity-90"
        >
          Explorar destinos
        </Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="titulo-pagina text-bm-dark-green">Meu roteiro</h1>
          <p className="mt-4 text-lg text-slate-600" role="status">
            {salvos.length === 1 ? '1 destino salvo' : `${salvos.length} destinos salvos`} neste
            navegador.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copiarResumo}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-bold text-bm-dark-green transition hover:bg-slate-50"
          >
            {copiado === 'sim' ? (
              <>
                <Check size={18} aria-hidden="true" /> Copiado!
              </>
            ) : (
              <>
                <Copy size={18} aria-hidden="true" /> Copiar lista
              </>
            )}
          </button>

          {confirmandoLimpeza ? (
            <div className="flex items-center gap-2 rounded-full bg-red-50 py-1 pl-5 pr-1">
              <span className="font-bold text-red-700">Remover todos?</span>
              <button
                type="button"
                onClick={() => {
                  limpar()
                  setConfirmandoLimpeza(false)
                }}
                className="cursor-pointer rounded-full border-none bg-red-700 px-4 py-2 font-bold text-white"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoLimpeza(false)}
                className="cursor-pointer rounded-full border-none bg-white px-4 py-2 font-bold text-slate-700"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoLimpeza(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Trash2 size={18} aria-hidden="true" /> Limpar roteiro
            </button>
          )}
        </div>
      </header>

      {copiado === 'erro' && (
        <p className="mb-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700" role="alert">
          Não foi possível copiar automaticamente. Selecione e copie a lista manualmente.
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {salvos.map((destino) => (
          <CardDestino key={destino.id} destino={destino} />
        ))}
      </div>

      <section aria-labelledby="titulo-comparacao" className="mt-16">
        <h2 id="titulo-comparacao" className="mb-6 text-3xl font-extrabold text-bm-dark-green">
          Compare seus destinos
        </h2>

        <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-sm text-bm-dark-green">
                <th scope="col" className="p-4 font-extrabold">Destino</th>
                <th scope="col" className="p-4 font-extrabold">Onde</th>
                <th scope="col" className="p-4 font-extrabold">Duração</th>
                <th scope="col" className="p-4 font-extrabold">Tipo de viagem</th>
                <th scope="col" className="p-4 font-extrabold">Acesso</th>
                <th scope="col" className="p-4 font-extrabold">Melhor época</th>
              </tr>
            </thead>
            <tbody>
              {salvos.map((destino) => (
                <tr key={destino.id} className="border-t border-slate-100 align-top text-slate-600">
                  <th scope="row" className="p-4 font-extrabold">
                    <Link
                      to={`/destino/${destino.id}`}
                      className="text-bm-dark-green no-underline hover:underline"
                    >
                      {destino.nome}
                    </Link>
                  </th>
                  <td className="p-4">{localizacaoTexto(destino)}</td>
                  <td className="p-4">{destino.duracaoRecomendada}</td>
                  <td className="p-4">{destino.tipoViagem}</td>
                  <td className="p-4">{destino.nivelAcesso}</td>
                  <td className="p-4">{destino.melhorEpoca ?? 'Consulte antes de viajar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default MeuRoteiro
