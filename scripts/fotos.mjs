#!/usr/bin/env node
/**
 * Escolhe uma foto livre (Wikimedia Commons) para cada destino e guarda o crédito.
 *
 * Nenhum arquivo é baixado: o script grava em src/data/destinos.json o link da miniatura
 * hospedada na Wikimedia (upload.wikimedia.org) e os dados de crédito (autor, licença, página).
 *
 * Uso:
 *   node scripts/fotos.mjs               só destinos que ainda não têm foto com crédito
 *   node scripts/fotos.mjs --todos       reavalia todos os destinos
 *   node scripts/fotos.mjs --id=bonito   só o destino indicado (pode repetir --id)
 *   node scripts/fotos.mjs --revisao     também gera scripts/fotos-revisao.html (para conferir as escolhas)
 *   node scripts/fotos.mjs --sem-estetica  só relevância (não analisa as cores das fotos)
 *
 * Como a foto é escolhida: primeiro a RELEVÂNCIA (o arquivo é mesmo do lugar? tem boa resolução,
 * está na horizontal, não é logo/mapa/evento?). Entre as candidatas relevantes, vence a mais BONITA,
 * medida pelas cores de uma miniatura (analisada em memória, nada é salvo): céu azul, cores vivas,
 * água turquesa e vegetação ganham pontos; céu cinza e encoberto, foto escura e areia seca perdem.
 *
 * Para trocar a foto de um destino, coloque o nome do arquivo da Commons em
 * scripts/fotos-escolhas.json, por exemplo:  { "bonito": "Rio da Prata - Bonito.jpg" }
 * e rode o script de novo com --id=bonito.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jpeg from 'jpeg-js'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARQ_DESTINOS = path.join(raiz, 'src', 'data', 'destinos.json')
const ARQ_GALERIAS = path.join(raiz, 'src', 'data', 'galerias.json')
const ARQ_ESCOLHAS = path.join(raiz, 'scripts', 'fotos-escolhas.json')
const ARQ_CACHE = path.join(raiz, 'scripts', 'fotos-cache.json')
const ARQ_ESTETICA = path.join(raiz, 'scripts', 'fotos-estetica.json')
const ARQ_TERMOS = path.join(raiz, 'scripts', 'fotos-termos.json')
const ARQ_BLOQUEADAS = path.join(raiz, 'scripts', 'fotos-bloqueadas.json')
const ARQ_REVISAO = path.join(raiz, 'scripts', 'fotos-revisao.html')

const args = process.argv.slice(2)
const todos = args.includes('--todos')
const revisao = args.includes('--revisao')
const semEstetica = args.includes('--sem-estetica')
const idsPedidos = args.filter((a) => a.startsWith('--id=')).map((a) => a.slice(5))

const LARGURA = 960 // tamanho padrão aceito pela Wikimedia
const LARGURA_MINIMA = 1100
const NOTA_MINIMA = 30

const HEADERS = { 'User-Agent': 'destinos-fotos/1.0 (script de curadoria de imagens livres)' }
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

const normalizar = (t) =>
  String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// ---------------------------------------------------------------- requisições

const cache = fs.existsSync(ARQ_CACHE) ? JSON.parse(fs.readFileSync(ARQ_CACHE, 'utf8')) : {}
let alteracoesCache = 0

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', ...params })}`
  if (cache[url]) return cache[url]

  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const r = await fetch(url, { headers: HEADERS })
    if (r.ok) {
      const json = await r.json()
      cache[url] = json
      if (++alteracoesCache % 15 === 0) fs.writeFileSync(ARQ_CACHE, JSON.stringify(cache))
      await pausa(700)
      return json
    }
    const espera = Number(r.headers.get('retry-after')) || 4 * (tentativa + 1)
    console.log(`  HTTP ${r.status}: aguardando ${espera}s`)
    await pausa(espera * 1000)
  }
  throw new Error('API indisponível: ' + url)
}

const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const WIKIPEDIA = 'https://pt.wikipedia.org/w/api.php'

// -------------------------------------------------------------------- candidatas

function textoLimpo(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lerCandidata(pagina) {
  const info = pagina.imageinfo?.[0]
  if (!info) return null

  const meta = info.extmetadata ?? {}
  return {
    titulo: pagina.title.replace(/^(File|Arquivo):/i, ''),
    mime: info.mime,
    largura: info.width,
    altura: info.height,
    miniatura: info.thumburl ?? info.url,
    pagina: info.descriptionurl,
    autor: textoLimpo(meta.Artist?.value) || 'Autor desconhecido',
    licenca: textoLimpo(meta.LicenseShortName?.value) || '',
    descricao: textoLimpo(meta.ImageDescription?.value),
    categorias: textoLimpo(meta.Categories?.value),
  }
}

const PROPS_IMAGEM = {
  prop: 'imageinfo',
  iiprop: 'url|size|mime|extmetadata',
  iiurlwidth: String(LARGURA),
  iiextmetadatafilter: 'Artist|LicenseShortName|ImageDescription|Categories',
}

async function buscaNaCommons(consulta) {
  const j = await api(COMMONS, {
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${consulta} filetype:bitmap`,
    gsrlimit: '40',
    ...PROPS_IMAGEM,
  })
  return Object.values(j.query?.pages ?? {}).map(lerCandidata).filter(Boolean)
}

async function arquivoDaCommons(nomeArquivo) {
  const j = await api(COMMONS, {
    action: 'query',
    titles: `File:${nomeArquivo.replace(/^(File|Arquivo):/i, '')}`,
    ...PROPS_IMAGEM,
  })
  const pagina = Object.values(j.query?.pages ?? {})[0]
  return pagina && pagina.missing === undefined ? lerCandidata(pagina) : null
}

/**
 * Imagem principal do artigo da Wikipédia de cada destino, em lotes (poucas requisições):
 * devolve um Map  id do destino -> candidata.
 */
