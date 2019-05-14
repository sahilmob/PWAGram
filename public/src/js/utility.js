var dbPromise = idb.open("posts-store", 1, function(db) {
	if (!db.objectStoreNames.contains("posts")) {
		db.createObjectStore("posts", { keyPath: "id" });
	}
});

function writeData(storeName, data) {
	return dbPromise.then(function(db) {
		var tx = db.transaction(storeName, "readwrite");
		var store = tx.objectStore(storeName);
		store.put(data);
		return tx.complete;
	});
}
