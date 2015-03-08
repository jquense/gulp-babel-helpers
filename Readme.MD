
Gulp Babel External Helpers
==================================

A gulp plugin that replaces gulp-babel, it does the same thing except it also tracks what helpers are used and exports them as a seperate module and includes that require in each file that needs them. Allowing you use external helpers without poluting the global context.

`babelHelpers(babelConfig, requireLocation, helperFileDestination)`


```js
    gulp.src('./src/*.js')
        .pipe(transform(babelConfig, './src/helpers.js', './lib/helpers.js'))
        .pipe(gulp.dest('./lib'))
```
