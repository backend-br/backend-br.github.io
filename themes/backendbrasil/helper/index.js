const I18n = require('hexo-i18n')
const i18n = new I18n({languages: ['pt']})
const pt = require('../languages/pt.json')
const helpers = require('handlebars-helpers')()
i18n.set('pt', pt)
const stringify = data => Array.isArray(data) ? data.join('.') : data

module.exports = hexo => ({
  __: key => i18n.__()(stringify(key)),
  _p: key => i18n._p()(stringify(key)),
  ...helpers
})
