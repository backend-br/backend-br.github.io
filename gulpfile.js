const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const { exec } = require('child_process')
const browserSync = require('browser-sync')

gulp.task('hexo', function () {
  const command = 'hexo generate'
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
    }
  })
})

gulp.task('js', function () {
  gulp.src('./public/*.js')
    .pipe(uglify())
    .pipe(concat('main.min.js'))
    .pipe(gulp.dest('./public'))
})

gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: './public'
    }
  })

  gulp.watch('./public/*', browserSync.reload)
  gulp.watch('./public/*.js', ['js'])
  gulp.watch('./themes/backendbrasil/layout/*.hbs', ['hexo'])
  gulp.watch('./themes/backendbrasil/layout/partials/*.hbs', ['hexo'])
  gulp.watch('./themes/backendbrasil/source/*.{scss,js}', ['hexo'])
  gulp.watch('./themes/backendbrasil/source/**/*.scss', ['hexo'])
  gulp.watch('./themes/backendbrasil/source/*.{jpg,gif,png}', ['hexo'])
})

gulp.task('default', ['hexo', 'js', 'server'])
