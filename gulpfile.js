const { src, dest, watch, series } = gulp;
import nodeSass from "node-sass";
import gulp from "gulp";
import sourcemaps from "gulp-sourcemaps";
import gulpSass from "gulp-sass";
import autoPrefixer from "gulp-autoprefixer";
import * as sass from "sass";
import { Transform } from "stream";
const scss = gulpSass(sass);
scss.compiler = nodeSass;

// css
// Every non-partial file in scss/ is an entry: bootstrap.scss, common.scss
// and one per page (home.scss, pricing.scss, ...). They compile LTR as-is
// (_config.scss imports the LTR direction defaults). The RTL build prepends
// the RTL direction file to each entry; its values win because the LTR
// ones are !default.
function prependRtl() {
  return new Transform({
    objectMode: true,
    transform(file, enc, done) {
      if (file.isBuffer()) {
        file.contents = Buffer.concat([Buffer.from('@import "config-directions/rtl/direction";\n'), file.contents]);
      }
      done(null, file);
    },
  });
}

function compile(out, rtl) {
  let stream = src("scss/*.scss").pipe(sourcemaps.init({ loadMaps: true }));
  if (rtl) stream = stream.pipe(prependRtl());
  return stream
    .pipe(scss({ outputStyle: "compressed" }).on("error", scss.logError))
    .pipe(autoPrefixer())
    .pipe(sourcemaps.write("."))
    .pipe(dest(out));
}
const css = () => compile("css", false);
const cssRtl = () => compile("css/rtl", true);

function blog() {
  return src("blog/scss/*.scss")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(scss({ outputStyle: "compressed" }).on("error", scss.logError))
    .pipe(autoPrefixer())
    .pipe(sourcemaps.write("."))
    .pipe(dest("blog/css"));
}

// Watch files
// JS on this site ships unbundled (native <script type="module">
// pages in js/page-js, shared helpers in js/) — there is no JS build
// step, only these SCSS -> CSS compiles.
function watchFiles() {
  watch(["scss"], series(css, cssRtl));
  watch(["scss", "blog/scss"], blog);
}

export default series(css, cssRtl, blog);
export { watchFiles as watch };
