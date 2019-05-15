var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var serviceAccount = require("./pwagram-key.json");
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
				id: req.body.id,
				title: req.body.title,
				location: req.body.location,
				image: req.body.image
			})
			.then(function() {
				res.status(201).json({ message: "Data stored", id: request.body.id });
			})
			.catch(function(err) {
				response.status(500).json({ error: err });
			});
	});
});