async function imagensPrincipaisDaWikipedia(lista) {
  const principais = new Map()
  const comArtigo = lista.filter((d) => d.wikipedia)

  // 1) arquivo da imagem principal de cada artigo
  const arquivoPorId = new Map()
  for (let i = 0; i < comArtigo.length; i += 40) {
    const lote = comArtigo.slice(i, i + 40)
    const j = await api(WIKIPEDIA, {
      action: 'query',
      prop: 'pageimages',
      piprop: 'name',
      titles: lote.map((d) => d.wikipedia).join('|'),
      redirects: '1',
    })
    const q = j.query ?? {}
    const normalizado = new Map((q.normalized ?? []).map((n) => [n.from, n.to]))
    const redirecionado = new Map((q.redirects ?? []).map((n) => [n.from, n.to]))
    const paginas = Object.values(q.pages ?? {})

    for (const d of lote) {
      let titulo = normalizado.get(d.wikipedia) ?? d.wikipedia
      titulo = redirecionado.get(titulo) ?? titulo
      const pagina = paginas.find((p) => p.title === titulo)
      if (pagina?.pageimage) arquivoPorId.set(d.id, pagina.pageimage)
    }
  }

  // 2) dados (tamanho, autor, licença) desses arquivos na Commons
  const arquivos = [...new Set(arquivoPorId.values())]
  const infoPorArquivo = new Map()
  for (let i = 0; i < arquivos.length; i += 40) {
    const lote = arquivos.slice(i, i + 40)
    const j = await api(COMMONS, {
      action: 'query',
      titles: lote.map((a) => `File:${a}`).join('|'),
      ...PROPS_IMAGEM,
    })
    const q = j.query ?? {}
    const normalizado = new Map((q.normalized ?? []).map((n) => [n.from, n.to]))
    for (const arquivo of lote) {
      const titulo = normalizado.get(`File:${arquivo}`) ?? `File:${arquivo}`
      const pagina = Object.values(q.pages ?? {}).find((p) => p.title === titulo)
      const candidata = pagina && pagina.missing === undefined ? lerCandidata(pagina) : null
      if (candidata) infoPorArquivo.set(arquivo, candidata)
    }
  }

  for (const [id, arquivo] of arquivoPorId) {
    if (infoPorArquivo.has(arquivo)) principais.set(id, infoPorArquivo.get(arquivo))
  }
  return principais
}

// ------------------------------------------------------------------- pontuação

// Os testes rodam sobre texto normalizado (minúsculas, sem acentos).
// Arquivos que não são "foto do lugar": logos, mapas, desenhos, estações de metrô, etc.
const NAO_SERVE =
  /(logo|logotipo|\bmapa\b|\bmap\b|brasao|bandeira|\bflag\b|\bselo\b|escudo|gravura|desenho|pintura|cartaz|poster|diagrama|esquema|planta|\bcapa\b|infogr|screenshot|placa|folder|panfleto|emblema|coat of arms|locator|location|mosaico|collage|colagem|retrato|portrait|selfie|\bsvg\b|\bstation\b|\bmetro\b|subway|\blinha\b|estacao (?:de )?(?:metro|trem)|sinalizacao|covid|atendimento|vacina|black and white|preto e branco|onibus|\bbus\b|airport|aeroporto|\bcar\b|carro)/

// Imagens de satélite e homônimos de fora do Brasil (ex.: "Santa Teresa" é igreja em Madri)
const SATELITE_OU_ESTRANGEIRO =
  /(\biss\d*\b|\bnasa\b|satelite|satellite|landsat|modis|sentinel|espana|madrid|lisboa|portugal|mexico|argentina|chile|colombia|italia|francia|france|spain|usa|estados unidos)/

