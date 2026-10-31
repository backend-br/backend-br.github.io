<!--suppress HtmlDeprecatedAttribute -->

<div align="center">
    <a href="https://backend-br.github.io/">
        <img alt="Back-End Brasil" src="src/assets/logo.png" width="200">
    </a>
</div>

# Site da Back-End Brasil

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

* [Visão geral](#visão-geral)
    + [Como funciona](#como-funciona)
    + [Adicionando um repositório](#adicionando-um-repositório)
* [Instalação](#instalação)
    + [Repositório](#repositório)
    + [Configuração](#configuração)
    + [Testes](#testes)
    + [Revisão](#revisão)
    + [Manutenção](#manutenção)
* [Ambiente](#ambiente)
    + [Endereços](#endereços)
* [Publicação](#publicação)
* [Licença](#licença)

## Visão geral

O site da comunidade [Back-End Brasil](https://github.com/backend-br), publicado em
[backend-br.github.io](https://backend-br.github.io/).

### Como funciona

O conteúdo das páginas não fica neste repositório. Quando o site é gerado, ele lê os repositórios da comunidade no
GitHub:

| Página      | Fonte                                                                                       |
|:------------|:--------------------------------------------------------------------------------------------|
| `/`         | A descrição e as estrelas de cada repositório, pela API REST da organização.                |
| `/desafios` | O `README.md` de `desafios`, e o `PROBLEM.md` e o `SOLUTIONS.md` de cada desafio listado.   |
| `/vagas`    | As issues abertas de `vagas` e a descrição de cada label, pela API REST.                    |
| `/talentos` | As issues abertas de `me-contrata` com os labels `verificado` e `divulgar-perfil`.          |
| `/projetos` | A tabela da seção `Projetos` do `README.md` de `opensource-br`.                             |
| `/comunidade.json` | Os números do terminal da home: vagas abertas, desafios, projetos e estrelas.     |
| `/vagas.json` | As vagas abertas, com nível, regime, modelo de trabalho e tecnologias.                    |
| `/vagas.xml` | RSS com as 50 vagas abertas mais recentes.                                               |
| `/talentos.json` | Os perfis divulgados, com os mesmos campos das vagas e os links de contato.            |

A leitura fica em `src/content/sources.ts`, e a interpretação de cada fonte fica em um módulo puro de
`src/content/`, coberto por testes. Uma requisição que falha interrompe o build, então o site publicado continua
sendo o do último build que deu certo.

A API do GitHub atende 60 requisições por hora sem token, o que basta para gerar o site localmente. Com a variável
`GITHUB_TOKEN` definida, como nos workflows, as requisições são autenticadas.

### Adicionando um repositório

Adicione uma linha em `CATALOG`, no arquivo `src/content/catalog.ts`, com o nome do repositório. A descrição e as
estrelas são lidas do próprio GitHub.

## Instalação

### Repositório

Para clonar o repositório pela linha de comando, execute:

```bash
git clone https://github.com/backend-br/backend-br.github.io.git
```

### Configuração

Todos os comandos rodam dentro da imagem do Node, então basta ter Docker e GNU Make instalados.

Para instalar as dependências, execute:

```bash
make configure
```

Para iniciar o servidor de desenvolvimento com recarga automática, execute:

```bash
make start
```

Para parar o servidor de desenvolvimento, execute:

```bash
make stop
```

Para gerar o site e o índice de busca em `dist/`, execute:

```bash
make build
```

Para servir o site gerado, com a busca, como ele é publicado, execute:

```bash
make preview
```

Para desenhar, a partir do logo, o card de compartilhamento e os ícones em `public/` e a capivara da barra em
`src/assets/`, execute:

```bash
make brand-images
```

### Testes

Execute os testes unitários:

```bash
make tests
```

Confira o script que cada página gerada carrega contra o seu orçamento (depois de `make build`):

```bash
make budgets
```

Confira os títulos, as descrições, os dados estruturados e o sitemap de cada página gerada (depois de `make build`):

```bash
make seo
```

### Revisão

Execute o linter, a checagem de formatação e as checagens do Astro e do TypeScript:

```bash
make review
```

Corrija os problemas de lint e de formatação:

```bash
make fix-review
```

### Manutenção

Remova as dependências e os artefatos gerados:

```bash
make clean
```

> Veja os outros comandos disponíveis com `make help`.

## Ambiente

### Endereços

| Ambiente   | Endereço                        |
|:-----------|:--------------------------------|
| `Local`    | http://localhost:4321/          |
| `Produção` | https://backend-br.github.io/   |

## Publicação

O workflow `Deploy site` gera o site e o publica no GitHub Pages a cada push na `main`, todos os dias para buscar
novas vagas, desafios e projetos, e sob demanda pela aba Actions.

## Licença

Licenciado sob [MIT](LICENSE).
