const TYPE_MS = 26

const WAIT_MS = 320

const LINE_MS = 110

const COUNT_MS = 900
const COUNT_STEPS = 30

const HOLD_MS = 4000

const root = document.documentElement
const calm = window.matchMedia('(prefers-reduced-motion: reduce)')

let shown = !document.hidden
let inView = false
let waiting: (() => void)[] = []

function release(): void {
  if (shown && inView) {
    const resumed = waiting
    waiting = []
    for (const resume of resumed) {
      resume()
    }
  }
}

function seen(): Promise<void> {
  return shown && inView ? Promise.resolve() : new Promise((resolve) => waiting.push(resolve))
}

async function later(ms: number): Promise<void> {
  await seen()
  await new Promise((resolve) => setTimeout(resolve, ms))
  await seen()
}

async function type(target: HTMLElement): Promise<void> {
  const text = target.dataset.type ?? ''
  for (let length = 1; length <= text.length; length++) {
    target.textContent = text.slice(0, length)
    await later(TYPE_MS)
  }
}

async function count(target: HTMLElement): Promise<void> {
  const value = Number(target.dataset.count ?? 0)
  for (let step = 1; step <= COUNT_STEPS; step++) {
    target.textContent = String(Math.round(value * (1 - (1 - step / COUNT_STEPS) ** 3)))
    await later(COUNT_MS / COUNT_STEPS)
  }
}

function clear(terminal: HTMLElement): void {
  root.dataset.term = 'playing'
  for (const line of terminal.querySelectorAll('.is-on')) {
    line.classList.remove('is-on')
  }
  for (const live of terminal.querySelectorAll<HTMLElement>('[data-type], [data-count]')) {
    live.textContent = ''
  }
}

async function round(terminal: HTMLElement): Promise<void> {
  clear(terminal)
  const typed = terminal.querySelector<HTMLElement>('[data-type]')
  if (typed !== null) {
    await type(typed)
  }
  await later(WAIT_MS)
  const counting: Promise<void>[] = []
  for (const line of terminal.querySelectorAll<HTMLElement>('[data-step]')) {
    line.classList.add('is-on')
    const figure = line.querySelector<HTMLElement>('[data-count]')
    if (figure !== null) {
      counting.push(count(figure))
    }
    await later(LINE_MS)
  }
  await Promise.all(counting)
  delete root.dataset.term
}

async function replay(terminal: HTMLElement): Promise<void> {
  while (!calm.matches) {
    await round(terminal)
    await later(HOLD_MS)
  }
}

const terminal = document.querySelector<HTMLElement>('[data-terminal]')
if (terminal !== null && root.dataset.term === 'pending') {
  document.addEventListener('visibilitychange', () => {
    shown = !document.hidden
    release()
  })
  new IntersectionObserver((entries) => {
    inView = entries.some((entry) => entry.isIntersecting)
    release()
  }).observe(terminal)
  calm.addEventListener('change', () => {
    if (calm.matches) {
      delete root.dataset.term
    }
  })
  void replay(terminal)
}

export {}
