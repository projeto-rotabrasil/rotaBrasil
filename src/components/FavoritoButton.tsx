import { Heart } from 'lucide-react'
import { useFavoritos } from '../hooks/useFavoritos'

interface FavoritoButtonProps {
  destinoId: string
  nome: string
  /** "icone": coração redondo sobre a foto. "botao": botão com texto. */
  variante?: 'icone' | 'botao'
  className?: string
}

function FavoritoButton({ destinoId, nome, variante = 'icone', className = '' }: FavoritoButtonProps) {
  const { estaSalvo, alternar } = useFavoritos()
  const salvo = estaSalvo(destinoId)

  const rotulo = salvo ? `Remover ${nome} do meu roteiro` : `Salvar ${nome} no meu roteiro`

  if (variante === 'botao') {
    return (
      <button
        type="button"
        onClick={() => alternar(destinoId)}
        aria-pressed={salvo}
        className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border-none px-5 py-3 font-extrabold transition ${
          salvo
            ? 'bg-bm-light-green text-bm-dark-green hover:bg-bm-light-green-hover'
            : 'bg-white/90 text-bm-dark-green backdrop-blur hover:bg-white'
        } ${className}`}
      >
        <Heart size={18} fill={salvo ? 'currentColor' : 'none'} aria-hidden="true" />
        {salvo ? 'No meu roteiro' : 'Salvar no roteiro'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => alternar(destinoId)}
      aria-pressed={salvo}
      aria-label={rotulo}
      title={rotulo}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white/90 text-bm-dark-green shadow-sm backdrop-blur transition hover:scale-110 hover:bg-white ${className}`}
    >
      <Heart size={20} fill={salvo ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

export default FavoritoButton
