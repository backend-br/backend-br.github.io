interface PagefindResult {
  readonly url: string
  readonly excerpt: string
  readonly meta: { readonly title?: string }
  readonly sub_results?: readonly { readonly url: string; readonly title: string; readonly excerpt: string }[]
}

interface Pagefind {
  readonly debouncedSearch: (
    term: string,
  ) => Promise<{ readonly results: readonly { readonly data: () => Promise<PagefindResult> }[] } | null>
}

const MAX_PAGES = 8
const MAX_SECTIONS = 3

let pagefind: Promise<Pagefind> | undefined

function loadPagefind(): Promise<Pagefind> {
  pagefind ??= import(/* @vite-ignore */ `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}pagefind/pagefind.js`)
  return pagefind
}

function resultItem(result: PagefindResult): string {
  const sections = (result.sub_results ?? []).filter((sub) => sub.url.includes('#')).slice(0, MAX_SECTIONS)
  const entries = sections.length > 0 ? sections : [{ url: result.url, title: '', excerpt: result.excerpt }]
  const links = entries.map(
    (entry) => `<li><a href="${entry.url}"><strong>${entry.title}</strong><span>${entry.excerpt}</span></a></li>`,
  )
  return `<li class="bb-result"><a class="bb-result__page" href="${result.url}">${result.meta.title ?? ''}</a><ul class="bb-result__sections">${links.join('')}</ul></li>`
}

export function bind(root: ParentNode, followAddress: boolean): void {
  const form = root.querySelector<HTMLFormElement>('[data-search]')
  const input = form?.querySelector('input')
  const status = root.querySelector<HTMLElement>('[data-search-status]')
  const results = root.querySelector<HTMLOListElement>('[data-search-results]')
  if (!form || !input || !status || !results || form.dataset.bound) {
    return
  }
  form.dataset.bound = 'on'
  const say = (key: string, count = 0): void => {
    status.textContent = (form.dataset[key] ?? '').replace('{count}', String(count))
  }

  const run = async (): Promise<void> => {
    const term = input.value.trim()
    if (followAddress) {
      history.replaceState(null, '', term === '' ? '?' : `?q=${encodeURIComponent(term)}`)
    }
    if (term.length < 2) {
      results.innerHTML = ''
      say('idle')
      return
    }
    say('loading')
    try {
      const search = await (await loadPagefind()).debouncedSearch(term)
      if (search !== null) {
        const pages = await Promise.all(search.results.slice(0, MAX_PAGES).map((result) => result.data()))
        results.innerHTML = pages.map(resultItem).join('')
        say(search.results.length === 0 ? 'empty' : 'count', search.results.length)
      }
    } catch {
      say('unavailable')
    }
  }

  input.addEventListener('input', () => void run())
  if (!followAddress) {
    form.addEventListener('submit', (event) => event.preventDefault())
    return
  }
  input.value = new URLSearchParams(window.location.search).get('q') ?? ''
  if (input.value !== '') {
    void run()
  }
}
