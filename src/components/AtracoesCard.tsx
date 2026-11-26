import { useEffect, useState } from 'react'
import { ExternalLink, Landmark } from 'lucide-react'
import { getAtracoesProximas, type ResultadoAtracoes } from '../services/atracoesService'
import SectionCard from './SectionCard'

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; resultado: ResultadoAtracoes }

interface AtracoesCardProps {
  latitude: number
  longitude: number
  nomeDestino: string
}

function formatarDistancia(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1).replace('.', ',')} km`
}

function AtracoesCard({ latitude, longitude, nomeDestino }: AtracoesCardProps) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  useEffect(() => {
    const controle = new AbortController()
    setEstado({ status: 'carregando' })

    getAtracoesProximas(latitude, longitude, nomeDestino, controle.signal)
      .then((resultado) => setEstado({ status: 'ok', resultado }))
      .catch((erro) => {
        if (controle.signal.aborted) return
        console.error(erro)
        setEstado({ status: 'erro' })
      })

    return () => controle.abort()
  }, [latitude, longitude, nomeDestino])

  return (
    <SectionCard id="perto" titulo="Perto daqui" icone={Landmark} cor="azul">
      {estado.status === 'carregando' && (
        <div className="space-y-3" role="status" aria-label="Carregando atrações próximas">
          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      )}

      {estado.status === 'erro' && (
        <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
          Não foi possível carregar os lugares próximos agora.
        </p>
      )}

      {estado.status === 'ok' && estado.resultado.atracoes.length === 0 && (
        <p className="text-slate-600">Nenhum lugar de interesse encontrado por perto.</p>
      )}

      {estado.status === 'ok' && estado.resultado.atracoes.length > 0 && (
        <>
          <ul className="m-0 list-none space-y-3 p-0">
            {estado.resultado.atracoes.map((atracao) => (
              <li key={atracao.id} className="rounded-2xl bg-slate-50 p-4">
                {atracao.link ? (
                  <a
                    href={atracao.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-extrabold text-bm-dark-green no-underline hover:underline"
                  >
                    {atracao.nome}
                    <ExternalLink size={14} aria-hidden="true" />
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                ) : (
                  <span className="font-extrabold text-bm-dark-green">{atracao.nome}</span>
                )}

                {atracao.distancia !== undefined && (
                  <p className="text-sm font-bold text-slate-600">
                    a {formatarDistancia(atracao.distancia)} do ponto de referência
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-slate-500">Fonte: {estado.resultado.fonte}.</p>
        </>
      )}
    </SectionCard>
  )
}

export default AtracoesCard
