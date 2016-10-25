import '../gblconfig.js';
import Home from './pages/home';
import Status from './pages/status';
import Page from './pages/page';
import Channel from './pages/channels';
import Channels from './pages/channels/index';
import Fetch from './pages/fetch';
import { isObject } from 'lodash';
import Debug from 'debug';
import FourZeroFour from './pages/404.js';
import App from './render.js';

let debug = Debug('lodge:app:routes');

let Routes = [];

// add each page
Routes.push({ path: 'status', component: Status });
Routes.push({ path: 'page', component: Page });
Routes.push({ path: 'fetch', component: Fetch });
Routes.push({ path: 'json', component: Fetch });
Routes.push({ path: 'markdown', component: Fetch });
Routes.push({ path: 'status', component: Fetch });
//Routes.push({ path: 'home', component: Home });
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
	replaceState({ nextPathname: nextState.location.pathname }, '/channels')
}

Routes.push({
    path: 'channels', 
    component: Channel,
    indexRoute: { component: Channels.Home },
    catchAll: { component: Channels.Home },
    childRoutes: [
		{ path: 'add', component: Channels.Home },
		{ path: 'view/:channel', component: Channels.Home },
    ]
});

Routes.push({ path: '*', component: FourZeroFour })

// export
export const routeConfig = [
  { path: '/',
    component: Channel,
    indexRoute: { component: Channels.Home },
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

