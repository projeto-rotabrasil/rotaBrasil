import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface SectionCardProps {
  titulo: string
  icone?: LucideIcon
  cor?: 'verde' | 'azul'
  tamanho?: 'grande' | 'normal'
  /** Âncora para o menu fixo da página (ex.: "clima" leva a #clima) */
  id?: string
  children: ReactNode
  className?: string
}

/** Cartão branco com título (e ícone opcional), usado em toda a página de destino. */
function SectionCard({
  titulo,
  icone: Icone,
  cor = 'verde',
  tamanho = 'normal',
  id,
  children,
  className = '',
}: SectionCardProps) {
  const corIcone = cor === 'verde' ? 'bg-bm-light-green' : 'bg-bm-light-blue'

  return (
    <section
      id={id}
      className={`scroll-mt-36 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm max-sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-center gap-3">
        {Icone && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-bm-dark-green ${corIcone}`}
          >
            <Icone size={24} aria-hidden="true" />
          </div>
        )}
        <h2
          className={`font-extrabold tracking-tight text-bm-dark-green ${tamanho === 'grande' ? 'text-3xl' : 'text-2xl'}`}
        >
          {titulo}
        </h2>
      </div>

      {children}
    </section>
  )
}

export default SectionCard
