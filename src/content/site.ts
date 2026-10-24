/**
 * The words of the site around the content read from GitHub: the bar, the home, the labels of each page
 * and the formats of dates and numbers. The site is in Brazilian Portuguese, like the community.
 */
import { blobUrl, ORGANIZATION, repositoryUrl } from './catalog'

export const LOCALE = 'pt-BR'

/** The time zone the dates of the site are shown in, the one most of the community lives in. */
const TIME_ZONE = 'America/Sao_Paulo'

export const SITE = {
  name: 'Back-End Brasil',
  github: `https://github.com/${ORGANIZATION}`,
  meta: {
    title: 'Back-End Brasil · Comunidade brasileira de backend',
    description:
      'A comunidade brasileira de pessoas desenvolvedoras backend: vagas, desafios, projetos open-source e fórum, em repositórios abertos no GitHub.',
    /** What the link-preview card shows, for a reader who cannot see it. */
    image: 'A capivara da Back-End Brasil ao lado do nome da comunidade',
  },
} as const

/** The id of the main landmark, which the skip link jumps to. */
export const MAIN_ID = 'conteudo'

function plural(count: number, one: string, many: string): string {
  return `${new Intl.NumberFormat(LOCALE).format(count)} ${count === 1 ? one : many}`
}

export const TEXT = {
  skipLink: 'Pular para o conteúdo',
  theme: { label: 'Tema', light: 'Tema claro', dark: 'Tema escuro' },
  nav: {
    label: 'Seções',
    home: 'Início',
    /** The name of the brand link, which begins with the wordmark it shows so a voice command can name it. */
    homeLink: 'backend brasil, início',
    search: 'Buscar nos desafios e nas vagas',
    /** The word on the search control of the bar, which the icon stands for where the bar is narrow. */
    searchShort: 'Buscar',
    menu: 'Menu',
    toTop: 'Voltar ao topo',
    github: 'Back-End Brasil no GitHub',
    crumbs: 'Você está aqui',
  },
  home: {
    eyebrow: 'Comunidade brasileira de backend',
    lede: 'Unimos pessoas desenvolvedoras backend, em qualquer nível de conhecimento, para discutir, trazer dúvidas e trocar experiências. Vagas, desafios e discussões ficam em aberto, nos repositórios da comunidade no GitHub.',
    solve: 'Resolver um desafio',
    jobs: 'Ver vagas',
    response: {
      label: 'A comunidade em números',
      path: '/comunidade.json',
      status: 'HTTP/1.1 200 OK',
      type: 'content-type: application/json; charset=utf-8',
      keys: { jobs: 'vagas_abertas', challenges: 'desafios', projects: 'projetos', stars: 'estrelas' },
      names: {
        jobs: 'Vagas abertas',
        challenges: 'Desafios',
        projects: 'Projetos',
        stars: 'Estrelas dos repositórios',
      },
    },
    repositoriesTitle: 'Repositórios',
    repositoriesLede:
      'Cada espaço da comunidade é um repositório público. Para participar, abra uma issue ou um pull request.',
    stars: (count: number) => plural(count, 'estrela', 'estrelas'),
    challengesTitle: 'Desafios',
    challengesLede:
      'Problemas de backend para resolver na linguagem que você quiser, ao lado das soluções que a comunidade já enviou.',
    jobsTitle: 'Vagas recentes',
    jobsLede: 'As últimas vagas abertas como issues em backend-br/vagas.',
    allJobs: 'Ver todas as vagas',
  },
  challenges: {
    title: 'Desafios',
    headline: 'Desafios de backend',
    lede: 'Problemas de backend para resolver na linguagem que você quiser. Cada desafio traz o enunciado, os requisitos e as soluções que a comunidade já enviou.',
    count: (count: number) => plural(count, 'desafio', 'desafios'),
    solutions: (count: number) => (count === 0 ? 'Nenhuma solução ainda' : plural(count, 'solução', 'soluções')),
    languages: (count: number) => plural(count, 'linguagem', 'linguagens'),
    /** The title of a challenge page for search engines and link previews. */
    headlineOf: (title: string) => `${title} · Desafio de backend`,
    statement: 'Enunciado no GitHub',
    contribute: 'Enviar uma solução',
    contributing: blobUrl('desafios', 'CONTRIBUTING.md'),
    communitySolutions: 'Soluções da comunidade',
    /** The mark of the first solution sent to a challenge. */
    first: 'Primeira solução',
    firstBy: 'Primeira solução por',
    noSolutions: 'Ninguém enviou uma solução para este desafio ainda. Siga o guia de contribuição e envie a primeira.',
  },
  jobs: {
    title: 'Vagas',
    headline: 'Vagas de backend',
    lede: 'Vagas de backend divulgadas como issues no repositório backend-br/vagas. Cada vaga leva à issue original no GitHub.',
    count: (count: number) => plural(count, 'vaga aberta', 'vagas abertas'),
    /** The heading of the list, which says when it holds only the newest of the openings. */
    listed: (shown: number, total: number) => (shown < total ? `As ${shown} mais recentes` : 'Mais recentes primeiro'),
    opened: 'Aberta',
    by: 'Publicada por',
    deleted: 'conta removida',
    /**
     * The title of the page of an opening for search engines and link previews, cut so that, with its number
     * and the name of the site after it, it stays within the 70 characters a result page shows whole. The
     * number tells apart openings posted with the same title.
     */
    headlineOf: (title: string, number: number) =>
      `${excerpt(title, 70 - ` · #${number} · ${SITE.name}`.length)} · #${number}`,
    ledeOf: (when: string) => `Publicada em ${when}.`,
    apply: 'Ver a vaga no GitHub',
    noBody: 'Esta vaga não traz descrição. Veja a issue no GitHub para saber mais.',
    post: 'Anunciar uma vaga',
    postUrl: `${repositoryUrl('vagas')}#como-cadastrar-uma-vaga`,
    all: 'Ver todas no GitHub',
    empty: 'Nenhuma vaga aberta agora. Acompanhe o repositório backend-br/vagas no GitHub para saber da próxima.',
  },
  projects: {
    title: 'Projetos open-source',
    headline: 'Projetos open-source brasileiros',
    lede: 'Projetos open-source brasileiros que a comunidade reúne em backend-br/opensource-br, dos mais estrelados aos menos, com filtro por linguagem.',
    count: (count: number) => plural(count, 'projeto', 'projetos'),
    add: 'Adicionar um projeto',
    addUrl: blobUrl('opensource-br', 'CONTRIBUTING.md'),
    list: 'Ver a lista no GitHub',
    languages: 'Filtrar por linguagem',
    all: 'Todas',
  },
  search: {
    title: 'Buscar nos desafios e nas vagas',
    lede: 'Procure um tema, uma tecnologia ou um requisito nos desafios e nas vagas abertas.',
    label: 'Termo de busca',
    placeholder: 'Ex.: token, Python, remoto',
    close: 'Fechar a busca',
    /** The keys that open the search from any page, shown beside the field. */
    shortcut: 'Ctrl K',
    idle: 'Digite pelo menos duas letras.',
    loading: 'Buscando...',
    empty: 'Nada encontrado. Tente outra palavra.',
    unavailable: 'Não foi possível carregar a busca. Recarregue a página e tente de novo.',
    count: 'Resultados: {count}',
  },
  notFound: {
    title: 'Página não encontrada',
    lede: 'Este endereço não existe ou mudou de lugar.',
    description:
      'Este endereço não existe ou mudou de lugar. Volte ao início para ver as vagas, os desafios e os projetos.',
    back: 'Voltar ao início',
  },
} as const

