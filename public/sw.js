self.addEventListener("install", function(event) {
	console.log("[Service worker] Installing", event);
});

self.addEventListener("activate", function(event) {
	console.log("[Service worker] Activating", event);
	return self.clients.claim();
});

self.addEventListener("fetch", function(event) {
	console.log("[Service worker] Fetch", event);
	event.respondWith(fetch(event.request));
});
