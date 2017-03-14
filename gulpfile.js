'use strict';

const gulp = require('gulp'),
    $ = require('gulp-load-plugins')();

//css 合并  压缩  md5
gulp.task('css', function(){
    return gulp.src('./public/src/css/!(common)/*.css')
        .pipe($.cssimport({}))
        .pipe($.autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe($.cssmin())
        .pipe($.rev())
        .pipe(gulp.dest('./public/dist/css'))
        .pipe($.rev.manifest())
        .pipe($.rename('css-mainfest.json'))
        .pipe(gulp.dest('./public/dist/rev/css'));
});

//清除原来的内容
gulp.task("cleancss", function(){
    return gulp.src('./public/dist/css')
        .pipe($.clean());
});


gulp.task('seajs', ['index', 'about/index']);

gulp.task('index', function(){
        return gulp.src("public/src/js/{index,}/index_main.js")
        .pipe($.seajsCombo({
            map:{
                '/public/src/js/index/index.js': 'D:/wamp/www/hxe/public/src/js/index/index.js'
            }
        }))
        .pipe(gulp.dest('D:/wamp/www/hxe/public/temp'))
});

gulp.task('about/index', function(){
        return gulp.src("public/src/js/{about,}/index_main.js")
        .pipe($.seajsCombo({
            map:{
                '/public/src/js/about/index.js': 'D:/wamp/www/hxe/public/src/js/about/index.js'
            }
        }))
        .pipe(gulp.dest('D:/wamp/www/hxe/public/temp'))
});

gulp.task('js', ['seajs'], function(){
  
    return gulp.src("D:/wamp/www/hxe/public/temp/*/*.js")
        .pipe($.uglify())
        .pipe($.rev())
        .pipe(gulp.dest('./public/dist/js'))
        .pipe($.rev.manifest())
        .pipe($.rename('js-manifest.json'))
        .pipe(gulp.dest('./public/dist/rev/js'))
});


//清除原来的内容
gulp.task("cleanJs", function(){
    return gulp.src('./public/dist/js')
        .pipe($.clean());
});


//html 压缩
gulp.task('rev',function () {
    var options = {
        removeComments: true,  //清除HTML注释
        collapseWhitespace: true,  //压缩HTML
        collapseBooleanAttributes: true,  //省略布尔属性的值 <input checked="true"/> ==> <input checked />
        removeEmptyAttributes: true,  //删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,  //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,  //删除<style>和<link>的type="text/css"
        minifyJS: true,  //压缩页面JS
        minifyCSS: true  //压缩页面CSS
    };
    return gulp.src(['./public/dist/rev/*/*.json', './app/view/*/*.html'])
            .pipe($.revCollector({
                replaceReved: true,
                dirReplacements: {
                    '/src/css': '/dist/css/',
                    '/src/js/': '/dist/js/'
                }
            }))
            .pipe($.htmlmin(options))
            .pipe(gulp.dest('./app/view_build'));    
});


gulp.task("cleanhtml", function(){
    return gulp.src('./app/view_build')
        .pipe($.clean());
});

gulp.task('default', ['cleancss','cleanJs', 'cleanhtml'], function(){
    gulp.start('css','js','rev');
});
