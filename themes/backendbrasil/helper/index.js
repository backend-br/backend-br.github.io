const I18n = require('hexo-i18n')
const i18n = new I18n({languages: ['pt']})
const pt = require('../languages/pt.json')
const helpers = require('handlebars-helpers')()
const url = require('url')

i18n.set('pt', pt)

const stringify = data => {
  if (Array.isArray(data)) {
    return data.filter(f => typeof f === 'string').join('.')
  }

  return data
}

const thumb = (path, image) => {
  path = path.replace(/\/$/g, '')
  const args = [path, image]

  if (args.length === 0) {
    return ''
  }

  let str = args
    .filter(path => typeof path === 'string')
    .join('/')

  const parsed = url.parse(str)

  if (parsed && parsed.hostname) {
    return str
  }

  if (str.length === 0 || str === path) {
    str = 'img/no-image.jpg'
  }

  return `/${str.replace(/\/$/g, '')}`
}

const imgsrc = str => {
  if (!str) {
    return str
  }

  const parsed = url.parse(str)

  if (parsed && parsed.hostname) {
    return str
  }

  if (str.length === 0) {
    str = 'no-image.jpg'
  }

  return `/img/${str}`
}

const logme = data => console.log(JSON.stringify(data, null, 2))

const slugify = str => encodeURIComponent(helpers.dashcase(str))

module.exports = hexo => ({
  __: (...key) => i18n.__()(stringify(key)),
  _p: (...key) => i18n._p()(stringify(key)),
  imgsrc,
  thumb,
  logme,
  slugify,
  ...helpers
})
