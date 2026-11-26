import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

// Cada página vira um arquivo separado, carregado só quando a pessoa a visita.
const Home = lazy(() => import('./pages/Home'))
const Explorar = lazy(() => import('./pages/Explorar'))
const DestinoDetalhe = lazy(() => import('./pages/DestinoDetalhe'))
const MeuRoteiro = lazy(() => import('./pages/MeuRoteiro'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-bm-light-green border-t-bm-dark-green"
        aria-hidden="true"
      />
      <span className="sr-only">Carregando página…</span>
    </div>
  )
}

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />

      <a
        href="#conteudo"
        className="sr-only z-50 rounded-full bg-bm-dark-green px-5 py-3 font-bold text-white no-underline focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
          <Suspense fallback={<Carregando />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/destino/:id" element={<DestinoDetalhe />} />
              <Route path="/roteiro" element={<MeuRoteiro />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  )
}

export default App
