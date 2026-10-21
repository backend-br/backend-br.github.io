import { unified } from '@astrojs/markdown-remark'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

/** The module Vite imports its preload helper from, a virtual one it resolves on its own. */
const PRELOAD_HELPER = '\0vite/preload-helper.js'

/**
 * The bundler plugin that replaces the preload helper with one that only imports.
 *
 * The stock helper preloads the stylesheets and shared files of what is imported, and ships with the
 * first file that defers an import. Here that file is the search page, whose only deferred import is the
 * Pagefind index, which has nothing to preload.
 */
function importWithoutPreload() {
  return {
    name: 'backend-br:import-without-preload',
    enforce: 'pre' as const,
    resolveId: (id: string): string | null => (id === PRELOAD_HELPER ? id : null),
    load: (id: string): string | null =>
      id === PRELOAD_HELPER ? 'export const __vitePreload = (load) => load()' : null,
  }
}

/** Marks every link that leaves the site, so it opens beside the page instead of over it. */
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

/**
 * Served by GitHub Pages as the site of the organization, at the root of its domain. Every page is drawn
 * from the repositories of the community, read from GitHub when the site is built.
 */
export default defineConfig({
  site: 'https://backend-br.github.io',
  trailingSlash: 'always',
  output: 'static',
  /**
   * Code is colored at build time in both themes, and the stylesheet picks the one in force. The high
   * contrast editions are used because the comments of the plain ones fall to 3:1 on their own ground.
   */
  markdown: {
    processor: unified({ rehypePlugins: [rehypeExternalLinks] }),
    shikiConfig: {
      themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
      defaultColor: false,
    },
  },
  vite: {
    plugins: [tailwindcss(), importWithoutPreload()],
    /**
     * Every script is served as a file rather than inlined into the page, so the import of the search index
     * keeps its real address and the scripts are cached across pages.
     */
    build: {
      assetsInlineLimit: 0,
    },
  },
})