/** Answers a day as the community reads it, such as 20 de out. de 2026. */
export function day(instant: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: TIME_ZONE }).format(new Date(instant))
}

/** The length of a day, in milliseconds. */
const DAY = 86_400_000

/**
 * Answers how long ago a day was, the way a list of openings reads it: hoje, ontem, há 3 dias, há 2 semanas,
 * and the day itself, such as 12 de set., once it is a month or more behind. Days are counted in the time
 * zone of the site, so an opening posted late at night is not a day older than the community sees it.
 */
export function since(instant: string | Date, now: Date = new Date()): string {
  const calendar = (date: Date): number =>
    Date.parse(new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date))
  const days = Math.max(0, Math.round((calendar(now) - calendar(new Date(instant))) / DAY))
  if (days === 0) {
    return 'hoje'
  }
  if (days === 1) {
    return 'ontem'
  }
  if (days < 7) {
    return `há ${days} dias`
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  }
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: TIME_ZONE }).format(
    new Date(instant),
  )
}

/**
 * Answers a text cut to fit a limit, at the last whole word, with an ellipsis that says it goes on. Search
 * engines show about 160 characters of a description, and a text that fits is left as it is.
 */
export function excerpt(text: string, limit = 160): string {
  const plain = text.replace(/\s+/g, ' ').trim()
  if (plain.length <= limit) {
    return plain
  }
  const cut = plain.slice(0, limit - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`
}
