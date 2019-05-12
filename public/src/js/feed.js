var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
	"#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");

function openCreatePostModal() {
	createPostArea.style.display = "block";
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
	while (sharedMomentsArea.hasChildNodes) {
		console.log("Clearing cards");
		sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
	}
}

function createCard() {
	var cardWrapper = document.createElement("div");
	cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
	var cardTitle = document.createElement("div");
	cardTitle.className = "mdl-card__title";
	cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
	cardTitle.style.backgroundSize = "cover";
	cardTitle.style.height = "180px";
	cardWrapper.appendChild(cardTitle);
	var cardTitleTextElement = document.createElement("h2");
	cardTitleTextElement.style.color = "green";
	cardTitleTextElement.className = "mdl-card__title-text";
	cardTitleTextElement.textContent = "San Francisco Trip";
	cardTitle.appendChild(cardTitleTextElement);
	var cardSupportingText = document.createElement("div");
	cardSupportingText.className = "mdl-card__supporting-text";
	cardSupportingText.textContent = "In San Francisco";
	cardSupportingText.style.textAlign = "center";
	// var cardSaveButton = document.createElement("button");
	// cardSaveButton.textContent = "Save";
	// cardSaveButton.addEventListener("click", onSaveButtonClicked);
	// cardSupportingText.appendChild(cardSaveButton);
	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

var url = "https://httpbin.org/get";
var networkDataReceived = false;

fetch(url)
	.then(function(res) {
		return res.json();
	})
	.then(function(data) {
		networkDataReceived = true;
		clearCards();
		console.log("creating card after request");
		createCard();
	})
	.catch(function(err) {
		console.log("Error fetching request", err);
	});

if ("caches" in window) {
	caches
		.match(url)
		.then(function(response) {
			if (response) {
				// if response is found, we can parse it as json, cause it's a normal fetch response
				return response.json();
			}
		})
		.then(function(data) {
			if (!networkDataReceived) {
				console.log("creating card from cache");
				createCard();
			}
		});
}