// Fotos de eventos oficiais e de pessoas (comuns nos arquivos de órgãos públicos)
const EVENTO_NO_TITULO =
  /(\bvisita\b|\bvisits?\b|discurs|palestra|reuniao|encontro com|cerimonia|\bposse\b|entrevista|\bevento\b|\bshow\b|campanha|manifesta|assinatura|lancamento|inauguracao|homenagem|medalha|premiacao|jogadores|jugadores|torcedores|\bpartida\b|\bmatch\b|capoeira|crianca|criancas|alunos|\bturma\b|\bdanca\b|desfile|tocha|revezamento|olimpic\w*|incendios?|queimadas?|\bfire\b|\bfogo\b|poeira|\bdust\b|enchente|flood|lixo|garbage|\bchuva\b|\brain\b|chuvoso|concert|cantora?|singer|vanessa da mata|militar|marinha|inspecao|policia|exercito|entrada)/
const PESSOAS_NA_DESCRICAO = /(presidente|governador|prefeit|deputad|senador|ministr|secretari)/

const PALAVRAS_FRACAS = new Set(['parque', 'nacional', 'praia', 'ilha', 'serra', 'chapada', 'cidade', 'vila', 'museu', 'estadual', 'reserva', 'monumento', 'natural', 'cachoeira', 'forte', 'centro', 'historico', 'santuario', 'basilica'])

// "O que fotografar": os pontos turísticos mais conhecidos de cada destino (scripts/fotos-termos.json).
const termosDeFoto = fs.existsSync(ARQ_TERMOS) ? JSON.parse(fs.readFileSync(ARQ_TERMOS, 'utf8')) : {}
const PALAVRAS_VAZIAS = new Set(['de', 'do', 'da', 'dos', 'das', 'em', 'na', 'no', 'e', 'the', 'of'])
const palavrasDe = (texto) =>
  normalizar(texto).split(/[^a-z0-9]+/).filter((p) => p.length > 2 && !PALAVRAS_VAZIAS.has(p))

/**
 * Quanto do ponto turístico procurado aparece no arquivo (0 a 1). Vale só o que identifica o ponto:
 * em "Pedra Furada Jericoacoara", "pedra" e "furada" (o nome do destino já é medido à parte).
 */
function acertoDoPontoTuristico(destino, tituloNorm, descNorm) {
  const doDestino = new Set([...palavrasDe(destino.nome), ...palavrasDe(destino.cidade), ...palavrasDe(destino.estado)])
  let melhor = 0
  let indice = -1

  for (const [i, termo] of (termosDeFoto[destino.id] ?? []).entries()) {
    const todas = palavrasDe(termo)
    const proprias = todas.filter((p) => !doDestino.has(p))
    const alvo = proprias.length ? proprias : todas
    if (!alvo.length) continue

    const noTitulo = alvo.filter((p) => tituloNorm.includes(p)).length / alvo.length
    const naDescricao = alvo.filter((p) => descNorm.includes(p)).length / alvo.length
    const fracao = Math.max(noTitulo, 0.6 * naDescricao)
    if (fracao > melhor) {
      melhor = fracao
      indice = i
    }
  }

  // "indice" diz qual ponto turístico a foto mostra (-1 = nenhum em especial): usado para a galeria variar
  return { fracao: melhor, indice: melhor >= 0.5 ? indice : -1 }
}

/** Qual ponto turístico (índice em fotos-termos.json) a foto mostra, ou -1. */
function pontoDaFoto(c, destino) {
  return acertoDoPontoTuristico(destino, normalizar(c.titulo), normalizar(c.descricao)).indice
}

