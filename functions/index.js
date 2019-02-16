const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const app = express();
var Git = require('nodegit');
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
function zfill(str){
	var strc = str;
	while(strc.length < 2){
		strc = '0' + strc;
	}
	return strc;
}
function getFormattedDate(){
	var cdate = new Date();
	var ofs = Math.round(-cdate.getTimezoneOffset()/60);
	cdate = new Date(cdate.getTime() + (7-ofs) * 3600000);
	var year = cdate.getFullYear();
	var month = zfill((cdate.getMonth() + 1).toString());
	var date = zfill(cdate.getDate().toString());
	var hour = zfill(cdate.getHours().toString());
	var mins = zfill(cdate.getMinutes().toString());
	var secs = zfill(cdate.getSeconds().toString());
	var dateString = year + '-' + month + '-' + date + ' ' + hour + ':' + mins + ':' + secs + ' +0700';
	return dateString;
}
app.post('/newpost', (req,res) => {
	var dateString = getFormattedDate();
	var template = "---\nlayout: post\ntitle: \"Test\"\ndate: " + dateString + "\ncategories: test\n---\n" + req.body.body;
	console.log(req.body);
	Git.Clone('https://github.com/s6007589/s6007589.github.io','/tmp/blog');
	var regex = "/^([a-zA-Z])|([a-zA-Z][a-zA-Z0-9-]*[a-zA-Z])$/gm"
	res.status(200).send(template);
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
