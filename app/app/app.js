import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import Debug from 'debug';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Router, match, browserHistory as history } from 'react-router'
import { routeConfig as routes } from './routes';
let debug = Debug('woobi:app');

if(!snowUI.__injected) {
	injectTapEventPlugin();
	snowUI.__injected = true;
}
window.myDebug = Debug;
// set the host to public
//snowUI.host = 'fire.snowpi.org';
snowUI.serverRendered = false;
let myComponent;
function createElementFn(serverProps) {
	return function(Component, props) {
		return <Component {...serverProps} {...props} />
	}
}
match({ history, routes }, (error, redirectLocation, renderProps) => {
	//console.log('APP RENDER', initialData, window.initialData, renderProps);
	myComponent = render(<Router { ...renderProps } createElement={createElementFn({ noscript: false, renderInitialData: window.renderInitialData })} />, document.getElementById('react-hot-reload'))
});
export function __unload() {
	// force unload React components
	unmountComponentAtNode(document.getElementById('react-hot-reload')); // your container node
}
export function __reload(m) {
	debug('__RELOAD App', m, snowUI.__state);
	if (snowUI.__state) {
		//myComponent.setState(snowUI.__state);
	}
}
