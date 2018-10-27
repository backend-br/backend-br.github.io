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

const imgsrc = str => {
  const parsed = url.parse(str)

  if (parsed.hostname) {
    return str
  }

  return `/img/${str}`
}

const logme = data => console.log(Object.keys(data))

module.exports = hexo => ({
  __: (...key) => i18n.__()(stringify(key)),
  _p: (...key) => i18n._p()(stringify(key)),
  imgsrc,
  logme,
  ...helpers
})
