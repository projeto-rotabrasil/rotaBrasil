import {
  Building2,
  Droplets,
  Landmark,
  Mountain,
  Trees,
  TreePalm,
  Ticket,
  Umbrella,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { Categoria } from '../data/destinos'

export interface InfoCategoria {
  id: Categoria
  /** Nome no singular, usado em selos ("Praia") */
  rotulo: string
  /** Nome no plural, usado em filtros ("Praias e litoral") */
  plural: string
  descricao: string
  icone: LucideIcon
}

export const CATEGORIAS: InfoCategoria[] = [
  { id: 'parque-nacional', rotulo: 'Parque ou reserva', plural: 'Parques e reservas', descricao: 'Natureza protegida e trilhas', icone: Trees },
  { id: 'praia', rotulo: 'Praia', plural: 'Praias e litoral', descricao: 'Mar, areia e piscinas naturais', icone: Umbrella },
  { id: 'ilha', rotulo: 'Ilha', plural: 'Ilhas', descricao: 'Para chegar de barco ou balsa', icone: TreePalm },
  { id: 'cachoeira-canion', rotulo: 'Cachoeira ou cânion', plural: 'Cachoeiras e cânions', descricao: 'Quedas d’água e paredões', icone: Droplets },
  { id: 'serra-chapada', rotulo: 'Serra ou chapada', plural: 'Serras e chapadas', descricao: 'Montanhas, mirantes e clima fresco', icone: Mountain },
  { id: 'rio-floresta', rotulo: 'Rio ou floresta', plural: 'Rios e florestas', descricao: 'Amazônia, Pantanal e águas cristalinas', icone: Waves },
  { id: 'cidade-historica', rotulo: 'Cidade histórica', plural: 'Cidades históricas', descricao: 'Casarões, igrejas e cultura', icone: Landmark },
  { id: 'cidade', rotulo: 'Cidade', plural: 'Cidades e urbano', descricao: 'Capitais, museus e gastronomia', icone: Building2 },
  { id: 'lazer', rotulo: 'Lazer', plural: 'Lazer e águas termais', descricao: 'Diversão para toda a família', icone: Ticket },
]

const POR_ID = new Map(CATEGORIAS.map((categoria) => [categoria.id, categoria]))

export function infoDaCategoria(id: Categoria): InfoCategoria {
  return POR_ID.get(id) ?? CATEGORIAS[CATEGORIAS.length - 2]
}
