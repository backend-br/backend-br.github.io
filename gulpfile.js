const gulp = require('gulp')
const browserSync = require('browser-sync')
const concat = require('gulp-concat')
const plumber = require('gulp-plumber')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const fs = require('fs')
const path = require('path')
const unlink = f => new Promise((res, rej) => fs.unlink(f, e => e ? rej(e) : res()))
const readDir = f => new Promise((res, rej) => fs.readdir(f, (e, files) => e ? rej(e) : res(files)))
const { exec } = require('child_process')

/**
 * Use hexo to generate files
 * We had some problems with the hexo's API so now
 * we're going with child_process's spawn
 */
gulp.task('hexo', function (cb) {
  const command = 'hexo generate'
  exec(command, (err, stdout, stderr) => {
    if (err) {
      return cb(err)
    }

    browserSync.reload()
    cb()
  })
})

/**
 * Clear JS files from ./public
 */
gulp.task('clear-js-files', function () {
  return readDir('./public')
    .then(files => {
      files = files
        .filter(f => f.match(/\.js/g))
        .map(f => path.resolve(process.cwd(), 'public', f))

      return Promise.all(files.map(unlink))
    })
})

/**
 * Process JS files
 * Match files from the theme folder
 * concat them, transpile to ES5
 * and uglify them
 */
gulp.task('process-js', ['clear-js-files'], function () {
  return gulp.src('./themes/backendbrasil/source/*.js')
    .pipe(plumber())
    .pipe(concat('main.min.js'))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('public'))
})

gulp.task('js', ['process-js'], function (cb) {
  browserSync.reload()
  cb()
})

gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: './public'
    }
  })

  // Handlebars Files
  gulp.watch('./themes/backendbrasil/layout/*.hbs', ['hexo'])
  gulp.watch('./themes/backendbrasil/layout/**/*.hbs', ['hexo'])

  // SCSS Files
  gulp.watch('./themes/backendbrasil/source/*.scss', ['hexo'])
  gulp.watch('./themes/backendbrasil/source/**/*.scss', ['hexo'])

  // Image Files
  gulp.watch('./themes/backendbrasil/source/*.{jpg,gif,png}', ['hexo'])

  // JS Files
  gulp.watch('./themes/backendbrasil/source/*.js', ['js'])
  gulp.watch('./themes/backendbrasil/source/**/*.js', ['js'])
})

gulp.task('default', ['hexo', 'js', 'server'])
//gulp.task('default', ['js'])
