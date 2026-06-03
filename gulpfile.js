// var concat = require("gulp-concat");
const { src, dest, watch, series } = gulp;
import nodeSass from "node-sass";
import gulp from "gulp";
import sourcemaps from "gulp-sourcemaps";
import gulpSass from "gulp-sass";
import autoPrefixer from "gulp-autoprefixer";
import minify from "gulp-minify";
import tap from 'gulp-tap';
import * as sass from "sass";
import concat from "gulp-concat";
const scss = gulpSass(sass);
scss.compiler = nodeSass;

// css
function css() {
  return src("scss/*.scss")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(autoPrefixer())
    .pipe(sourcemaps.write("."))
    .pipe(dest("css"));
}

// minifyJs
function minifyJs() {
  return src("js/*.js", { allowEmpty: true })
  .pipe(tap(file => console.log(file.path)))  
    .pipe(minify({ noSource: true }))
    .pipe(concat("bundle.js"))
    .pipe(dest("js/min"));
}

// Watch files
function watchFiles() {
  watch(["scss"], css);
  watch(["js/*.js"], minifyJs);
}

export default series(css, minifyJs);
export { watchFiles as watch };
