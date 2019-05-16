var deferredPrompt;
var enableNotificationsButtons = document.getElementsByClassName(
	"enable-notifications"
);

if (!window.Promise) {
	window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/sw.js")
		.then(function() {
			console.log("Service worker registered");
		})
		.catch(function(err) {
			console.log(err);
		});
}

window.addEventListener("beforeinstallprompt", function(event) {
	console.log("beforeinstallprompt fired");
	event.preventDefault();
	deferredPrompt = event;
	return false;
});

function displayConfirmationNotification() {
	if ("serviceWorker" in navigator) {
		var options = {
			body:
				"You successfully subscribed to our notification service (From SW)!",
			icon: "/src/images/icons/app-icon-96x96.png",
			image: "/src/images/sf-boat.jpg",
			dir: "ltr",
			lang: "en-US",
			vibrate: [100, 50, 200],
			badge: "/src/images/icons/app-icon-96x96.png",
			tag: "confirmation-notification",
			renotify: true,
			actions: [
				{
					action: "confirm",
					title: "Okay",
					icon: "/src/images/icons/app-icon-96x96.png"
				},
				{
					action: "cancel",
					title: "cancel",
					icon: "/src/images/icons/app-icon-96x96.png"
				}
			]
		};
		navigator.serviceWorker.ready.then(function(sw) {
			sw.showNotification("Successfully subscribed", options);
		});
	}
}

function configurePushSub() {
	if (!("serviceWorker" in navigator)) {
		return;
	}
	var swReg;
	navigator.serviceWorker.ready
		.then(function(sw) {
			swReg = sw;
			return sw.pushManager.getSubscription();
		})
		.then(function(sub) {
			if (sub === null) {
				var vapidPublicKey =
					"BL_wj4PG-4xTI2alweELHJfgaWTYuceLlOTevMB9Djn1bjulNFDKgPvmGjhxbgDSQECPzlJqqSv09ZANtcdLjqI";
				var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
				return swReg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: convertedVapidPublicKey
				});
			} else {
			}
		})
		.then(function(newSub) {
			return fetch("https://pwagram-f1780.firebaseio.com/subscriptions.json", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify(newSub)
			});
		})
		.then(function(res) {
			if (res.ok) {
				displayConfirmationNotification();
			}
		})
		.catch(function(err) {
			console.log(err);
		});
}

function askForNotificationPermission() {
	Notification.requestPermission(function(result) {
		console.log("User choice", result);
		if (result !== "granted") {
			console.log("Denied");
		} else {
			configurePushSub();
			// displayConfirmationNotification();
		}
	});
}

if ("Notification" in window && "serviceWorker" in navigator) {
	for (var i = 0; i < enableNotificationsButtons.length; i++) {
		enableNotificationsButtons[i].style.display = "inline-block";
		enableNotificationsButtons[i].addEventListener(
			"click",
			askForNotificationPermission
		);
	}
}
