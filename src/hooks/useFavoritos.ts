import { useCallback, useSyncExternalStore } from 'react'

// "Meu roteiro": destinos salvos no navegador (localStorage), compartilhados entre todos os
// componentes e entre abas.

const CHAVE = 'rotabrasil:roteiro'
const ouvintes = new Set<() => void>()
let cache: string[] | null = null

function ler(): string[] {
  if (cache) return cache

  try {
    const bruto = localStorage.getItem(CHAVE)
    const valor: unknown = bruto ? JSON.parse(bruto) : []
    cache = Array.isArray(valor) ? valor.filter((item): item is string => typeof item === 'string') : []
  } catch {
    cache = []
  }

  return cache
}

function gravar(ids: string[]) {
  cache = ids

  try {
    localStorage.setItem(CHAVE, JSON.stringify(ids))
  } catch {
    // Armazenamento bloqueado (modo privado, por exemplo): a lista vale só nesta sessão.
  }

  ouvintes.forEach((ouvinte) => ouvinte())
}

function assinar(aviso: () => void) {
  ouvintes.add(aviso)

  const aoMudarEmOutraAba = (evento: StorageEvent) => {
    if (evento.key === CHAVE) {
      cache = null
      aviso()
    }
  }

  window.addEventListener('storage', aoMudarEmOutraAba)

  return () => {
    ouvintes.delete(aviso)
    window.removeEventListener('storage', aoMudarEmOutraAba)
  }
}

export function useFavoritos() {
  const ids = useSyncExternalStore(assinar, ler, () => [])

  const alternar = useCallback((id: string) => {
    const atual = ler()
    gravar(atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id])
  }, [])

  const limpar = useCallback(() => gravar([]), [])

  return {
    ids,
    total: ids.length,
    estaSalvo: (id: string) => ids.includes(id),
    alternar,
    limpar,
  }
}
