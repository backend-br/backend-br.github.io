type Theme = 'light' | 'dark'

const KEY = 'backend-br:theme'

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark'
}

function storedChoice(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

function resolve(choice: Theme | null): Theme {
  return choice ?? (window.matchMedia(SYSTEM_DARK).matches ? 'dark' : 'light')
}

function apply(theme: Theme, choices: readonly HTMLElement[]): void {
  document.documentElement.dataset.theme = theme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const color = themeColor?.dataset[theme]
  if (themeColor && color) {
    themeColor.content = color
  }

  for (const button of choices) {
    button.toggleAttribute('data-active', button.dataset.themeChoice === theme)
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme))
  }
}

function init(): void {
  const choices = [...document.querySelectorAll<HTMLElement>('[data-theme-choice]')]
  if (choices.length === 0) {
    return
  }

  let choice = storedChoice()
  apply(resolve(choice), choices)

  for (const button of choices) {
    button.addEventListener('click', () => {
      const pressed = button.dataset.themeChoice
      if (!isTheme(pressed)) {
        return
      }
      choice = pressed
      try {
        localStorage.setItem(KEY, pressed)
      } catch {}
      apply(pressed, choices)
    })
  }

  window.matchMedia(SYSTEM_DARK).addEventListener('change', () => {
    if (choice === null) {
      apply(resolve(choice), choices)
    }
  })
}

init()

export {}
