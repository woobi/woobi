var _ = require('lodash');
var helpers = require('./helpers');

module.exports = function (state, live) {
    var storesInitialData = {};
    var storesInitialDataPromises = state.routes.reduce((promises, route) => {
        var routeInitialData = route.component.getInitialData;
        
        if (routeInitialData) {
            var getData = routeInitialData(state.params, state.location);
            console.log('## get initial data ##', state.params, state.location, getData);
            if(getData) {
				if(_.isObject(getData)) {
					Object.keys(getData).forEach(function(storeName) {
						if(storeName !== false) promises[storeName] =  doSearch(getData[storeName], live);
					});
				}
			}
        }

        return promises;
    }, {});
    
    return Promise.all(Object.keys(storesInitialDataPromises)
        .map(storeName => storesInitialDataPromises[storeName].then(storeInitialData => storesInitialData[storeName] = storeInitialData)
    )).then(() => storesInitialData, function(err) { console.log('ERR', err)});
};


function doSearch(options, live) {
	var fn = options.action;
	if(typeof helpers[fn] === 'function') {
		return helpers[fn].call(live, options);
	} else {
		return new Promise(resolve => resolve({}));
	}
}
