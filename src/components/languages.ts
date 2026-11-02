const COLORS: Readonly<Record<string, string>> = {
  assembly: '#6e4c13',
  c: '#555555',
  'c#': '#178600',
  elixir: '#6e4a7e',
  go: '#00add8',
  java: '#b07219',
  javascript: '#f1e05a',
  kotlin: '#a97bff',
  markdown: '#083fa1',
  php: '#4f5d95',
  python: '#3572a5',
  ruby: '#701516',
  rust: '#dea584',
  typescript: '#3178c6',
}

const FALLBACK = '#8a5f3c'

export function languageColor(language: string): string {
  return COLORS[language.split('/')[0]?.trim().toLowerCase() ?? ''] ?? FALLBACK
}
