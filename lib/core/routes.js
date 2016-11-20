var async = require('async');
var _ = require('lodash');
var path = require('path');
var less = require('express-less');
var express= require('express');
var React = require('react');
var ReactServer = require('react-dom/server');
var renderToString = ReactServer.renderToString;
var renderToStaticMarkup = ReactServer.renderToStaticMarkup;
var Router = require('react-router');
var match = Router.match;
var RouterContext = Router.RouterContext;
var RouterContextFactory = React.createFactory(RouterContext);
var getInitialData = require('./getInitialData');
var SystemJS = require('systemjs');
SystemJS.config({ baseURL: path.join(__dirname, '../', '../', '/app') });
require('../../app/configServer.js');
var nodeadmin = require('nodeadmin');
var	debug = require('debug')('woobi:lib:core:routes');

// needed for server rendering
global.navigator = { userAgent: 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.19 Safari/537.36 OPR/39.0.2226.0 (Edition developer)' };

var Routes;
var StaticRoutes;
SystemJS.import('gblconfig')
.then(SystemJS.import('app/routes').then(function(m) {
	Routes = m.default;
	StaticRoutes = m.staticConfig;
	console.log("#### Routes Loaded ####");
})).catch(console.error.bind(console));

module.exports = function(app, Broadcast, opts) {
	var ENV = app.get('env');
	
	app.use(express.static(path.join(__dirname, '../', '../', 'static')));
	app.use('/app', express.static(path.join(__dirname, '../', '../', 'app')));
	app.use(
		'/css',
		less(
			path.join(__dirname, '../', '../', 'app', 'styles'),
			{ 
				compress: ENV == 'production',
				debug: ENV == 'development'
			}
		)
	);
	
	if(opts.nodeadmin) {
		debug('NodeAdmin', opts.nodeadmin);
		app.use(nodeadmin(app));
	} 
	
	app.get('/', (req, res) => {
		res.redirect('/channels');
	});
	/**
	 *  noscript user routes
	 *  injects a noscript prop used for server rendering
	 *  if noscript='mobile' a mobile view is rendered
	 * 
	 * TODO: set up session link to switch between mobile and desktop
	 * 
	 * */
	app.get('/noscript/*', function(req, res) {
		doMatch(req, res, StaticRoutes, true, Broadcast);
	});
	
	/** FINAL REACT Routes **/
	app.get('*', function(req, res) {
		doMatch(req, res, Routes, false, Broadcast);	
	});
	
}

function createElementFn(serverProps) {
	return function(Component, props) {
		return React.createFactory(Component)( _.assign(props, serverProps));
	}
} 

function doMatch(req, res, routes, noscript, Broadcast) {
	//console.log('DOMATCH', routes, req.url);
	//var storesInitialDataScript =  'var renderInitialData = {}';
	//res.status(200).send(render( '', storesInitialDataScript, noscript ));
	//return;
	global.serverRendered = true;
	global.navigator = { userAgent: req.headers['user-agent'] };
	match({ routes: routes, location: req.url }, function (error, redirectLocation, renderProps) {
		if (error) {
			res.status(500).send(error.message)
		} else if (redirectLocation) {
			res.redirect(302, redirectLocation.pathname + redirectLocation.search)
		} else if (renderProps) {
			// You can also check renderProps.components or renderProps.routes for
			// your "not found" component or route respectively, and send a 404 as
			// below, if you're using a catch-all route.
			// console.log(renderProps);
				var IData = {
					assets: {}
				}
				getInitialData(renderProps, Broadcast).then(data2 => {
					// merge the assets with page data
					var initialProps = JSON.stringify(data2);
					initialProps = JSON.parse(initialProps);
					// set the createElement prop to add out initial data to the prop structure
					_.assign(renderProps, {createElement: createElementFn({ noscript: noscript, renderInitialData: initialProps})});
					// create a factory and render to string
					console.log('Create PAGE');
					var component = renderToString(RouterContextFactory( renderProps ));
					// send along the initial data
					var storesInitialDataScript = initialProps ? `var renderInitialData = ${safeStringify(initialProps)};` : 'var renderInitialData = {}';
					console.log('SEND PAGE');
					res.status(200).send(render( component, storesInitialDataScript, noscript, Broadcast));
				})
				.catch(console.log);
			
			
			
			
		} else {
			res.status(404).send(render('<h1>404 Page Not Found</h1>'));
		}
	})
}

function render(text, script, static, Broadcast) {
	var bodyRender = static ? renderBodyNoScript : renderBody;
	return renderHead() + bodyRender(text, script, Broadcast);
}

function renderHead() {
	return ('<head><meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" /><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta httpEquiv="X-UA-Compatible" content="IE=edge" /><title>The Lodge</title><link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" /><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" /><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" /><link rel="stylesheet" href="https://npmcdn.com/react-select/dist/react-select.css" /><link rel="stylesheet" href="/app/jspm_packages/npm/react-html5video@1.2.12/dist/ReactHtml5Video.css" /><link rel="stylesheet" type="text/css" href="/css/material-ui.css" /></head>');
}

function renderBodyNoScript(text) {
	return ('<body class="light-theme theme-light"><div id="body"><div id="react-hot-reload" >' + text + '</div><div className="container"><div id="footer"></div></div></body>');
}

function renderBody(text, script, Broadcast) {
	return ('<body class="light-theme theme-light"><div id="body"><div id="confirm-modal"></div><div id="react-hot-reload" >' + text + '</div><div className="container"><div id="footer"></div></div><script src="/app/gblconfig.js" ></script><script>snowUI.host=\'' + Broadcast.get('host') + '\';snowUI.port=\'' + Broadcast.get('port') + '\';</script><script type="text/javascript" src="https://cdn.jsdelivr.net/clappr/latest/clappr.min.js"></script><script>' + script + '</script><script src="/js/bundles/material-ui.js" ></script></body>');
}

// A utility function to safely escape JSON for embedding in a <script> tag
function safeStringify(obj) {
  return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--')
}
