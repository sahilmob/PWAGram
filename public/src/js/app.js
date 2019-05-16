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

function askForNotificationPermission() {
	Notification.requestPermission(function(result) {
		console.log("User choice", result);
		if (result !== "granted") {
			console.log("Denied");
		} else {
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
