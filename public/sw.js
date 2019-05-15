importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

var CACHE_STATIC_NAME = "static-12";
var CACHE_DYNAMIC_NAME = "dynamic-v5";
var STATIC_FILES = [
	"/",
	"/index.html",
	"/offline.html",
	"/src/js/app.js",
	"/src/js/feed.js",
	"/src/js/idb.js",
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
var url = "https://pwagram-f1780.firebaseio.com/posts.json";

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
	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			fetch(event.request).then(function(res) {
				var clonedRes = res.clone();
				clearAllData("posts")
					.then(function() {
						return clonedRes.json();
					})
					.then(function(data) {
						for (var key in data) {
							writeData("posts", data[key]);
						}
					});
				return res;
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

self.addEventListener("sync", function(event) {
	console.log("[Service worker] Background syncing", event);
	if (event.tag === "sync-new-post") {
		console.log("[Service worker] Syncing new post");
		event.waitUntil(
			readAllData("sync-posts").then(function(data) {
				//loop through data to check if there is more than one post submitted while there is no connection
				for (var dt of data) {
					fetch(url, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json"
						},
						body: JSON.stringify({
							id: dt.id,
							title: dt.title,
							location: dt.location,
							image:
								"https://firebasestorage.googleapis.com/v0/b/pwagram-f1780.appspot.com/o/sf-boat.jpg?alt=media&token=65d437f9-c833-47a8-a881-cd6207983ef4"
						})
					})
						.then(function(response) {
							console.log("Sent data", response);
							if (response.ok) {
								deleteItemFromData("sync-posts", dt.id);
							}
						})
						.catch(function(err) {
							console.log("Error while sending data", err);
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
