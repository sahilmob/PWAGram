self.addEventListener("install", function(event) {
	console.log("[Service worker] Installing", event);
	event.waitUntil(
		caches.open("static").then(function(cache) {
			console.log("[Service Worker] Precaching App Shell");
			cache.add("/src/js/app.js");
		})
	);
});

self.addEventListener("activate", function(event) {
	console.log("[Service worker] Activating", event);
	return self.clients.claim();
});

self.addEventListener("fetch", function(event) {
	event.respondWith(fetch(event.request));
});
