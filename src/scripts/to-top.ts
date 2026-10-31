const SHOWN = 'is-shown'

const THRESHOLD = 0.75

function init(): void {
  const control = document.querySelector<HTMLAnchorElement>('a[data-to-top]')
  if (control === null) {
    return
  }

  document.documentElement.dataset.toTop = 'on'

  let frame = 0
  const update = (): void => {
    frame = 0
    control.classList.toggle(SHOWN, window.scrollY > window.innerHeight * THRESHOLD)
  }

  window.addEventListener(
    'scroll',
    () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update)
      }
    },
    { passive: true },
  )
  update()

  control.addEventListener('click', (event) => {
    event.preventDefault()
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
    history.replaceState(null, '', window.location.pathname)
    document.querySelector<HTMLElement>('header a[href]')?.focus({ preventScroll: true })
  })
}

init()

export {}
