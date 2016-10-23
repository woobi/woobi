import TinyColor from 'tinycolor';
import React, { Component } from 'react';
import { FontIcon, IconButton } from 'material-ui';
import { Styles } from './styles';

import debugging from 'debug';
let	debug = debugging('lodge:app:common:utils');

export let Request = function (props, emitTo, list = 'Game') {
	debug('Send request ', list, props, this.state);
	return this.state.Sockets.grab(Object.assign({ 
		list,
		action: 'find',
		limit: 20,
		skip: 0,
	}, props), emitTo);
	
	return true; 
}

export let normalizePitch = (pitched, normalized, config) => {
	let pitch = { ...pitched };
	pitch.normalized = normalized;
	let PZ = Number(pitch.pz);
	let ZTOP = Number(pitch.sz_top);
	let ZBOT = Number(pitch.sz_bot);
	let BALL = config.halfBall / 12;
	let normalizedZoneBox = normalized.zoneHeight;
	let isInYZone = (PZ <= (ZTOP ) && PZ >= (ZBOT ));
	let aboveTopZone = PZ > (ZTOP );
	let zoneBox = (ZTOP - ZBOT).clip(3);
	if (isInYZone) {
		let ballPos = ((ZTOP ) - PZ);
		let ballPercent = 0;
		if (ballPos > 0 && zoneBox > 0 ) {
			ballPercent = (ballPos / zoneBox);
		}
		let normalizedBall = (normalizedZoneBox - (normalizedZoneBox * ballPercent));
		pitch.normalized.pz = (normalizedBall + normalized.sz_bot).clip(3);	
	} else if (aboveTopZone) {
		let ballPos2 = (PZ - (ZTOP));
		let ballPercent = (ballPos2 / (normalized.boundTop - ZTOP));
		let normalizedBall = (normalized.aboveTop * ballPercent);
		pitch.normalized.pz = (normalizedBall + normalized.sz_top).clip(3);
	} else {
		let ballPercent = (PZ / (ZBOT ));
		pitch.normalized.pz = (normalized.belowBottom * ballPercent).clip(3);				
	}
	if (!PZ) {
		pitch.normalized.style.ballBottom = 0;
	} else {
		let BALLY = pitch.normalized.pz * 12;
		pitch.normalized.style.ballBottom = (BALLY - BALL);
	}
	return pitch;
};

export let ColorMe = function ColorMe(value, color) {
	
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