function pontuar(c, destino, ehPrincipal) {
  if (c.mime !== 'image/jpeg') return -Infinity
  if (!c.licenca) return -Infinity
  if (c.largura < LARGURA_MINIMA) return -Infinity

  const tituloNorm = normalizar(c.titulo)
  const descNorm = normalizar(c.descricao)
  const categoriasNorm = normalizar(c.categorias)
  if (NAO_SERVE.test(tituloNorm)) return -Infinity
  if (SATELITE_OU_ESTRANGEIRO.test(`${tituloNorm} ${descNorm.slice(0, 160)}`)) return -Infinity
  if (EVENTO_NO_TITULO.test(tituloNorm) || PESSOAS_NA_DESCRICAO.test(descNorm)) return -Infinity

  const razao = c.largura / c.altura
  if (razao < 1.15) return -Infinity // foto em pé não serve para capa

  let nota = 0

  // resolução (até +15)
  nota += Math.min(15, (c.largura - LARGURA_MINIMA) / 200)

  // proporção ideal (paisagem 3:2 a 16:9)
  if (razao >= 1.3 && razao <= 1.9) nota += 10
  else if (razao > 2.6) nota -= 20

  // foto escolhida pelos editores como imagem principal do artigo
  if (ehPrincipal) nota += 30

  // o nome do destino aparece no nome ou na descrição do arquivo?
  const palavras = normalizar(destino.nome)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 3 && !PALAVRAS_FRACAS.has(p))
  const alvo = palavras.length ? palavras : normalizar(destino.nome).split(/[^a-z0-9]+/).filter((p) => p.length > 2)
  const acertosTitulo = alvo.filter((p) => tituloNorm.includes(p)).length
  const acertosDesc = alvo.filter((p) => descNorm.includes(p)).length
  nota += 25 * (acertosTitulo / Math.max(alvo.length, 1))
  nota += 8 * (acertosDesc / Math.max(alvo.length, 1))

  // O arquivo mostra um dos pontos turísticos conhecidos do destino? É o que mais conta.
  const acertoPonto = acertoDoPontoTuristico(destino, tituloNorm, descNorm).fracao
  nota += 35 * acertoPonto

  if (!ehPrincipal && acertosTitulo === 0 && acertosDesc === 0 && acertoPonto === 0) return -Infinity

  // O arquivo fala do estado ou da cidade do destino? Sem isso, pode ser um homônimo
  // (ex.: "Marechal Deodoro" é cidade em Alagoas e estação de metrô em São Paulo).
  // (A cidade só vale como contexto quando não é o próprio nome do destino: senão "Marechal
  // Deodoro" sempre "confirmaria" a si mesmo.)
  const cidadeNorm = normalizar(destino.cidade)
  const contexto = `${tituloNorm} ${descNorm} ${categoriasNorm}`
  const cidadeEhOutraInformacao = cidadeNorm.length > 3 && !normalizar(destino.nome).includes(cidadeNorm)
  const temContexto =
    contexto.includes(normalizar(destino.estado)) || (cidadeEhOutraInformacao && contexto.includes(cidadeNorm))
  nota += temContexto ? 8 : -22

  // Detalhes, bichos e plantas de perto não mostram o lugar: a capa deve ser uma vista do destino
  if (/\b(detalhe|detail|close-?up|macro|peixes?|fish|escultura|sculpture|estatua|planta|plant|flor|flores|flower|passaros?|aves?|bird|insetos?|insect|borboleta|butterfly|aranha|spider|tartaruga|turtle|sargentinho)\b/.test(tituloNorm)) {
    nota -= 25
  }

  // Fotos noturnas e de origem conhecida por baixa qualidade pontuam menos
  if (/\b(noite|night|natal|christmas|iluminad\w*)\b/.test(tituloNorm)) nota -= 20
  if (/panoramio/.test(tituloNorm)) nota -= 15

  // Para lugares de natureza, foto de construção ou de gente reunida não é a melhor capa
  const ehNatureza = ['parque-nacional', 'praia', 'ilha', 'cachoeira-canion', 'serra-chapada', 'rio-floresta'].includes(
    destino.categoria
  )
  if (ehNatureza && /\b(escolas?|school|comunidades?|community|hotel|pousada|restaurante|predios?|building|igreja|church|praca|rua|avenida|queijos?|cheese|comida|prato|food)\b/.test(tituloNorm)) {
    nota -= 25
  }

  // fotos reconhecidas pela comunidade
  if (/quality images|featured pictures|valued images/i.test(c.categorias)) nota += 12

  return nota
}

// ------------------------------------------------------------------------ estética

// Medidas de cor de cada foto, guardadas por arquivo (assim dá para ajustar os pesos sem baixar tudo de novo).
const esteticaCache = fs.existsSync(ARQ_ESTETICA) ? JSON.parse(fs.readFileSync(ARQ_ESTETICA, 'utf8')) : {}
let alteracoesEstetica = 0

async function miniaturaEmMemoria(candidata) {
  // Miniatura de 250 px (tamanho padrão da Wikimedia). O arquivo é lido em memória, nada é gravado em disco.
  const url = candidata.miniatura.replace(/\/\d+px-/, '/250px-')

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const r = await fetch(url, { headers: HEADERS })
    if (r.ok) {
      await pausa(120)
      return Buffer.from(await r.arrayBuffer())
    }
    const espera = Number(r.headers.get('retry-after')) || 5 * (tentativa + 1)
    console.log(`  miniatura HTTP ${r.status}: aguardando ${espera}s`)
    await pausa(espera * 1000)
  }
  return null
}

