const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express')
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const app = express();

const auth = (req, res, next) => {
	var token;
	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split('Bearer ')[1];
	}else{
		console.error('No Firebase ID token found');
		res.status(403).send('Unauthorized');
		return;
	}
	admin.auth().verifyIdToken(token)
		.then((decodedIdToken) => {
			req.user = decodedIdToken;
			return next();
		}).catch((error) => {
			console.error('Error while verifying Firebase ID token:', error);
			res.status(403).send('Unauthorized');
		});
};

app.use(cors);
app.use(auth);
app.post('/newpost', (req,res) => {
	
});
app.post('/newdraft', (req,res) => {

});
exports.auth = functions.region('asia-northeast1').https.onRequest(app);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
