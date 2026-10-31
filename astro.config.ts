import { unified } from '@astrojs/markdown-remark'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { SHIKI } from './src/content/markdown'

const PRELOAD_HELPER = '\0vite/preload-helper.js'

function importWithoutPreload() {
  return {
    name: 'backend-br:import-without-preload',
    enforce: 'pre' as const,
    resolveId: (id: string): string | null => (id === PRELOAD_HELPER ? id : null),
    load: (id: string): string | null =>
      id === PRELOAD_HELPER ? 'export const __vitePreload = (load) => load()' : null,
  }
}

function rehypeExternalLinks() {
  interface Node {
    type: string
    tagName?: string
    properties?: Record<string, unknown>
    children?: Node[]
  }
  const visit = (node: Node): void => {
    if (node.type === 'element' && node.tagName === 'a' && /^https?:/.test(String(node.properties?.href ?? ''))) {
      node.properties = { ...node.properties, target: '_blank', rel: 'noopener noreferrer' }
    }
    node.children?.forEach(visit)
  }
  return visit
}

export default defineConfig({
  site: 'https://backend-br.github.io',
  trailingSlash: 'always',
  output: 'static',
  markdown: {
    processor: unified({ rehypePlugins: [rehypeExternalLinks] }),
    shikiConfig: SHIKI,
  },
  vite: {
    plugins: [tailwindcss(), importWithoutPreload()],
    build: {
      assetsInlineLimit: 0,
    },
  },
})
