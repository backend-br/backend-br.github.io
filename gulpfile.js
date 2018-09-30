const Hexo = require('hexo')
const hexo = new Hexo(process.cwd(), {})
const gulp = require('gulp')
const browserSync = require('browser-sync')

gulp.task('hexo', function () {
  return hexo.init()
    .then(() => hexo.call('generate', { watch: true }))
    .then(() => hexo.exit())
})

gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: './public'
    }
  })

  gulp.watch('./public/*', browserSync.reload)
})

gulp.task('default', ['hexo', 'server'])
