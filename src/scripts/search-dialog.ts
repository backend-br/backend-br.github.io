const control = document.querySelector('[data-search-open]')
const dialog = document.querySelector<HTMLDialogElement>('dialog[data-search-dialog]')
const page = document.querySelector('main [data-search]')

if (page) {
  void import('./search.ts').then((search) => search.bind(page.parentElement ?? document, true))
}

if (control && dialog) {
  const open = (event: Event): void => {
    event.preventDefault()
    dialog.showModal()
    void import('./search.ts').then((search) => search.bind(dialog, false))
  }
  control.addEventListener('click', open)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'k' && (event.ctrlKey || event.metaKey) && !dialog.open) {
      open(event)
    }
  })
}

export {}
