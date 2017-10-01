/**
 * 
 * global object to use across your client side code
 * 
 * */
 Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
};
Number.prototype.clip = function(numbers) {
	var number = Math.pow(10, numbers);
	return Math.round(this * number) / number;
}; 
var snowUI = {
	name: 'Woobi',
	materialStyle: {},
	defaultTheme: 'blue',
	__currentTheme: 'blue',
	__lastTheme: false,
	__userTheme: false,
	__state: {},
	namespace: '/lodge',
	shortenTitle: false,
	usesockets: true,
	homepage: '/',
	breaks: {
		xs: {
			width: 575
		},
		sm: {
			width: 768
		},
		md: {
			width: 992
		},
		lg: {
			width: 1200
		}
	},
	api: {
		uri: '/alvin/'
	},
	serverRendered: true
};

/* run code on start and end lifecycles */
snowUI.code = {
	__mountedUI: function(callback) {
		
	},
	__mountedPage: function(callback) {
		
	},
	__unmountUI: function(callback) {
		
	},
	__unmountPage: function(callback) {
		
	}
	
}

/* change the theme */
snowUI.toggleTheme = function() {
	$('body').toggleClass(snowUI.themeToToggle);
	return false;
}

snowUI.setTheme = function(setclass) {
	if(!snowUI.serverRendered) document.body.className = setclass;
	return false;
}

// fade the content div
snowUI.fadeOut = function(speed, me, callback) {
	if(!speed) speed = 400;
	if(typeof me == 'function') {
		callback = me;
		me = "#content-fader";
	} else if(typeof callback !== 'function') {
		callback = function() {};
	}
	if(!me) {
		me = "#content-fader";
	}
	var CF = $(me);
	if(CF.css('opacity') > 0) {
		CF.animate({opacity: 0}, speed, callback);
	} else {
		callback();
	}
}
snowUI.fadeIn = function(speed, me, callback) {
	if(!speed) speed = 400;
	if(typeof me == 'function') {
		callback = me;
		me = "#content-fader";
	} else if(typeof callback !== 'function') {
		callback = function() {};
	}
	if(!me) {
		me = "#content-fader";
	}
	var CF = $(me);
	if(CF.css('opacity') < 1) {
		CF.animate({opacity: 1}, speed, callback);
	} else {
		callback();
	}
}

snowUI.artStringReplace = function(art) {
	return art.replace('smb://SAM', '/media');
}

snowUI.videoStringReplace = function(art) {
	return art.replace('smb://SAM', '/direct');
	//return art.replace('smb://SAM', '/media');

}

// sticky menu
snowUI.unstickyMenu = function() {
	var simpledocs = document.getElementById('react-hot-reload');
	if(simpledocs && typeof simpledocs.removeEventListeners === 'function') {
		simpledocs.removeEventListeners();
	}
}
snowUI.stickyMenu = function() {
	
	var simpledocs = document.getElementById('react-hot-reload');
	simpledocs.addEventListener("scroll", scroller);
	
	function scroller(){ 
		
		var clientWidth = document.documentElement.clientWidth;
		
		if(clientWidth < snowUI.breaks.sm.width) {
			var $stickyMenu = $('.stickyMenu');
			if (!!$stickyMenu.offset()) { 
				if (simpledocs.offsetTop > 35){
					$stickyMenu.css({ zIndex: 1000, position: 'fixed', top: 0 });;
				} else {
					$stickyMenu.css('position', 'relative');
				}
			} 
		}
		
		var appbarTitle = document.getElementById('appbarTitle');
		var menu = document.getElementById('menu');
		
		if(snowUI.shortenTitle && simpledocs.scrollTop > 35) {
			appbarTitle.style.width = menu.clientWidth - 60 +'px';
			appbarTitle.style.overflow = 'hidden';
		} else if(snowUI.shortenTitle) {
			appbarTitle.style.width = 'initial';
			appbarTitle.style.overflow = 'initial';
		}	
	}
}
