import { useEffect } from 'react'

const TITULO_PADRAO = 'RotaBrasil — Explore parques nacionais e destinos do Brasil'
const DESCRICAO_PADRAO =
  'Descubra parques nacionais, praias, chapadas e tesouros escondidos do Brasil. Filtre por região e bioma, veja o clima, planeje com os feriadões e monte seu roteiro.'

/** Ajusta o título da aba (e a descrição) para cada página do site. */
export function useDocumentTitle(titulo?: string, descricao?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · RotaBrasil` : TITULO_PADRAO

    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', descricao ?? DESCRICAO_PADRAO)
  }, [titulo, descricao])
}
