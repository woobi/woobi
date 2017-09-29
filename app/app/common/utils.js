import TinyColor from 'tinycolor';
import React, { Component } from 'react';
import { FontIcon, IconButton } from 'material-ui';
import { Styles } from './styles';
import naturalSorter from 'javascript-natural-sort';
import sanitize from 'sanitize-filename';

import debugging from 'debug';
let	debug = debugging('woobi:app:common:utils');

export let cleanFileName = function ( file ) {
	return sanitize(file);
}

export let Request = function ( props, emitTo, list = 'woobi' ) {
	debug('Send request ', list, props, this.state);
	return this.state.Sockets.grab(Object.assign({ 
		list,
		action: 'find',
		limit: 20,
		skip: 0,
	}, props), emitTo);
	
	return true; 
}

export let Random = function randomIntFromInterval ( min, max ) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

export let naturalSort = naturalSorter;

export let ColorMe = function ColorMe ( value, color ) {
	
	var colors = {
		color: TinyColor(color).darken(value).toString(),
		bgcolor: TinyColor(color).lighten(value).toString()
	}
	
	var light = TinyColor(colors.color).isLight();
	var light2 = TinyColor(colors.bgcolor).isLight();
	
	if(light && light2) {
		// text and bg are light
		return  {
			color: TinyColor(color).darken(value + 40).toString(),
			bgcolor: TinyColor(color).darken(value).toString()
		}
	} else if(!light && !light2) {
		// both are dark
		return  {
			color: TinyColor(color).lighten(value + 40).toString(),
			bgcolor: TinyColor(color).lighten(value).toString()
		}
	
	} else {	
		return colors
	}
}
