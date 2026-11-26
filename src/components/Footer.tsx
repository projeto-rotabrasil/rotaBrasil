import { Link } from 'react-router-dom'

const FONTES = [
  { nome: 'IBGE', url: 'https://servicodados.ibge.gov.br/api/docs/localidades' },
  { nome: 'BrasilAPI', url: 'https://brasilapi.com.br' },
  { nome: 'Open-Meteo', url: 'https://open-meteo.com' },
  { nome: 'Wikipédia', url: 'https://pt.wikipedia.org' },
  { nome: 'Wikimedia Commons', url: 'https://commons.wikimedia.org' },
  { nome: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
]

const linkRodape = 'text-white/80 no-underline transition-colors hover:text-bm-sun'

const Footer = () => {
  return (
    <footer className="mt-16 bg-bm-forest text-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-8 py-16 max-[600px]:px-4 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo-emblema.png`}
              alt=""
              width={52}
              height={52}
              className="h-[52px] w-[52px] rounded-full"
            />
            <p className="text-[1.25rem] font-extrabold leading-[1.1]">
              ROTA
              <br />
              BRASIL.
            </p>
          </div>
          <p className="mt-5 max-w-sm leading-relaxed text-white/75">
            Parques nacionais, praias, serras e cidades do Brasil, com mapa interativo, clima e
            planejamento de feriadões.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="rotulo mb-4 text-bm-sun">Navegue</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            <li>
              <Link to="/" className={linkRodape}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/explorar" className={linkRodape}>
                Explorar destinos
              </Link>
            </li>
            <li>
              <Link to="/explorar?escondido=1" className={linkRodape}>
                Tesouros escondidos
              </Link>
            </li>
            <li>
              <Link to="/roteiro" className={linkRodape}>
                Meu roteiro
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/projeto-rotabrasil/rotaBrasil"
                target="_blank"
                rel="noopener noreferrer"
                className={linkRodape}
              >
                Código no GitHub
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="rotulo mb-4 text-bm-sun">Fontes e créditos</h2>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-3 p-0">
            {FONTES.map((fonte) => (
              <li key={fonte.nome}>
                <a href={fonte.url} target="_blank" rel="noopener noreferrer" className={linkRodape}>
                  {fonte.nome}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            As fotos vêm da Wikimedia Commons, com licenças livres: o autor e a licença de cada uma
            aparecem na página do destino. Os resumos dos destinos vêm da Wikipédia (CC BY-SA 4.0).
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-[1200px] px-8 py-6 text-center text-sm text-white/65 max-[600px]:px-4">
          © 2026 RotaBrasil · Projeto acadêmico de Sistemas de Informação
        </p>
      </div>
    </footer>
  )
}

export default Footer
