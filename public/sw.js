var CACHE_STATIC_NAME = "static-6";
var CACHE_DYNAMIC_NAME = "dynamic-v5";
var STATIC_FILES = [
	"/",
	"/index.html",
	"/offline.html",
	"/src/js/app.js",
	"/src/js/feed.js",
	"/src/js/promise.js",
	"/src/js/fetch.js",
	"/src/js/material.min.js",
	"/src/css/app.css",
	"/src/css/feed.css",
	"src/images/main-image.jpg",
	"https://fonts.googleapis.com/css?family=Roboto:400,700",
	"https://fonts.googleapis.com/icon?family=Material+Icons",
	"https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

function trimCache(cacheName, maxItems) {
	caches.open(cacheName).then(function(cache) {
		return cache.keys().then(function(keys) {
			if (keys.length > maxItems) {
				cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
			}
		});
	});
}

self.addEventListener("install", function(event) {
	console.log("[Service worker] Installing", event);
	event.waitUntil(
		caches.open(CACHE_STATIC_NAME).then(function(cache) {
			console.log("[Service Worker] Precaching App Shell");
			cache.addAll(STATIC_FILES);
		})
	);
});

self.addEventListener("activate", function(event) {
	console.log("[Service worker] Activating", event);
	event.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(
				keyList.map(function(key) {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log("[Service Worker] Removing old cache. ", key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim();
});

// self.addEventListener("fetch", function(event) {
// 	event.respondWith(
// 		fetch(event.request).then(function(response) {
// 			caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
// 				cache.put(event.request.url, response);
// 				return response;
// 			});
// 		})
// 	);
// });

function isInArray(string, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === string) {
			return true;
		}
	}
	return false;
}

self.addEventListener("fetch", function(event) {
	var url = "https://pwagram-f1780.firebaseio.com/posts.json";
	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
				fetch(event.request).then(function(response) {
					// trimCache(CACHE_DYNAMIC_NAME, 3);
					cache.put(event.request.url, response.clone());
					return response;
				});
			})
		);
	} else if (isInArray(event.request.url, STATIC_FILES)) {
		event.respondWith(caches.match(event.request));
	} else {
		event.respondWith(
			caches.match(event.request).then(function(response) {
				if (response) {
					return response;
				} else {
					return fetch(event.request)
						.then(function(res) {
							return caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
								cache.put(event.request.url, res.clone());
								return res;
							});
						})
						.catch(function(err) {
							return caches.open(CACHE_STATIC_NAME).then(function(cache) {
								if (
									event.request.url.headers.get("accept").includes("text/html")
								) {
									return cache.match("/offline.html");
								}
							});
						});
				}
			})
		);
	}
});

//Implementing dynamic caching after requesting data from the network
// self.addEventListener("fetch", function(event) {
// 	event.respondWith(
// 		caches.match(event.request).then(function(response) {
// 			if (response) {
// 				return response;
// 			} else {
// 				return fetch(event.request)
// 					.then(function(res) {
// 						return caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
// 							cache.put(event.request.url, res.clone());
// 							return res;
// 						});
// 					})
// 					.catch(function(err) {
// 						return caches.open(CACHE_STATIC_NAME).then(function(cache) {
// 							return cache.match("/offline.html");
// 						});
// 					});
// 			}
// 		})
// 	);
// });

// Network first strategy
// self.addEventListener("fetch", function(event) {
// 	event.respondWith(
// 		fetch(event.request)
// 			.then(function(res) {
// 				return caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
// 					cache.put(event.request.url, res.clone());
// 					return res;
// 				});
// 			})
// 			.catch(function(err) {
// 				return caches.match(event.request);
// 			})
// 	);
// });
