var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var serviceAccount = require("./pwagram-key.json");
var webpush = require("web-push");
const { vapidPublicKey, vapidPrivateKey } = require("./constants");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://pwagram-f1780.firebaseio.com/"
});
exports.storePostData = functions.https.onRequest(function(request, response) {
	cors(request, response, function() {
		admin
			.database()
			.ref("posts")
			.push({
				id: request.body.id,
				title: request.body.title,
				location: request.body.location,
				image: request.body.image
			})
			.then(function() {
				webpush.setVapidDetails(
					"mailto:sahil.hmob@hotmail.com",
					vapidPublicKey,
					vapidPrivateKey
				);
				return admin
					.database()
					.ref("subscriptions")
					.once("value");
			})
			.then(function(subscriptions) {
				subscriptions.forEach(function(subscription) {
					webpush
						.sendNotification(
							subscription.val(),
							JSON.stringify({ title: "New Post", content: "New Post added!" })
						)
						.catch(function(err) {
							console.log(err);
						});
				});
				response
					.status(201)
					.json({ message: "Data stored", id: request.body.id });
			})
			.catch(function(err) {
				response.status(500).json({ error: err });
			});
	});
});
