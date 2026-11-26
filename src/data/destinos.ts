import dados from './destinos.json'

/**
 * Tipos de destino. O rótulo e o ícone de cada um ficam em `src/utils/categorias.ts`.
 */
export type Categoria =
  | 'parque-nacional'
  | 'praia'
  | 'ilha'
  | 'cachoeira-canion'
  | 'serra-chapada'
  | 'rio-floresta'
  | 'cidade-historica'
  | 'cidade'
  | 'lazer'

export interface ImagemCredito {
  /** Autor da foto, como registrado na Wikimedia Commons */
  autor: string
  /** Ex.: "CC BY-SA 4.0" */
  licenca: string
  /** Página da foto na Commons (autor, licença e original) */
  url: string
  /** Largura do arquivo original, em pixels (limita os tamanhos pedidos ao servidor) */
  largura?: number
}

/** Foto extra do destino (galeria), sempre com o crédito exigido pela licença. */
export interface FotoGaleria {
  imagem: string
  credito: ImagemCredito
}

export interface DestinoType {
  id: string
  nome: string
  estado: string
  cidade: string
  regiao: string
  bioma: string
  categoria: Categoria
  descricao: string
  imagem: string
  tags: string[]
  tipoViagem: string
  nivelAcesso: string
  localizacao: {
    latitude: number
    longitude: number
  }

  // Opcionais: quando ausentes, a página simplesmente não mostra o item/seção.
  duracaoRecomendada?: string
  publicoIdeal?: string
  melhorEpoca?: string
  sobre?: string
  comoChegar?: string
  destaques?: string[]
  dicas?: string[]
  /** "Tesouro escondido": lugar incrível fora do circuito mais batido */
  escondido?: boolean
  /** Título do artigo na Wikipédia em português (usado para o resumo e o link "Saiba mais") */
  wikipedia?: string
  imagemCredito?: ImagemCredito
}

// O catálogo fica em destinos.json: é só dado, e os scripts em /scripts também o leem e atualizam.
export const destinos = dados as DestinoType[]
