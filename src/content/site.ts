import { blobUrl, ORGANIZATION, repositoryUrl } from './catalog'

export const LOCALE = 'pt-BR'

const TIME_ZONE = 'America/Sao_Paulo'

export const SITE = {
  name: 'Back-End Brasil',
  github: `https://github.com/${ORGANIZATION}`,
  meta: {
    title: 'Back-End Brasil · Comunidade brasileira de backend',
    description:
      'A comunidade brasileira de pessoas desenvolvedoras backend: vagas, desafios, projetos open-source e fórum, em repositórios abertos no GitHub.',
    image: 'A capivara da Back-End Brasil ao lado do nome da comunidade',
  },
} as const

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
    homeLink: 'backend brasil, início',
    search: 'Buscar nos desafios e nas vagas',
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
    headlineOf: (title: string) => `${title} · Desafio de backend`,
    statement: 'Enunciado no GitHub',
    contribute: 'Enviar uma solução',
    contributing: blobUrl('desafios', 'CONTRIBUTING.md'),
    communitySolutions: 'Soluções da comunidade',
    first: 'Primeira solução',
    firstBy: 'Primeira solução por',
    noSolutions: 'Ninguém enviou uma solução para este desafio ainda. Siga o guia de contribuição e envie a primeira.',
  },
  jobs: {
    title: 'Vagas',
    headline: 'Vagas de backend',
    lede: 'Vagas de backend divulgadas como issues no repositório backend-br/vagas. Cada vaga leva à issue original no GitHub.',
    count: (count: number) => plural(count, 'vaga aberta', 'vagas abertas'),
    listed: (shown: number, total: number) => (shown < total ? `As ${shown} mais recentes` : 'Mais recentes primeiro'),
    opened: 'Aberta',
    by: 'Publicada por',
    deleted: 'conta removida',
    headlineOf: (title: string, number: number) =>
      `${excerpt(title, 70 - ` · #${number} · ${SITE.name}`.length)} · #${number}`,
    ledeOf: (when: string) => `Publicada em ${when}.`,
    apply: 'Ver a vaga no GitHub',
    noBody: 'Esta vaga não traz descrição. Veja a issue no GitHub para saber mais.',
    post: 'Anunciar uma vaga',
    postUrl: `${repositoryUrl('vagas')}#como-cadastrar-uma-vaga`,
    all: 'Ver todas no GitHub',
    empty: 'Nenhuma vaga aberta agora. Acompanhe o repositório backend-br/vagas no GitHub para saber da próxima.',
    feed: 'Vagas abertas em JSON',
    feedPath: '/vagas.json',
    rss: 'Vagas abertas em RSS',
    rssPath: '/vagas.xml',
  },
  talents: {
    title: 'Talentos',
    headline: 'Talentos de backend',
    lede: 'Pessoas desenvolvedoras backend que pediram para divulgar o perfil em backend-br/me-contrata, com nível, regime, modelo de trabalho e tecnologias.',
    count: (count: number) => plural(count, 'perfil divulgado', 'perfis divulgados'),
    listed: 'Atualizados mais recentemente primeiro',
    updated: 'Atualizado',
    post: 'Divulgar meu perfil',
    postUrl: `${repositoryUrl('me-contrata')}/issues/new/choose`,
    all: 'Ver todos os perfis no GitHub',
    profile: 'Perfil no GitHub',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    portfolio: 'Portfólio',
    contactOf: (name: string, channel: string) => `${channel} de ${name}`,
    empty:
      'Nenhum perfil divulgado agora. Quem abre um perfil em backend-br/me-contrata pode marcar a opção de divulgação no formulário.',
    feed: 'Perfis divulgados em JSON',
    feedPath: '/talentos.json',
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

export function day(instant: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: TIME_ZONE }).format(new Date(instant))
}

const DAY = 86_400_000

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

export function excerpt(text: string, limit = 160): string {
  const plain = text.replace(/\s+/g, ' ').trim()
  if (plain.length <= limit) {
    return plain
  }
  const cut = plain.slice(0, limit - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`
}
