
Gulp Babel External Helpers
==================================

A gulp plugin that replaces gulp-babel, it does the same thing except it also tracks what helpers are used and exports them as a seperate module and includes that require in each file that needs them. Allowing you use external helpers without poluting the global context.

`babelHelpers(babelConfig, imaginaryLocationInSrcBlog, helperFileDestination)`


```js
    gulp.src('./src/*.js')//------------V (where this file would be if it was in src )
        .pipe(transform(babelConfig, './helpers.js', './lib/helpers.js'))
        .pipe(gulp.dest('./lib'))
```
