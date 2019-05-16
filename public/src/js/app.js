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

function askForNotificationPermission() {
	Notification.requestPermission(function(result) {
		console.log("User choice", result);
		if (result !== "granted") {
			console.log("Denied");
		} else {
			displayConfirmationNotification();
		}
	});
}

if ("Notification" in window) {
	for (var i = 0; i < enableNotificationsButtons.length; i++) {
		enableNotificationsButtons[i].style.display = "inline-block";
		enableNotificationsButtons[i].addEventListener(
			"click",
			askForNotificationPermission
		);
	}
}