function medirImagem(buffer) {
  const { width: w, height: h, data } = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 })
  const passo = Math.max(1, Math.floor(w / 90))
  const limiteDoTopo = h * 0.42

  let n = 0, topo = 0
  let somaV = 0, somaS = 0
  let ceu = 0, nublado = 0, branco = 0
  let agua = 0, verde = 0, quente = 0, escuro = 0, estourado = 0, cinza = 0, ceuTotal = 0

  for (let y = 0; y < h; y += passo) {
    for (let x = 0; x < w; x += passo) {
      const i = (y * w + x) * 4
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
      const v = max
      const s = max === 0 ? 0 : d / max

      let matiz = 0
      if (d > 0) {
        if (max === r) matiz = ((g - b) / d) % 6
        else if (max === g) matiz = (b - r) / d + 2
        else matiz = (r - g) / d + 4
        matiz *= 60
        if (matiz < 0) matiz += 360
      }

      n++
      somaV += v
      somaS += s
      if (v < 0.2) escuro++
      if (v > 0.94 && s < 0.08) estourado++
      if (matiz >= 75 && matiz <= 160 && s > 0.22 && v > 0.18) verde++
      if (matiz >= 160 && matiz <= 215 && s > 0.3 && v > 0.35) agua++
      if (matiz >= 15 && matiz <= 50 && s > 0.18 && s < 0.75) quente++
      if (s < 0.14 && v >= 0.2 && v < 0.85) cinza++ // asfalto, concreto, tempo fechado
      if (matiz >= 185 && matiz <= 255 && s > 0.22 && v > 0.4) ceuTotal++ // azul em qualquer parte do quadro

      if (y < limiteDoTopo) {
        topo++
        if (matiz >= 185 && matiz <= 255 && s > 0.22 && v > 0.4) ceu++
        else if (s < 0.14 && v >= 0.38 && v < 0.84) nublado++ // cinza: céu encoberto
        else if (s < 0.14 && v >= 0.84) branco++ // nuvem branca (não é problema)
      }
    }
  }

  const r3 = (x) => Math.round(x * 1000) / 1000
  return {
    v: r3(somaV / n), s: r3(somaS / n), ceu: r3(ceu / topo), nublado: r3(nublado / topo), branco: r3(branco / topo),
    agua: r3(agua / n), verde: r3(verde / n), quente: r3(quente / n), escuro: r3(escuro / n), estourado: r3(estourado / n),
    cinza: r3(cinza / n), ceuTotal: r3(ceuTotal / n),
  }
}

// Palavra acrescentada à busca, conforme o tipo de lugar
const PALAVRA_DE_BUSCA = {
  'parque-nacional': 'paisagem',
  praia: 'praia',
  ilha: 'praia',
  'cachoeira-canion': 'cachoeira',
  'serra-chapada': 'serra',
  'rio-floresta': 'rio',
  'cidade-historica': 'centro histórico',
  cidade: 'vista',
}

const limitar = (x, min, max) => Math.max(min, Math.min(max, x))
const TIPOS_DE_NATUREZA = ['parque-nacional', 'praia', 'ilha', 'cachoeira-canion', 'serra-chapada', 'rio-floresta']
const TIPOS_COM_AGUA = ['praia', 'ilha', 'rio-floresta', 'cachoeira-canion']

/** Transforma as medidas de cor em uma nota de beleza (de uns -60 a uns +90). */
function notaEstetica(m, destino) {
  const natureza = TIPOS_DE_NATUREZA.includes(destino.categoria)
  let e = 0

  // luz: nem escura, nem estourada
  if (m.v < 0.3) e -= 25
  else if (m.v < 0.4) e -= 10
  else if (m.v <= 0.78) e += 6
  else if (m.v > 0.86) e -= 8

  // cores vivas
  e += 35 * limitar((m.s - 0.15) / 0.3, 0, 1)

  // céu azul (tempo bonito) x céu cinza e encoberto
  e += 30 * Math.min(1, m.ceu / 0.45)
  e -= (natureza ? 45 : 22) * Math.min(1, m.nublado / 0.4)

  // água azul-turquesa e vegetação viva
  if (TIPOS_COM_AGUA.includes(destino.categoria)) e += 14 * Math.min(1, m.agua / 0.25)
  if (natureza) e += 10 * Math.min(1, m.verde / 0.3)

  // Praia, ilha e serra sem céu aparecendo costumam ser fotos de detalhe (peixe, pedra, areia de perto)
  if (['praia', 'ilha', 'serra-chapada'].includes(destino.categoria) && m.ceu < 0.08 && m.nublado < 0.08 && m.branco < 0.1) {
    e -= 18
  }

  // quadro dominado por azul (céu ou água): costuma ser um detalhe contra o céu, sem mostrar o lugar
  // (nas praias o azul do mar também conta, então o limite é mais alto)
  const limiteDeAzul = ['praia', 'ilha'].includes(destino.categoria) ? 0.7 : 0.5
  if ((m.ceuTotal ?? 0) > limiteDeAzul) e -= ((m.ceuTotal ?? 0) - limiteDeAzul) * 90

  // quadro dominado por areia/terra seca
  if (m.quente > 0.5) e -= (m.quente - 0.5) * 50

  // muito cinza (rua, concreto, tempo fechado) não combina com lugar de natureza
  if (natureza) e -= 35 * limitar((m.cinza - 0.25) / 0.3, 0, 1)

  // muito escura ou com muito branco estourado
  if (m.escuro > 0.35) e -= 20 * Math.min(1, (m.escuro - 0.35) / 0.3)
  if (m.estourado > 0.25) e -= 12

  return Math.round(e)
}

async function medidasDaCandidata(candidata) {
  if (esteticaCache[candidata.titulo]) return esteticaCache[candidata.titulo]

  const buffer = await miniaturaEmMemoria(candidata)
  if (!buffer) return null

  let medidas = null
  try {
    medidas = medirImagem(buffer)
  } catch (erro) {
    console.log(`  (não consegui analisar ${candidata.titulo}: ${erro.message})`)
    return null
  }

  esteticaCache[candidata.titulo] = medidas
  if (++alteracoesEstetica % 20 === 0) fs.writeFileSync(ARQ_ESTETICA, JSON.stringify(esteticaCache))
  return medidas
}

/**
 * Galeria (até 6 fotos além da capa), mostrando LUGARES DIFERENTES do destino:
 * a melhor foto de cada ponto turístico, no máximo 2 fotos "gerais" e 2 do mesmo autor.
 * Recebe as candidatas já ordenadas da mais para a menos indicada (a primeira é a capa).
 */
function montarGaleria(ordenadas) {
  const [capa, ...resto] = ordenadas
  const pontosUsados = new Set(capa.ponto >= 0 ? [capa.ponto] : [])
  const porAutor = new Map([[capa.c.autor, 1]])
  let gerais = capa.ponto < 0 ? 1 : 0
  const escolhidas = []

  const bonita = (x) => semEstetica || x.estetica >= 10
  const autorLivre = (x) => (porAutor.get(x.c.autor) ?? 0) < 2

  function aceitar(x) {
    escolhidas.push(x)
    porAutor.set(x.c.autor, (porAutor.get(x.c.autor) ?? 0) + 1)
    if (x.ponto >= 0) pontosUsados.add(x.ponto)
    else gerais++
  }

  // 1º) um lugar novo por foto
  for (const x of resto) {
    if (escolhidas.length >= 6) break
    if (bonita(x) && x.ponto >= 0 && !pontosUsados.has(x.ponto) && autorLivre(x)) aceitar(x)
  }

  // 2º) completa com vistas gerais do destino (no máximo 2 no total)
  for (const x of resto) {
    if (escolhidas.length >= 6) break
    if (bonita(x) && x.ponto < 0 && gerais < 2 && autorLivre(x) && !escolhidas.includes(x)) aceitar(x)
  }

  return escolhidas.map((x) => x.c)
}

/** Dados de crédito gravados junto de cada foto (exigidos pelas licenças livres). */
function credito(foto) {
  return {
    autor: foto.autor.slice(0, 90),
    licenca: foto.licenca,
    url: foto.pagina,
    largura: foto.largura,
  }
}

// ------------------------------------------------------------------------ main

const destinos = JSON.parse(fs.readFileSync(ARQ_DESTINOS, 'utf8'))

// As galerias ficam num arquivo à parte: o site só baixa esse arquivo na página de um destino.
const galerias = fs.existsSync(ARQ_GALERIAS) ? JSON.parse(fs.readFileSync(ARQ_GALERIAS, 'utf8')) : {}

function salvarDados() {
  fs.writeFileSync(ARQ_DESTINOS, JSON.stringify(destinos, null, 2) + '\n')
  const ordenadas = Object.fromEntries(Object.keys(galerias).sort().map((id) => [id, galerias[id]]))
  fs.writeFileSync(ARQ_GALERIAS, JSON.stringify(ordenadas, null, 2) + '\n')
}
const escolhasManuais = fs.existsSync(ARQ_ESCOLHAS) ? JSON.parse(fs.readFileSync(ARQ_ESCOLHAS, 'utf8')) : {}

const alvos = destinos.filter((d) => {
  if (idsPedidos.length) return idsPedidos.includes(d.id)
  return todos || !d.imagemCredito
})

console.log(`${alvos.length} de ${destinos.length} destinos para processar`)
const principais = await imagensPrincipaisDaWikipedia(alvos)
console.log(`Imagens principais dos artigos: ${principais.size}`)

// Uma foto não deve aparecer em dois destinos (ex.: Miranda e Pantanal Sul com a mesma foto).
const fotoUsadaPor = new Map(
  destinos.filter((d) => d.imagemCredito).map((d) => [d.imagemCredito.url, d.id])
)
const usadaPorOutro = (candidata, destino) => {
  const dono = fotoUsadaPor.get(candidata.pagina)
  return Boolean(dono && dono !== destino.id)
}

// Fotos que nunca devem ser usadas (revisão humana): nomes de arquivo da Commons
const bloqueadas = new Set(
  fs.existsSync(ARQ_BLOQUEADAS) ? JSON.parse(fs.readFileSync(ARQ_BLOQUEADAS, 'utf8')).arquivos ?? [] : []
)

const resumo = new Map() // id -> { escolhida, alternativas }
let comFoto = 0
let semFoto = []

for (const [i, destino] of alvos.entries()) {
  process.stdout.write(`[${i + 1}/${alvos.length}] ${destino.nome} ... `)

  try {
    let escolhida = null
    let alternativas = []
    let origem = ''
    let nota = 0
    let estetica = 0
    let galeria = []

    // Capa escolhida à mão (scripts/fotos-escolhas.json): a galeria continua sendo montada automaticamente
    let capaManual = null
    if (escolhasManuais[destino.id]) {
      capaManual = await arquivoDaCommons(escolhasManuais[destino.id])
      if (!capaManual) console.log(`(arquivo manual não encontrado: ${escolhasManuais[destino.id]})`)
    }

    {
      const candidatas = new Map()

      // 1) Candidatas: a imagem principal do artigo da Wikipédia (já buscada em lote) e a busca na Commons.
      const principal = principais.get(destino.id)
      if (principal) candidatas.set(principal.titulo, { c: principal, principal: true })

      const viaveisAteAgora = () =>
        [...candidatas.values()].filter(({ c, principal }) => pontuar(c, destino, principal) >= NOTA_MINIMA).length

      // Além do nome, buscamos o tipo de paisagem ("Bonito rio"), que traz fotos mais bonitas que "Bonito MS".
      // Primeiro os pontos turísticos conhecidos (fotos-termos.json), depois o nome do destino.
      const palavraDoTipo = PALAVRA_DE_BUSCA[destino.categoria] ?? ''
      const juntar = (resultado) => {
        for (const c of resultado) {
          if (!candidatas.has(c.titulo)) candidatas.set(c.titulo, { c, principal: false })
        }
      }

      // Todos os pontos turísticos são buscados (a galeria precisa de lugares diferentes)...
      for (const termo of (termosDeFoto[destino.id] ?? []).slice(0, 7)) {
        juntar(await buscaNaCommons(termo))
      }

      // ...e o nome do destino só enquanto faltar candidata
      const consultasGerais = [
        `${destino.nome} ${destino.cidade}`,
        palavraDoTipo && `${destino.nome} ${palavraDoTipo}`,
        `${destino.nome} ${destino.estado}`,
        destino.nome,
      ].filter(Boolean)

      for (const consulta of consultasGerais) {
        if (viaveisAteAgora() >= 8) break // já há por onde escolher
        juntar(await buscaNaCommons(consulta))
      }

      // 2) Relevância: só entram as candidatas que são mesmo do lugar.
      //    Até 3 por ponto turístico, para a beleza ser comparada entre lugares diferentes.
      const porPonto = new Map()
      for (const x of [...candidatas.values()]
        .filter(({ c }) => !usadaPorOutro(c, destino) && !bloqueadas.has(c.titulo))
        .map(({ c, principal }) => ({ c, principal, nota: pontuar(c, destino, principal), ponto: pontoDaFoto(c, destino) }))
        .filter((x) => x.nota >= NOTA_MINIMA)
        .sort((a, b) => b.nota - a.nota)) {
        const lista = porPonto.get(x.ponto) ?? []
        if (lista.length < 3) lista.push(x)
        porPonto.set(x.ponto, lista)
      }
      const relevantes = [...porPonto.values()].flat().slice(0, 24)

      // 3) Beleza: entre as relevantes, vence a mais bonita (céu azul, cores vivas, nada de tempo fechado).
      for (const item of relevantes) {
        const medidas = semEstetica ? null : await medidasDaCandidata(item.c)
        item.estetica = medidas ? notaEstetica(medidas, destino) : 0
        item.final = item.nota + 1.5 * item.estetica
      }
      relevantes.sort((a, b) => b.final - a.final)

      // Capa manual vai para a frente (e sai do meio das outras, para não repetir na galeria)
      if (capaManual) {
        const resto = relevantes.filter((x) => x.c.titulo !== capaManual.titulo)
        relevantes.splice(0, relevantes.length, {
          c: capaManual,
          principal: false,
          nota: 0,
          estetica: 0,
          ponto: pontoDaFoto(capaManual, destino),
        }, ...resto)
      }

      if (relevantes.length) {
        escolhida = relevantes[0].c
        alternativas = relevantes.slice(1, 5).map((x) => x.c)
        galeria = montarGaleria(relevantes)
        origem = capaManual ? 'manual' : relevantes[0].principal ? 'artigo' : 'busca'
        nota = Math.round(relevantes[0].nota)
        estetica = relevantes[0].estetica
      }
    }

    if (escolhida) {
      if (destino.imagemCredito) fotoUsadaPor.delete(destino.imagemCredito.url)
      fotoUsadaPor.set(escolhida.pagina, destino.id)
      destino.imagem = escolhida.miniatura
      destino.imagemCredito = credito(escolhida)

      if (galeria.length) {
        galerias[destino.id] = galeria.map((foto) => ({ imagem: foto.miniatura, credito: credito(foto) }))
      } else {
        delete galerias[destino.id]
      }
      resumo.set(destino.id, { escolhida, alternativas, origem, nota, estetica })
      comFoto++
      console.log(`✔ ${escolhida.titulo} (relevância ${nota}, beleza ${estetica})`)
    } else {
      // Uma escolha antiga que não passa mais nos critérios deixa de valer
      if (destino.imagemCredito) {
        delete destino.imagemCredito
        destino.imagem = ''
      }
      delete galerias[destino.id]
      semFoto.push(destino.nome)
      console.log('✘ nenhuma candidata boa')
    }
  } catch (erro) {
    semFoto.push(destino.nome)
    console.log('erro:', erro.message)
  }

  if ((i + 1) % 10 === 0) salvarDados()
}

fs.writeFileSync(ARQ_CACHE, JSON.stringify(cache))
fs.writeFileSync(ARQ_ESTETICA, JSON.stringify(esteticaCache))
salvarDados()

console.log(`\nComFoto: ${comFoto} | Sem foto: ${semFoto.length}`)
if (semFoto.length) console.log('Sem foto:', semFoto.join(' | '))

// ---------------------------------------------------------------- página de revisão

if (revisao) {
  const miniatura = (url, w) => url.replace(/\/\d+px-([^/]+)$/, `/${w}px-$1`)
  // Primeiro as escolhas mais arriscadas (vindas da busca ou com nota baixa), depois as demais
  const risco = (d) => {
    const r = resumo.get(d.id)
    if (!r) return 0
    return r.origem === 'busca' ? 1 : r.nota < 55 ? 2 : 3
  }
  const ordenados = [...destinos].sort((a, b) => risco(a) - risco(b))

  const cartoes = ordenados
    .map((d) => {
      const r = resumo.get(d.id)
      const alternativas = (r?.alternativas ?? [])
        .map(
          (a) => `<figure><img loading="lazy" src="${miniatura(a.miniatura, 250)}" alt=""><figcaption>${a.titulo}</figcaption></figure>`
        )
        .join('')

      return `<article>
  <h2>${d.nome} <small>${d.cidade}/${d.estado} · ${d.id}</small></h2>
  ${d.imagem ? `<img class="principal" loading="lazy" src="${miniatura(d.imagem, 330)}" alt="">` : '<div class="vazio">sem foto</div>'}
  <p class="arquivo">${r ? `<b>${r.origem}</b> · relevância ${r.nota} · beleza ${r.estetica} · ${r.escolhida.titulo}` : d.imagemCredito ? '(já definida)' : ''}</p>
  <div class="alternativas">${alternativas}</div>
</article>`
    })
    .join('\n')

  fs.writeFileSync(
    ARQ_REVISAO,
    `<!doctype html><meta charset="utf-8"><title>Revisão das fotos</title>
<style>
body{font:14px system-ui;margin:16px;background:#f4f4f4}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
article{background:#fff;padding:10px;border-radius:10px}
h2{font-size:14px;margin:0 0 6px}small{color:#666;font-weight:400;display:block}
.principal{width:100%;height:170px;object-fit:cover;border-radius:6px}
.vazio{height:170px;display:grid;place-items:center;background:#eee;color:#999}
.arquivo{font-size:11px;color:#333;word-break:break-all;margin:6px 0}
.alternativas{display:flex;gap:4px;flex-wrap:wrap}
figure{margin:0;width:58px}figure img{width:58px;height:40px;object-fit:cover;border-radius:3px}
figcaption{font-size:8px;line-height:1.1;color:#777;word-break:break-all;max-height:36px;overflow:hidden}
</style><h1>Revisão das fotos (${destinos.length} destinos)</h1><main>${cartoes}</main>`
  )
  console.log('Página de revisão:', ARQ_REVISAO)
}
