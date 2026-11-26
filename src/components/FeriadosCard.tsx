import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { getFeriadosNacionais } from '../services/brasilApiService'
import { calcularPeriodos, type PeriodoFeriado, type TipoPeriodo } from '../utils/feriados'
import SectionCard from './SectionCard'

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; periodos: PeriodoFeriado[] }

const ROTULOS: Record<TipoPeriodo, { texto: string; classe: string }> = {
  feriadao: { texto: 'Feriadão', classe: 'bg-bm-light-green text-bm-dark-green' },
  emenda: { texto: 'Vale emendar', classe: 'bg-bm-light-blue text-bm-dark-green' },
  'fim-de-semana': { texto: 'No fim de semana', classe: 'bg-slate-100 text-slate-600' },
  'meio-de-semana': { texto: 'Meio da semana', classe: 'bg-slate-100 text-slate-600' },
}

function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function formatarPeriodo(periodo: PeriodoFeriado): string {
  const mesmoDia = periodo.inicio.getTime() === periodo.fim.getTime()
  return mesmoDia
    ? formatarData(periodo.inicio)
    : `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`
}

function FeriadosCard() {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  useEffect(() => {
    let ativo = true
    const ano = new Date().getFullYear()

    Promise.all([getFeriadosNacionais(ano), getFeriadosNacionais(ano + 1)])
      .then(([atual, proximo]) => {
        if (ativo) {
          setEstado({ status: 'ok', periodos: calcularPeriodos([...atual, ...proximo]).slice(0, 4) })
        }
      })
      .catch((erro) => {
        if (!ativo) return
        console.error(erro)
        setEstado({ status: 'erro' })
      })

    return () => {
      ativo = false
    }
  }, [])

  return (
    <SectionCard id="feriados" titulo="Feriadões e emendas" icone={CalendarDays}>
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        Os próximos feriados nacionais e quanto tempo de folga cada um rende para viajar.
      </p>

      {estado.status === 'carregando' && (
        <div className="space-y-3" role="status" aria-label="Carregando feriados">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      )}

      {estado.status === 'erro' && (
        <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
          Não foi possível carregar os feriados agora.
        </p>
      )}

      {estado.status === 'ok' && estado.periodos.length === 0 && (
        <p className="text-slate-600">Nenhum feriado nacional encontrado para os próximos meses.</p>
      )}

      {estado.status === 'ok' && estado.periodos.length > 0 && (
        <ul className="m-0 list-none space-y-3 p-0">
          {estado.periodos.map((periodo) => {
            const rotulo = ROTULOS[periodo.tipo]

            return (
              <li key={periodo.chave} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-bm-dark-green">{periodo.nome}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${rotulo.classe}`}>
                    {rotulo.texto}
                  </span>
                </div>
                <p className="text-sm font-bold capitalize text-slate-600">
                  {formatarPeriodo(periodo)}
                </p>
                <p className="mt-1 text-sm text-slate-600">{periodo.resumo}</p>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-slate-500">Dados: BrasilAPI. Feriados estaduais e municipais não entram.</p>
    </SectionCard>
  )
}

export default FeriadosCard
