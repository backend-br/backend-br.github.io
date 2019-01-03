# Website - BackEndBrasil

Oi! 

Esse é o repositório com os arquivos do site do BackEndBrasil, você pode ver mais [aqui](https://backendbrasil.com.br)

## Escrevendo

Quer escrever algum artigo no blog?

Faça um fork do repositório, instale todas as dependências com `npm install` e execute `hexo new post "titulo do artigo"`.

Isso vai gerar um arquivo e uma pasta, ambos com um `slug` gerado a partir do título especificado, estarão em `source/_posts/`.

Lá você encontrará uma pasta, onde pode armazenar os arquivos que precisara para o artigo(como imagens), e o arquivo `.md` será onde você vai escrever.

Depois é só abrir um Pull Request!

## Problemas

Encontrou algum bug? Abra uma issue [aqui](https://github.com/backend-br/backend-br.github.io/issues)!

## Executando localmente

Depois de clonar o repositório, execute `npm i && npm run dev`, isso vai instalar tudo que é necessário e carregar o site no seu `localhost`.

## Arquivos

O site é construído usando o [Hexo](https://hexo.io). Tudo está dentro da pasta `themes/backendbrasil`, lá você encontra os arquivos do tema.

- `themes/backendbrasil/assets` contém os arquivos estáticos(JS, SCSS, Imagens, ícones, etc)
  - `styles` contém todos os arquivos SCSS
  - `img` contém todas as imagens, que são minificadas automaticamente
  - `icons` contém alguns ícones, mas também temos o [font-awesome](https://fontawesome.com/)
  - `main.scss` é o único arquivo renderizado, nele contém todas as importações do SCSS
- `themes/backendbrasil/helper` contém funções aplicadas no `handlebars`
  - também temos o [handlebars-helpers](https://github.com/helpers/handlebars-helpers)
- `themes/backendbrasil/languages` contém os arquivos de traduções
- `themes/backendbrasil/layout` contém todos os arquivos relacionados ao layout da página
  - `themes/backendbrasil/layout/` contém templates de páginas na raiz
  - `themes/backendbrasil/layout/partials` contém partes reutilizáveis
