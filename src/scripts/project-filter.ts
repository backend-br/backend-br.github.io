/**
 * Progressive enhancement for the language filter of the projects page.
 *
 * Without a script the page lists every project and the chips stay hidden. With one, pressing a chip
 * shows only the projects in its language and writes the language to the address, so the filtered page
 * can be shared; an address that already names a language, such as `#python`, opens filtered by it.
 */
function init(): void {
  const list = document.querySelector<HTMLElement>('[data-project-list]')
  const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')]
  if (list === null || chips.length === 0) {
    return
  }

  document.documentElement.dataset.projectFilter = 'on'

  const apply = (language: string): void => {
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === language))
    }
    for (const card of list.querySelectorAll<HTMLElement>(':scope > [data-language]')) {
      card.hidden = language !== '' && card.dataset.language !== language
    }
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const language = chip.dataset.filter ?? ''
      apply(language)
      history.replaceState(null, '', language ? `#${language}` : location.pathname)
    })
  }

  const named = location.hash.slice(1)
  apply(chips.some((chip) => chip.dataset.filter === named) ? named : '')
}

init()

export {}
