var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat')
//var packages = require('./public/client/packages');
var _ = require('lodash');
var pm2 = require('pm2');
var Builder = require('systemjs-builder');
var fs = require('fs-extra');

/**
 * Build Tasks
 */
 
// bundle all dependencies
// see app/app/app.js to use
gulp.task('bundle',  function (cb) {
	var builder = new Builder('./app', './app/config.js');
	builder.bundle('app/app - [app/**/*]', './app/bundles/dependencies.js', { minify: true, sourceMaps: false })
	.then(function() {
		gutil.log('wrote /bundles/dependencies.js');
		builder.reset()
		cb()
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});
 
// bundle all dependencies
// see app/app/app.js to use
gulp.task('bundle-client',  function (cb) {
	var builder = new Builder('./app', './app/config.js');
	builder.bundle('app/app - dependencies', './app/bundles/client.js', { minify: false, sourceMaps: true })
	.then(function() {
		gutil.log('wrote /bundles/client.js');
		builder.reset()
		cb()
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});

gulp.task('vendor', function() {
	gulp.src([
		'static/js/lib/jquery/jquery-2.1.1.min.js', 
		'static/js/lib/bootstrap/bootstrap-3.2.0.min.js',
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('static/js/bundles'));
});

gulp.task('package', function() {
	
	gulp.src([
		'static/js/lib/jquery/jquery-2.1.1.min.js', 
		'static/js/lib/bootstrap/bootstrap-3.2.0.min.js',
		'app/jspm_packages/system.js',
		'app/app.js'
    ])
    .pipe(concat('material-ui.js'))
    .pipe(gulp.dest('static/js/bundles'));
});

gulp.task('production',  function (cb) {
	var builder = new Builder('./app', './app/config.js');
	builder.buildStatic('app/app', './static/js/bundles/material-system.js', { minify: true, sourceMaps: false })
	.then(function() {
		gulp.src([
			'static/js/lib/jquery/jquery-2.1.1.min.js', 
			'static/js/lib/bootstrap/bootstrap-3.2.0.min.js',
			'static/js/bundles/material-system.js',
			
		])
		.pipe(concat('material-ui.js'))
		.pipe(gulp.dest('static/js/bundles'))
		.on('end', function() {
			gutil.log('wrote /js/material-ui.js');
			fs.remove('./static/js/bundles/material-system.js', function (err) {
				if (err) {
					return console.error(err)
				}
			})
			cb();
		});
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});

gulp.task('pm2', function(cb) {
  pm2.connect(function() {
    pm2.restart('test', function() { 
      return cb()
    })
  })
})


// Watch
gulp.task('watch', function() {
  gulp.watch('app/app/**', ['bundle-client'])
})

gulp.task('default', [ 'bundle', 'package' ])
