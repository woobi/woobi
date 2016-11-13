import { colors, themeManager, getMuiTheme } from 'material-ui/styles';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import { defaultsDeep as deep } from 'lodash';
import { ColorMe } from './utils';

export let WOOBI  = deep( {
	palette: {
		primary2Color: colors.blue300,
		textColor: colors.blue50,
		alternateTextColor: colors.lightBlue500,
		primary1Color: 'initial',
		canvasColor: '#001933',
		bodyColor: 'initial',
		contentColor: 'initial',
		accent1Color: colors.lightBlue700,
		accent2Color: colors.lightBlue800,
		accent3Color: colors.lightBlue900,
		disabledColor: colors.grey600,
	},
	snackbar: {
		textColor: '#222',
	},
	drawer: {
		backgroundColor: colors.lightBlue100,
	},
	tabs: {
		textColor: colors.lightBlue300,
		selectedTextColor: colors.lightBlue50,
	},
	raisedButton: {
		textColor: '#001933',
		secondaryTextColor: 'white',
	},
	appBar: {
		buttonColor: colors.indigoA200,
		textColor: colors.indigo100,
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, darkBaseTheme);

export let NITELITE  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: 'initial',
		textColor: colors.indigo50,
		alternateTextColor: colors.blue200,
		primary2Color: colors.indigoA200,
		canvasColor: colors.indigo400,
		accent1Color: colors.indigo700,
		accent2Color: colors.indigo200,
		accent3Color: colors.indigo900,
		disabledColor: colors.grey300,
	},
	snackbar: {
		textColor: '#222',
		
	},
	raisedButton: {
		textColor: colors.indigo400,
	},
	appBar: {
		buttonColor: colors.blue200
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, darkBaseTheme);

export let NITELITE2  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: 'initial',
		primary2Color: '#77B5D0',
		textColor: colors.orange700,
		accent1Color: colors.orange700,
		accent2Color: colors.orange500,
		accent3Color: colors.orange300,
		alternateTextColor: colors.indigo300,
	},
	snackbar: {
		textColor: '#222',
		
	},
	appBar: {
		textColor: colors.orange900,
		buttonColor: colors.orangeA700,
		//color: colors.indigo800,
	},
	flatButton: {
		textColor: colors.orange700,
	},
	menuItem: {
		textColor: colors.orange700,
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
	
}, darkBaseTheme);

export let LIGHT  = deep( {	
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: '#FFFFFF',
		textColor: colors.indigo900,
		alternateTextColor: colors.indigoA700,
		primary2Color: "#E040FB",
		canvasColor: '#FFFFFF',
		accent1Color: colors.indigoA200,
		accent2Color: colors.indigoA400,
		accent3Color: colors.orange900,
		disabledColor: colors.grey600,
	},
	snackbar: {
		textColor: '#222',
		
	},
	raisedButton: {
		textColor: '#FFFFFF',
		secondaryTextColor: 'white',
	},
	appBar: {
		buttonColor: colors.indigoA200,
		//textColor: colors.indigo100,
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, lightBaseTheme);

export let CREAM  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: 'initial',
		primary2Color: colors.lightBlue700,
		textColor: colors.grey700,
		accent1Color: colors.blue50,
		accent2Color: colors.blue500,
		accent3Color: colors.lightBlack,
		alternateTextColor: colors.blue600,
	},
	snackbar: {
		textColor: '#222',
		
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, lightBaseTheme);


export let GRAPHITE  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: 'initial',
		primary3Color: colors.deepPurple200,
		primary2Color: colors.deepPurple300,
		textColor: colors.deepPurple200,
		accent1Color: colors.deepPurple200,
		accent2Color: colors.pink200,
		accent3Color: "#FA905C",
		alternateTextColor: colors.pink300,
	},
	snackbar: {
		textColor: '#222',
		
	},
	appBar: {
		textColor: colors.deepPurple400,
		buttonColor: colors.deepPurple200
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, darkBaseTheme);

export let NIGHT  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: 'initial',
		primary2Color: '#303030',
		textColor: ColorMe(30, colors.indigoA200).bgcolor,
		accent1Color: colors.indigo900,
		accent2Color: colors.indigoA700,
		accent3Color: colors.indigo100,
		alternateTextColor: colors.indigo300,
		searchBarMini: '#E8EAF6',
		searchBarLarge: 'initial',
	},
	snackbar: {
		textColor: '#222',
		
	},
	appBar: {
		textColor: colors.indigo50,
		buttonColor: colors.indigoA200,
		//color: colors.indigo800,
	},
	flatButton: {
		textColor: '#fff',
	},
	tabs: {
		textColor: colors.blue900,
		selectedTextColor: colors.amber700,
	},
	raisedButton: {
	},
	menuItem: {
		textColor: '#fff',
	},
	searchBar: {
		large: 'initial',
		largeColor: colors.indigoA100,
		mini: '#E8EAF6',
		miniColor: 'initial',
	}
}, darkBaseTheme);

export let ALTERNATEBLUE  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: '#ffffff',
		primary1Color: '#1A237E',
		primary2Color: '#448AFF',
		primary3Color: '#4CAF50',
		canvasColor: '#FFFFFF',
		textColor: '#1A237E',
		accent1Color: colors.blue100,
		accent2Color: colors.blue200,
		accent3Color: "#5C6BC0",
		alternateTextColor: '#0C87C1',
	},
	snackbar: {
		textColor: '#222',
	},
	appBar: {
		textColor: colors.orangeA700,
		buttonColor: colors.orangeA700
	},
	flatButton: {
		textColor: '#303030',
	},
	menuItem: {
		textColor: '#303030',
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, lightBaseTheme);


export let BLUE  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial',
		primary1Color: colors.indigo800,
		primary2Color: '#303030',
		accent1Color: colors.blue100,
		accent2Color: colors.blue200,
		accent3Color: "#5C6BC0",
		textColor: colors.indigo100,
		alternateTextColor: colors.blue800,
	},
	snackbar: {
		textColor: '#222',
		
	},
	appBar: {
		textColor: '#fff',
		buttonColor: '#bbb'
	},
	flatButton: {
		textColor: '#fff',
	},
	tabs: {
		textColor: colors.blue100,
		selectedTextColor: colors.orangeA700,
	},
	raisedButton: {
		textColor: '#222',
	},
	menuItem: {
		textColor: '#fff',
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, darkBaseTheme);

export let DEFAULT  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial'
	},
	snackbar: {
		textColor: '#222',
		
	},
	searchBar: {
		large: 'initial',
		largeColor: 'initial',
		mini: '#E8EAF6',
		miniColor: 'initial',
	}
}, lightBaseTheme);

export let DARK  = deep( {
	palette: {
		bodyColor: 'initial',
		contentColor: 'initial'
	},
	searchBar: {
		large: 'initial',
		mini: '#E8EAF6',
	}
}, darkBaseTheme);

export let Styles = {
	Colors: colors,
	getMuiTheme: getMuiTheme,
	ThemeManager: themeManager,
	DarkRawTheme: darkBaseTheme,
	LightRawTheme: lightBaseTheme,
	DARK,
	DEFAULT,
	BLUE,
	GRAPHITE,
	LIGHT,
	NIGHT,
	CREAM,
	ALTERNATEBLUE,
	WOOBI,
	NITELITE,
	NITELITE2
}
