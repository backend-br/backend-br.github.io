/**
 * The replay of the terminal on the home, over and over. It runs only when the inline script of the
 * terminal marked the root as pending, which it does where the reader did not ask for reduced motion.
 * Each round types the command, shows each line of the response in turn and counts each figure up to its
 * value, then drops the mark, which leaves the session as the server printed it, and holds it there before
 * the screen is cleared for the next round.
 *
 * The replay waits while the tab is hidden or the terminal is out of view, and resumes where it stopped.
 * A reader who asks for reduced motion mid-way gets the printed session back at once, and no more rounds.
 */

/** How long, in milliseconds, each character of the command takes to type. */
const TYPE_MS = 26

/** How long the command waits for its response once typed. */
const WAIT_MS = 320

/** How long apart the lines of the response come in. */
const LINE_MS = 110

/** How long a figure takes to count up to its value, in steps of equal length. */
const COUNT_MS = 900
const COUNT_STEPS = 30

/** How long the finished session stays on screen before the next round clears it. */
const HOLD_MS = 4000

const root = document.documentElement
const calm = window.matchMedia('(prefers-reduced-motion: reduce)')

let shown = !document.hidden
let inView = false
let waiting: (() => void)[] = []

/** Releases every step waiting for the terminal, once it is both in a visible tab and in view. */
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

/** Waits a while of time the reader sees, so a round never moves on while nobody is looking. */
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

/** Counts a figure up from zero, fast at first and settling on its value, the way a total comes in. */
async function count(target: HTMLElement): Promise<void> {
  const value = Number(target.dataset.count ?? 0)
  for (let step = 1; step <= COUNT_STEPS; step++) {
    target.textContent = String(Math.round(value * (1 - (1 - step / COUNT_STEPS) ** 3)))
    await later(COUNT_MS / COUNT_STEPS)
  }
}

/** Clears the screen for a round: every line unseen, the command untyped and every figure at nothing. */
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
