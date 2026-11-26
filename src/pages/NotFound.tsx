import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

interface NotFoundProps {
  titulo?: string
  mensagem?: string
}

function NotFound({
  titulo = 'Página não encontrada',
  mensagem = 'O endereço que você abriu não existe ou foi movido. Que tal explorar os destinos?',
}: NotFoundProps) {
  useDocumentTitle(titulo)

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-bm-light-green text-bm-dark-green">
        <Compass size={40} aria-hidden="true" />
      </div>

      <h1 className="titulo-secao text-bm-dark-green">{titulo}</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">{mensagem}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/explorar"
          className="inline-flex items-center justify-center rounded-full bg-bm-dark-green px-8 py-4 font-bold text-white no-underline transition-opacity hover:opacity-90"
        >
          Explorar destinos
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 font-bold text-bm-dark-green no-underline transition hover:bg-slate-50"
        >
          Voltar para a Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound
