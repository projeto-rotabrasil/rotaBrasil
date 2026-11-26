# 🗺️ RotaBrasil

Guia visual de **parques nacionais, praias, serras, cachoeiras e cidades do Brasil**: quase 300 destinos nos 27 estados, com mapa interativo, filtros, clima, feriadões e um roteiro pessoal para comparar lugares.

Projeto acadêmico de Sistemas de Informação.

## ✨ O que o site faz

- **Home** com capa de fotos, busca rápida, paisagens, destinos em destaque e a vitrine **Tesouros escondidos** (muda todo dia).
- **Mapa interativo do Brasil**: cada estado é pintado pela quantidade de destinos; clique (ou Tab + Enter) para ver a lista do estado.
- **Explorar**: busca por nome, filtros por tipo de lugar, região, estado, cidade, bioma e atividade, ordenação e "Mostrar mais". Os filtros ficam na URL, então qualquer busca pode ser compartilhada por link.
- **Página do destino**: dados rápidos, resumo da Wikipédia, galeria de fotos (abre em tela cheia, com o crédito de cada foto), mapa (OpenStreetMap), clima e previsão dos próximos dias, atrações próximas, feriadões e emendas, links de pacotes e destinos parecidos.
- **Feriadões e emendas**: calcula, a partir dos feriados nacionais, quais rendem 3 dias ou mais de folga e quais valem emendar.
- **Meu roteiro**: salve destinos com o coração (ficam no navegador) e compare duração, tipo de viagem, acesso e melhor época lado a lado.

## 🛠️ Tecnologias

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** (tema, cores e escala de títulos em `src/index.css`)
- **React Router 7** (páginas carregadas sob demanda)
- **Lucide React** (ícones) e **@svg-maps/brazil** (mapa)

### APIs e fontes (todas gratuitas e sem chave obrigatória)

| Uso | Fonte |
| --- | --- |
| Fotos dos destinos (com crédito) | [Wikimedia Commons](https://commons.wikimedia.org) |
| Resumo do destino | [Wikipédia](https://pt.wikipedia.org) (texto CC BY-SA 4.0) |
| Regiões e estados | [IBGE – Localidades](https://servicodados.ibge.gov.br/api/docs/localidades) |
| Feriados nacionais | [BrasilAPI](https://brasilapi.com.br) |
| Clima e previsão | [Open-Meteo](https://open-meteo.com) |
| Atrações próximas | Wikipédia (ou [OpenTripMap](https://opentripmap.io), se houver chave) |
| Mapa da página do destino | [OpenStreetMap](https://www.openstreetmap.org) |

## 🚀 Como rodar

Pré-requisito: Node.js 20 ou superior.

```bash
git clone https://github.com/projeto-rotabrasil/rotaBrasil.git
cd rotaBrasil
npm install
npm run dev
```

Abra **http://localhost:5173/rotaBrasil/** (o `/rotaBrasil/` faz parte do endereço por causa do GitHub Pages).

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run build` | Confere os tipos e gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run fotos` | Escolhe fotos livres para os destinos que ainda não têm (veja abaixo) |

### Variáveis de ambiente (opcional)

Copie `.env.example` para `.env`. A única variável é `VITE_OPENTRIPMAP_KEY`: sem ela, as atrações próximas vêm da Wikipédia. Qualquer variável `VITE_*` fica visível no código final do site.

## 📦 Publicação (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica a cada push na `main`:

1. `npm ci` e `npm run build` (o build falha se houver erro de tipo);
2. copia `dist/index.html` para `dist/404.html`: o GitHub Pages não conhece as rotas do React, e assim recarregar `/destino/maragogi` continua funcionando;
3. envia o `dist/` para o Pages.

Para ativar: em **Settings → Pages**, escolha **GitHub Actions** como fonte. Se quiser usar a chave da OpenTripMap em produção, cadastre o secret `VITE_OPENTRIPMAP_KEY` em **Settings → Secrets and variables → Actions**.

Se o repositório for renomeado, ajuste `base` em `vite.config.ts` e as URLs `og:url` / `og:image` em `index.html`.

## 🧭 Estrutura

```
src/
├── components/   Navbar, Footer, HeroHome, CardDestino, MapaBrasilInterativo, ClimaCard...
├── data/         destinos.json (o catálogo) e destinos.ts (tipos)
├── hooks/        useFavoritos (roteiro), useWikipediaResumo, useDocumentTitle
├── pages/        Home, Explorar, DestinoDetalhe, MeuRoteiro, NotFound
├── services/     IBGE, BrasilAPI, Open-Meteo, atrações
└── utils/        categorias, busca/biomas, feriadões, imagens (Wikimedia)
scripts/          fotos.mjs (escolha automática de fotos)
public/           ícones, manifest e imagem de compartilhamento
```

## ✍️ Como cadastrar ou melhorar um destino

O catálogo é o arquivo `src/data/destinos.json`. Os campos obrigatórios são `id`, `nome`, `estado`, `cidade`, `regiao`, `bioma`, `categoria`, `descricao`, `imagem`, `tags`, `tipoViagem`, `nivelAcesso` e `localizacao` (latitude e longitude). A `categoria` é uma destas: `parque-nacional`, `praia`, `ilha`, `cachoeira-canion`, `serra-chapada`, `rio-floresta`, `cidade-historica`, `cidade`, `lazer`.

Campos **opcionais**: `duracaoRecomendada`, `melhorEpoca`, `publicoIdeal`, `sobre`, `comoChegar`, `destaques`, `dicas`, `galeria`, `escondido` (selo "Tesouro escondido") e `wikipedia` (título do artigo na Wikipédia em português). Quando um campo não existe, a página simplesmente não mostra a seção. Se `sobre` estiver vazio, o texto "Sobre o destino" vem do resumo do artigo da Wikipédia indicado em `wikipedia`.

### Fotos

Nenhuma foto fica guardada no repositório. O script `scripts/fotos.mjs` escolhe, na Wikimedia Commons, fotos livres para cada destino e grava em `destinos.json` o link das miniaturas e os créditos: a capa vai em `imagem` + `imagemCredito` (autor, licença e página da foto) e até 6 fotos extras vão em `galeria`. Os créditos aparecem na página do destino. A escolha tem duas etapas:

1. **Relevância:** a foto precisa mostrar **um ponto turístico conhecido do destino**. Esses pontos ficam em `scripts/fotos-termos.json` (ex.: Jericoacoara → "Pedra Furada", Bonito → "Gruta do Lago Azul"). O script descarta logotipos, mapas, eventos, fotos de detalhe (peixe, escultura), imagens pequenas ou na vertical e homônimos de outros lugares.
2. **Beleza:** entre as relevantes, vence a mais bonita. O script analisa as cores de uma miniatura (em memória, sem salvar nada): céu azul, cores vivas, água turquesa e vegetação ganham pontos; céu cinza e encoberto, foto escura, rua e areia seca perdem.

```bash
npm run fotos                 # só destinos ainda sem foto com crédito
npm run fotos -- --id=bonito  # só um destino
npm run fotos -- --revisao    # também gera scripts/fotos-revisao.html para conferir as escolhas
```

Para destinos novos, acrescente em `scripts/fotos-termos.json` o que vale fotografar (um ponto turístico por item: a galeria mostra um lugar diferente por foto).

Revisão humana, depois de rodar o script:

- **Trocar a capa** de um destino: coloque o nome do arquivo da Commons em `scripts/fotos-escolhas.json` (`{ "bonito": "Nome do arquivo.jpg" }`).
- **Proibir uma foto** (pessoa em primeiro plano, detalhe, dia nublado...): acrescente o nome do arquivo em `scripts/fotos-bloqueadas.json`. Ela some da capa e das galerias.

Depois rode `npm run fotos -- --todos` (as buscas ficam em cache, então é rápido).

Quando um destino novo é cadastrado sem foto, o site mostra um fundo com as cores da marca até o script rodar.

## 🗒️ Observações

- **Login e cadastro foram removidos.** Eles dependiam de um backend (Flask + MySQL) que o GitHub Pages não consegue hospedar. O código antigo continua no histórico do Git.
- O roteiro é salvo no `localStorage` do navegador: não sincroniza entre dispositivos.
- As coordenadas dos destinos são aproximadas (vêm da Wikipédia): servem para mapa, clima e atrações próximas, não para navegação.
