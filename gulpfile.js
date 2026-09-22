const { src, dest, watch, series } = gulp;
import nodeSass from "node-sass";
import gulp from "gulp";
import sourcemaps from "gulp-sourcemaps";
import gulpSass from "gulp-sass";
import autoPrefixer from "gulp-autoprefixer";
import * as sass from "sass";
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
function blog() {
  return src("blog/scss/*.scss")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(autoPrefixer())
    .pipe(sourcemaps.write("."))
    .pipe(dest("blog/css"));
}

// Watch files
// JS on this site ships unbundled (native <script type="module">
// pages in js/page-js, shared helpers in js/) — there is no JS build
// step, only these SCSS -> CSS compiles.
function watchFiles() {
  watch(["scss"], css);
  watch(["scss"], blog);
}

export default series(css, blog);
export { watchFiles as watch };
