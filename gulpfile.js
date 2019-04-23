var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('default', ()=>{
	return gulp.task('compile')();
});

gulp.task('compile', ()=>{
	return gulp.src('src/**/*.ts')
	.pipe(ts(require('./tsconfig.json').compilerOptions))
	.pipe(gulp.dest('dist'));
});