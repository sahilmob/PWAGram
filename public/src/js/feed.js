var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
	"#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.getElementById("title");
var locationInput = document.getElementById("location");
var videoPlayer = document.getElementById("player");
var canvasElement = document.getElementById("canvas");
var captureButton = document.getElementById("capture-btn");
var imagePicker = document.getElementById("image-picker");
var imagePickerArea = document.getElementById("pick-image");
var picture;

function initMedia() {
	if (!("mediaDevices" in navigator)) {
		navigator.mediaDevices = {};
	}
	if (!("getUserMedia" in navigator.mediaDevices)) {
		navigator.mediaDevices.getUserMedia = function(constraints) {
			var getUserMedia =
				navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
			if (!getUserMedia) {
				return Promise.reject(new Error("getUserMedia is not implemented!"));
			}
			return new Promise(function(resolve, reject) {
				getUserMedia.call(navigator, constraints, resolve, reject);
			});
		};
	}
	navigator.mediaDevices
		.getUserMedia({ video: true })
		.then(function(stream) {
			videoPlayer.srcObject = stream;
			videoPlayer.style.display = "block";
		})
		.catch(function(err) {
			imagePicker.style.display = "block";
		});
}

captureButton.addEventListener("click", function(event) {
	canvasElement.style.display = "block";
	videoPlayer.style.display = "none";
	captureButton.style.display = "none";
	var context = canvasElement.getContext("2d");
	context.drawImage(
		videoPlayer,
		0,
		0,
		canvasElement.width,
		videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width)
	);
	videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
		track.stop();
	});
	picture = dataURItoBlob(canvasElement.toDataURL());
});

function openCreatePostModal() {
	createPostArea.style.display = "block";
	initMedia();
	if (deferredPrompt) {
		deferredPrompt.prompt();

		deferredPrompt.userChoice.then(function(result) {
			console.log(result.outcome);
			if (result.outcome === "dismissed") {
				console.log("User cancelled installation");
			} else {
				console.log("User added to home screen");
			}
		});
		deferredPrompt = null;
	}
}

function closeCreatePostModal() {
	createPostArea.style.display = "none";
	videoPlayer.style.display = "none";
	imagePicker.style.display = "none";
	canvasElement.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Currently not in use, allows to save cache on demand
// function onSaveButtonClicked(event) {
// 	console.log("clicked");
// 	if ("caches" in window) {
// 		caches.open("user-requested").then(function(cache) {
// 			cache.add("https://httpbin.org/get");
// 			cache.add("/src/images/sf-boat.jpg");
// 		});
// 	}
// }

function clearCards() {
	while (sharedMomentsArea.hasChildNodes()) {
		console.log("Clearing cards");
		sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
	}
}

function createCard(data) {
	var cardWrapper = document.createElement("div");
	cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
	var cardTitle = document.createElement("div");
	cardTitle.className = "mdl-card__title";
	cardTitle.style.backgroundImage = "url(" + data.image + ")";
	cardTitle.style.backgroundSize = "cover";
	cardTitle.style.height = "180px";
	cardWrapper.appendChild(cardTitle);
	var cardTitleTextElement = document.createElement("h2");
	cardTitleTextElement.style.color = "white";
	cardTitleTextElement.className = "mdl-card__title-text";
	cardTitleTextElement.textContent = data.title;
	cardTitle.appendChild(cardTitleTextElement);
	var cardSupportingText = document.createElement("div");
	cardSupportingText.className = "mdl-card__supporting-text";
	cardSupportingText.textContent = data.location;
	cardSupportingText.style.textAlign = "center";
	// var cardSaveButton = document.createElement("button");
	// cardSaveButton.textContent = "Save";
	// cardSaveButton.addEventListener("click", onSaveButtonClicked);
	// cardSupportingText.appendChild(cardSaveButton);
	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
	clearCards();
	for (var i = 0; i < data.length; i++) {
		createCard(data[i]);
	}
}

function transformObjectIntoArray(obj) {
	var dataArray = [];

	for (var key in obj) {
		dataArray.push(obj[key]);
	}
	return dataArray;
}

var url = "https://pwagram-f1780.firebaseio.com/posts.json";
var networkDataReceived = false;

fetch(url)
	.then(function(res) {
		return res.json();
	})
	.then(function(data) {
		networkDataReceived = true;
		console.log("creating card after request");
		var dataArray = transformObjectIntoArray(data);
		updateUI(dataArray);
	})
	.catch(function(err) {
		console.log("Error fetching request", err);
	});

if ("indexedDB" in window) {
	console.log("There is indexDB");
	readAllData("posts").then(function(data) {
		if (!networkDataReceived) {
			console.log("From cache", data);
			updateUI(data);
		}
	});
}

function sendData() {
	var id = new Date().toISOString();
	var postData = new FormData();
	postData.append("id", id);
	postData.append("title", titleInput.value);
	postData.append("location", locationInput.value);
	postData.append("file", picture, id + ".png");
	fetch("https://us-central1-pwagram-f1780.cloudfunctions.net/storePostData", {
		method: "POST",
		body: postData
	}).then(function(response) {
		console.log("Sent data", response);
		updateUI();
	});
}

form.addEventListener("submit", function(event) {
	event.preventDefault();
	if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
		alert("Please enter a valid data");
		return;
	}
	closeCreatePostModal();
	if ("serviceWorker" in navigator && "SyncManager" in window) {
		navigator.serviceWorker.ready.then(function(sw) {
			var post = {
				id: new Date().toISOString(),
				title: titleInput.value,
				location: locationInput.value,
				picture
			};
			writeData("sync-posts", post)
				.then(function() {
					return sw.sync.register("sync-new-post");
				})
				.then(function() {
					var snackbarContainer = document.getElementById("confirmation-toast");
					var data = { message: "Your post was saved for syncing!" };
					snackbarContainer.MaterialSnackbar.showSnackbar(data);
				})
				.catch(function(err) {
					console.log(err);
				});
		});
	} else {
		sendData();
	}
});

// if ("caches" in window) {
// 	caches
// 		.match(url)
// 		.then(function(response) {
// 			if (response) {
// 				// if response is found, we can parse it as json, cause it's a normal fetch response
// 				return response.json();
// 			}
// 		})
// 		.then(function(data) {
// 			if (!networkDataReceived) {
// 				console.log("creating card from cache");
// 				var dataArray = transformObjectIntoArray(data);
// 				updateUI(dataArray);
// 			}
// 		});
// }
