公司还一直在延续使用jq+seajs的技术栈，所以只能基于现在的技术栈进行静态文件打包，而众所周知seajs的打包比较“偏门”，在查了不少的文档和技术分享后终于琢磨出了自己的打包策略。

本文目录

  * [1. devDependencies依赖](#1)
  * [2. css的压缩、合并、md5](#2)
  * [3. seajs合并](#3)
  * [4. js压缩](#4)
  * [5. html压缩](#5)
  * [6. 程序的默认执行](#6)
  * [7. 总结](#7)

<h2 id="1">一：devDependencies依赖</h2>

  了解gulp的肯定对npm都有所了解，在这里就不再赘述，直接贴依赖包。

```js
    "devDependencies": {
        "gulp": "^3.9.1",
        "gulp-autoprefixer": "^3.1.1",
        "gulp-clean": "^0.3.2",
        "gulp-cleanhtml": "^1.0.1",
        "gulp-cssimport": "^5.0.0",
        "gulp-cssmin": "^0.1.7",
        "gulp-htmlmin": "^3.0.0",
        "gulp-load-plugins": "^1.5.0",
        "gulp-rename": "^1.2.2",
        "gulp-rev": "^7.1.2",
        "gulp-rev-collector": "^1.1.1",
        "gulp-seajs-combo": "^1.2.3",
        "gulp-uglify": "^2.1.0"
    }
```

<h2 id="2">二： css的压缩、合并、md5</h2>

文件中使用了gulp的插件“gulp-load-plugins”，没用过的可以简单了解下 https://www.npmjs.com/package/gulp-load-plugins

```js
//css 合并  压缩  md5
gulp.task('css', function(){
    return gulp.src('./public/static/src/css/!(common|lib)/*.css')
        .pipe($.cssimport({}))
        .pipe($.autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe($.cssmin())
        .pipe($.rev())
        .pipe(gulp.dest('./public/static/dist/css'))
        .pipe($.rev.manifest())
        .pipe($.rename('css-mainfest.json'))
        .pipe(gulp.dest('./public/static/dist/rev/css'));
});
```

考虑到每次修改需要把以前的css文件删除，所以还要有清除css文件的任务

```js
//清除原来的内容
gulp.task("cleancss", function(){
    return gulp.src('./public/static/dist/css')
        .pipe($.clean());
});
```

<h2 id="3">三： seajs合并</h2>

好了，下面是重头戏--合并seajs，在合并seajs之前，我们先了解下一些不同的地方。

由于打包的局限性我们需要给每一个被页面引入的seajs文件添加一个中介文件调用seajs.use，不要在页面中使用seajs.use调用。

Demo如下： 
![](http://images2015.cnblogs.com/blog/890053/201704/890053-20170418132155837-1081646468.png)

```js
// seajs合并
gulp.task('seajs', ['index/index', 'index/submit','require/index']);

gulp.task('index/index', function(){
    return gulp.src("./public/static/src/js/{index,}/index_main.js")
    .pipe($.seajsCombo({
        map:{
            '/static/src/js/index/index.js': 'D:/wamp/www/hxe/js/index/index.js'
        }
    }))
    .pipe(gulp.dest('D:/wamp/www/hxe/temp'))
});

gulp.task('index/submit', function(){
    return gulp.src("./public/static/src/js/{index,}/submit_main.js")
    .pipe($.seajsCombo({
        map:{
            '/static/src/js/index/submit.js': 'D:/wamp/www/hxe/js/index/submit.js'
        }
    }))
    .pipe(gulp.dest('D:/wamp/www/hxe/temp'))
});


gulp.task('require/index', function(){
        return gulp.src("./public/static/src/js/{require,}/schedule_main.js")
        .pipe($.seajsCombo({
            map:{
                '/static/src/js/require/index.js': 'D:/wamp/www/hxe/js/require/index.js'
            }
        }))
        .pipe(gulp.dest('D:/wamp/www/hxe/temp'))
});
```

在这里重点强调一下，由于打包的一些限制，我们需要将js文件夹复制一份放到一个绝对路径文件夹下，我在这放到了 `D:/wamp/www/hxe/` 下,而我们产生的合并文件也一并存放在这个文件夹下。

还需要注意的一点是我们在一个项目肯定会存在不同的文件夹下有相同的文件名，如我的项目在index和require文件夹下都存在`index_main.js`和`index.js`这就需要我们用正则区分，即上面的`{index,}` 和 `{require,}`。

<h2 id="4">四： js压缩</h2>

熟悉gulp的肯定知道我们只有在`seajs`合并任务完毕后才能执行压缩任务，所以我们可以将`seajs`任务作为 `js` 的前置任务。

```js
//  压缩js
gulp.task('js', ['seajs'], function(){
  
    return gulp.src("D:/wamp/www/hxe/temp/*/*.js")
        .pipe($.uglify({
                mangle: { except: ['require', 'exports', 'module', '$'] }//排除混淆关键字
            }))
        .pipe($.rev())
        .pipe(gulp.dest('./public/static/dist/js'))
        .pipe($.rev.manifest())
        .pipe($.rename('js-manifest.json'))
        .pipe(gulp.dest('./public/static/dist/rev/js'))
});

//清除原来的内容
gulp.task("cleanJs", function(){
    return gulp.src('./public/static/dist/js')
        .pipe($.clean());
});

```

在这里，就需要将我们再绝对路径下合并产生的临时文件压缩并输出到我们的项目路径下。

<h2 id="5">五： html压缩</h2>

html的操作，最主要的重头戏还是在于css和js的路径替换，所以打包的成功与否html这边的操作也至为重要。

```js
//html 压缩
gulp.task('rev',['css','js'],function () {
    var options = {
        removeComments: true,  //清除HTML注释
        collapseWhitespace: true,  //压缩HTML
        collapseBooleanAttributes: true,  //省略布尔属性的值 input checked="true" ==> input checked 
        removeEmptyAttributes: true,  //删除所有空格作属性值 input id=""  ==> input 
        removeScriptTypeAttributes: true,  //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,  //删除<style>和<link>的type="text/css"
        minifyJS: true,  //压缩页面JS
        minifyCSS: true  //压缩页面CSS
    };
    return gulp.src(['./public/static/dist/rev/*/*.json', './application/home/view/**/*.html'])
            .pipe($.revCollector({
                replaceReved: true,
                dirReplacements: {
                    '/src/css': '/dist/css/',
                    '/src/js/': '/dist/js/'
                }
            }))
            .pipe($.htmlmin(options))
            .pipe(gulp.dest('./application/home/view_build'));    
});

//清除html文件夹
gulp.task("cleanhtml", function(){
    return gulp.src('./application/home/view_build')
        .pipe($.clean());
});

```

<h2 id="6">六： 程序的默认执行</h2>

程序的默认执行，主要是对gulp打包的顺序最后做一遍确认，在控制台直接使用gulp就能触发`default`任务。

```js
//默认任务
gulp.task('default', ['cleancss','cleanJs', 'cleanhtml'], function(){
    gulp.start('rev');
});
```

<h2 id="7">七： 总结</h2>

通过gulp打包seajs项目，主要的核心还是在于map映射的问题，所以我们通过借助绝对路径的方式可以成功的绕开这个问题--将文件合并放在项目之外。

seajs模块化，gulp压缩打包合并只是几个简单的命令已经走了好几个年头，颇有些“廉颇老矣”的悲情，但是只要脑筋灵活还是能做很多事情的，当然我们也要拥抱变化，webpack都2.0了。。。


gulp打包seajs项目Demo地址 [https://github.com/jinghaoo/seaJS-gulp](https://github.com/jinghaoo/seaJS-gulp)

如果有什么问题，欢迎给我发邮件： jingh1024@163.com
