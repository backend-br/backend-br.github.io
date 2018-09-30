const i18n = require('hexo-i18n')
const pt = require('../languages/pt.json')
i18n.set('pt', pt)

module.exports = hexo => ({
  __: key => i18n.__()(key),
  _p: key => i18n._p()(key)
})
