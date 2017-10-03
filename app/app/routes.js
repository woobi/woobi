import Home from './pages/home';
import Status from './pages/status';
import Channel from './pages/channels';
import Channels from './pages/channels/index';
import EPG from './pages/epg';
import EPGs from './pages/epg/index';
import TV from './pages/tvshows';
import TVs from './pages/tvshows/index';
import Movies from './pages/movies';
import Movie from './pages/movies/index';
import { isObject } from 'lodash';
import Debug from 'debug';
import FourZeroFour from './pages/404.js';
import App from './render.js';

let debug = Debug('woobi:app:routes');

let Routes = [];

// add each page
Routes.push({ path: 'status', component: Status });
Routes.push({ path: '404', component: FourZeroFour });

// redirects
function sendTo404(nextState, replaceState) {
	replaceState({ nextPathname: nextState.location.pathname }, '/404')
}
Routes.push({ path: 'lost', onEnter: sendTo404 });

function sendToStatus(nextState, replaceState) {
	replaceState({ nextPathname: nextState.location.pathname }, '/status')
}
Routes.push({ path: 'disconnected', onEnter: sendToStatus })

function sendToChannels(nextState, replaceState) {
	replaceState({ nextPathname: nextState.location.pathname }, '/tv')
}

Routes.push({ path: '/home', onEnter: sendToChannels });
Routes.push({ path: '/', onEnter: sendToChannels });

Routes.push({
    path: 'channels', 
    component: Channel,
    indexRoute: { component: Channels.Home },
    catchAll: { component: Channels.Home },
    childRoutes: [
		{ path: ':action', component: Channels.Home },
		{ path: ':action/:id', component: Channels.Home },
		{ path: 'view/:channel', component: Channels.Home },
    ]
});

Routes.push({
    path: 'livetv', 
    component: EPG,
    indexRoute: { 
		onEnter: (nextState, replace) => replace('/tv')
	}
});

Routes.push({
    path: 'tv', 
    component: EPG,
    indexRoute: { component: EPGs.Home },
    catchAll: { component: EPGs.Home },
    childRoutes: [
		{ path: 'guide', component: EPGs.Home },
		{ path: 'guide/:group', component: EPGs.Home },
		{ path: 'channels', component: EPGs.Channels },
		{ path: 'channels/:group', component: EPGs.Channels },
		{ path: 'channels/:group/', component: EPGs.Channels },
		{ path: 'channel/:channel', component: EPGs.Home },
		{ path: 'channel/:channel/:episode', component: EPGs.Home },
		{ path: 'timers', component: EPGs.Timers },
		{ path: 'series', component: EPGs.Series },
    ]
});

Routes.push({
    path: 'library/tv', 
    component: TV,
    indexRoute: { component: TVs.Home },
    catchAll: { component: TVs.Home },
    childRoutes: [
		{ path: 'episode/:show/:episode', component: TVs.Episode },
		{ path: 'recent', component: TVs.Recent },
		{ path: ':imdb', component: TVs.Show },
    ]
});


Routes.push({
    path: 'library/movies', 
    component: Movies,
    indexRoute: { component: Movie.Home },
    catchAll: { component: Movie.Home },
    childRoutes: [
		{ path: 'movie/:imdb', component: Movie.Show },
		{ path: ':recent', component: Movie.Home },
    ]
});

Routes.push({ path: '*', component: FourZeroFour })

// export
export const routeConfig = [
  { path: '/',
    component: App,
    indexRoute: { component: Home },
    catchAll: { component: FourZeroFour },
    childRoutes: Routes
  }
]

export const staticConfig = [
  { path: '/noscript/',
    component: App,
    indexRoute: { component: Home },
    catchAll: { component: FourZeroFour },
    childRoutes: Routes
  }
]

export default routeConfig

