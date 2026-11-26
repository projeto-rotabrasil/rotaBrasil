// Clima via Open-Meteo (https://open-meteo.com): gratuito e sem chave de API.

export type TipoClima =
  | 'sol'
  | 'parcial'
  | 'nublado'
  | 'neblina'
  | 'garoa'
  | 'chuva'
  | 'neve'
  | 'tempestade'

export interface PrevisaoDia {
  data: string
  minima: number
  maxima: number
  chuvaProbabilidade: number | null
  descricao: string
  tipo: TipoClima
}

export interface ClimaAtual {
  temperatura: number
  sensacao: number
  umidade: number
  vento: number
  descricao: string
  tipo: TipoClima
  previsao: PrevisaoDia[]
}

// Códigos WMO usados pela Open-Meteo
const CODIGOS: Record<number, [string, TipoClima]> = {
  0: ['Céu limpo', 'sol'],
  1: ['Predominantemente limpo', 'sol'],
  2: ['Parcialmente nublado', 'parcial'],
  3: ['Nublado', 'nublado'],
  45: ['Neblina', 'neblina'],
  48: ['Neblina com geada', 'neblina'],
  51: ['Garoa fraca', 'garoa'],
  53: ['Garoa moderada', 'garoa'],
  55: ['Garoa forte', 'garoa'],
  56: ['Garoa congelante', 'garoa'],
  57: ['Garoa congelante forte', 'garoa'],
  61: ['Chuva fraca', 'chuva'],
  63: ['Chuva moderada', 'chuva'],
  65: ['Chuva forte', 'chuva'],
  66: ['Chuva congelante', 'chuva'],
  67: ['Chuva congelante forte', 'chuva'],
  71: ['Neve fraca', 'neve'],
  73: ['Neve moderada', 'neve'],
  75: ['Neve forte', 'neve'],
  77: ['Grãos de neve', 'neve'],
  80: ['Pancadas de chuva fracas', 'chuva'],
  81: ['Pancadas de chuva moderadas', 'chuva'],
  82: ['Pancadas de chuva fortes', 'chuva'],
  85: ['Pancadas de neve', 'neve'],
  86: ['Pancadas de neve fortes', 'neve'],
  95: ['Tempestade', 'tempestade'],
  96: ['Tempestade com granizo', 'tempestade'],
  99: ['Tempestade com granizo forte', 'tempestade'],
}

export function descreverClima(codigo: number): { descricao: string; tipo: TipoClima } {
  const [descricao, tipo] = CODIGOS[codigo] ?? ['Condição indisponível', 'nublado']
  return { descricao, tipo }
}

interface RespostaOpenMeteo {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: (number | null)[]
  }
}

export async function getClima(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ClimaAtual> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '4',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Open-Meteo respondeu ${response.status}`)
  }

  const dados: RespostaOpenMeteo = await response.json()
  const atual = descreverClima(dados.current.weather_code)

  // O índice 0 é "hoje" (já coberto pelo clima atual): mostramos os 3 dias seguintes.
  const previsao: PrevisaoDia[] = dados.daily.time.slice(1).map((data, i) => {
    const indice = i + 1
    const clima = descreverClima(dados.daily.weather_code[indice])

    return {
      data,
      minima: dados.daily.temperature_2m_min[indice],
      maxima: dados.daily.temperature_2m_max[indice],
      chuvaProbabilidade: dados.daily.precipitation_probability_max[indice] ?? null,
      descricao: clima.descricao,
      tipo: clima.tipo,
    }
  })

  return {
    temperatura: dados.current.temperature_2m,
    sensacao: dados.current.apparent_temperature,
    umidade: dados.current.relative_humidity_2m,
    vento: dados.current.wind_speed_10m,
    descricao: atual.descricao,
    tipo: atual.tipo,
    previsao,
  }
}
