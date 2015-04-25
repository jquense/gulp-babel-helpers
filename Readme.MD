
Gulp Babel External Helpers
==================================

A gulp plugin that replaces gulp-babel, it does the same thing except it also tracks what helpers are used and exports them as a seperate module and includes that require in each file that needs them. Allowing you use external helpers without polluting the global context.

`babelHelpers(babelConfig, imaginaryLocationInSrc)`

```js
    gulp.src('./src/*.js')//------------V (where this file would be if it was in src )
        .pipe(transform(babelConfig, './helpers.js'))
        .pipe(gulp.dest('./lib')) // will end up with a ./lib/helpers.js file containing the bable helpers
```

- `babelConfig` just a normal babel options object
- `imaginaryLocationInSrc` - This is the location of the helpers file if it were to exist in your source directories, this tells the plugin how to build the `require('./helpers')` import for each file and so it can be added into the file stream usefully.