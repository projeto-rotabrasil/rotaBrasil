import { useEffect, useState } from 'react'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Snowflake,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { getClima, type ClimaAtual, type TipoClima } from '../services/weatherService'
import SectionCard from './SectionCard'

const ICONES: Record<TipoClima, LucideIcon> = {
  sol: Sun,
  parcial: CloudSun,
  nublado: Cloud,
  neblina: CloudFog,
  garoa: CloudDrizzle,
  chuva: CloudRain,
  neve: Snowflake,
  tempestade: CloudLightning,
}

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; clima: ClimaAtual }

interface ClimaCardProps {
  latitude: number
  longitude: number
}

function nomeDoDia(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'short' })
}

function ClimaCard({ latitude, longitude }: ClimaCardProps) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  useEffect(() => {
    const controle = new AbortController()
    setEstado({ status: 'carregando' })

    getClima(latitude, longitude, controle.signal)
      .then((clima) => setEstado({ status: 'ok', clima }))
      .catch((erro) => {
        if (controle.signal.aborted) return
        console.error(erro)
        setEstado({ status: 'erro' })
      })

    return () => controle.abort()
  }, [latitude, longitude])

  return (
    <SectionCard id="clima" titulo="Clima agora" icone={CloudSun} cor="azul">
      {estado.status === 'carregando' && (
        <div className="space-y-3" role="status" aria-label="Carregando clima">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      )}

      {estado.status === 'erro' && (
        <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
          Não foi possível carregar o clima agora. Tente novamente em instantes.
        </p>
      )}

      {estado.status === 'ok' && <ClimaConteudo clima={estado.clima} />}
    </SectionCard>
  )
}

function ClimaConteudo({ clima }: { clima: ClimaAtual }) {
  const IconeAtual = ICONES[clima.tipo]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
        <IconeAtual className="shrink-0 text-bm-teal-strong" size={44} aria-hidden="true" />
        <div>
          <p className="text-4xl font-extrabold text-slate-700">{Math.round(clima.temperatura)}°C</p>
          <p className="text-slate-600">{clima.descricao}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="flex items-center justify-center gap-1 text-xs font-extrabold text-bm-dark-green">
            <Thermometer size={14} aria-hidden="true" /> Sensação
          </dt>
          <dd className="mt-1 font-bold text-slate-600">{Math.round(clima.sensacao)}°C</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="flex items-center justify-center gap-1 text-xs font-extrabold text-bm-dark-green">
            <Droplets size={14} aria-hidden="true" /> Umidade
          </dt>
          <dd className="mt-1 font-bold text-slate-600">{clima.umidade}%</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="flex items-center justify-center gap-1 text-xs font-extrabold text-bm-dark-green">
            <Wind size={14} aria-hidden="true" /> Vento
          </dt>
          <dd className="mt-1 font-bold text-slate-600">{Math.round(clima.vento)} km/h</dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-bm-dark-green">
          Próximos dias
        </h3>
        <ul className="m-0 list-none space-y-2 p-0">
          {clima.previsao.map((dia) => {
            const Icone = ICONES[dia.tipo]

            return (
              <li
                key={dia.data}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm"
              >
                <Icone className="shrink-0 text-bm-teal-strong" size={22} aria-hidden="true" />
                <span className="w-12 font-extrabold capitalize text-bm-dark-green">
                  {nomeDoDia(dia.data)}
                </span>
                <span className="flex-1 text-slate-600">{dia.descricao}</span>
                <span className="font-bold text-slate-700">
                  {Math.round(dia.minima)}° / {Math.round(dia.maxima)}°
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="text-xs text-slate-500">Dados: Open-Meteo.</p>
    </div>
  )
}

export default ClimaCard
