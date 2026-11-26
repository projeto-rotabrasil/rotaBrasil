import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useFavoritos } from '../hooks/useFavoritos'

const LINKS = [
  { to: '/', rotulo: 'Home', fim: true },
  { to: '/explorar', rotulo: 'Explorar', fim: false },
  { to: '/roteiro', rotulo: 'Meu roteiro', fim: false },
]

const classeLink = ({ isActive }: { isActive: boolean }) =>
  `no-underline font-medium transition-colors hover:text-bm-teal-strong ${
    isActive ? 'text-bm-teal-strong' : 'text-text-main'
  }`

const Navbar = () => {
  const [menuAberto, setMenuAberto] = useState(false)
  const { pathname } = useLocation()
  const { total } = useFavoritos()

  // Fecha o menu do celular ao trocar de página ou apertar Esc
  useEffect(() => {
    setMenuAberto(false)
  }, [pathname])

  useEffect(() => {
    if (!menuAberto) return

    const aoApertarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAberto(false)
    }

    window.addEventListener('keydown', aoApertarTecla)
    return () => window.removeEventListener('keydown', aoApertarTecla)
  }, [menuAberto])

  const contador =
    total > 0 ? (
      <span className="ml-2 rounded-full bg-bm-dark-green px-2 py-0.5 text-xs font-bold text-white">
        {total}
        <span className="sr-only"> {total === 1 ? 'destino salvo' : 'destinos salvos'}</span>
      </span>
    ) : null

  const destinoDoBotao = total > 0 ? '/roteiro' : '/explorar'

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 py-4 max-[600px]:px-4"
      >
        <Link
          to="/"
          className="flex items-center gap-3 text-[1.25rem] font-extrabold leading-[1.1] text-bm-dark-green no-underline"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-emblema.png`}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full"
          />
          <span>
            ROTA
            <br />
            BRASIL.
          </span>
        </Link>

        {/* Links: desktop */}
        <div className="hidden items-center gap-8 min-[900px]:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.fim} className={classeLink}>
              {link.rotulo}
              {link.to === '/roteiro' && contador}
            </NavLink>
          ))}
        </div>

        {/* Botão: desktop */}
        <Link
          to={destinoDoBotao}
          className="hidden items-center justify-center rounded-full bg-bm-dark-green px-6 py-3 font-bold text-white no-underline transition-opacity hover:opacity-90 min-[900px]:inline-flex"
        >
          Planejar Viagem
        </Link>

        {/* Hambúrguer: celular */}
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-2 text-bm-dark-green transition hover:bg-slate-100 min-[900px]:hidden"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls="menu-mobile"
        >
          {menuAberto ? <X size={28} aria-hidden="true" /> : <Menu size={28} aria-hidden="true" />}
        </button>
      </nav>

      {/* Menu: celular */}
      {menuAberto && (
        <div
          id="menu-mobile"
          className="flex flex-col gap-5 border-t border-slate-100 bg-white px-8 py-6 shadow-md min-[900px]:hidden"
        >
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.fim} className={classeLink}>
              {link.rotulo}
              {link.to === '/roteiro' && contador}
            </NavLink>
          ))}

          <Link
            to={destinoDoBotao}
            className="inline-flex items-center justify-center rounded-full bg-bm-dark-green px-6 py-3 text-center font-bold text-white no-underline transition-opacity hover:opacity-90"
          >
            Planejar Viagem
          </Link>
        </div>
      )}
    </header>
  )
}

export default Navbar
