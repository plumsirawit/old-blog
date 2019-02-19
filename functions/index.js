const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const app = express();
const fse = require('fs-extra');
const Git = require('nodegit');
const path = require('path');
const local = path.join.bind(path, __dirname);
const publicKeyPath = local('key.pub');
const privateKeyPath = local('key');
const clonePath = path.join('/tmp','blog');
const auth = (req, res, next) => {
	var token;
	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split('Bearer ')[1];
	}else{
		console.error('No Firebase ID token found');
		res.status(401).send('Unauthorized');
		return;
	}
	admin.auth().verifyIdToken(token)
		.then((decodedIdToken) => {
			req.user = decodedIdToken;
			return next();
		}).catch((error) => {
			console.error('Error while verifying Firebase ID token:', error);
			res.status(401).send('Unauthorized');
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
function getFormattedDateOnly(){
	var cdate = new Date();
	var ofs = Math.round(-cdate.getTimezoneOffset()/60);
	cdate = new Date(cdate.getTime() + (7-ofs) * 3600000);
	var year = cdate.getFullYear();
	var month = zfill((cdate.getMonth() + 1).toString());
	var date = zfill(cdate.getDate().toString());
	var retString = year + '-' + month + '-' + date;
	return retString;
}
app.post('/newpost', (req,res) => {
	var dateString = getFormattedDate();
	var title = decodeURI(req.body.title);
	var body = decodeURI(req.body.body);
	var codeTitle = decodeURI(req.body.codetitle);
	var template = "---\nlayout: post\ntitle: \"" + title + "\"\ndate: " + dateString + "\ncategories: test\n---\n" + body;
	var codeRegex = /^[a-zA-Z0-9]$|^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/g;
	if(!codeRegex.test(codeTitle)){
		res.status(406).send('Code Title does not match regex (starts and ends with alphanumeric character and may contains alphanumeric or hyphen)');
		return;	
	}
	if(fse.existsSync(clonePath)){
		fse.removeSync(clonePath);
	}
	var dateOnlyString = getFormattedDateOnly();
	var repo;
	var index;
	var oid;
	var remote;
	var cred = Git.Cred.sshKeyNew('s6007589', publicKeyPath, privateKeyPath, '');
	console.log(cred);
	console.log(clonePath);
	console.log(publicKeyPath);
	console.log(privateKeyPath);
	console.log(fse.readFileSync(publicKeyPath,'utf8'));
	return Git.Clone('git@github.com:s6007589/s6007589.github.io.git',clonePath,
		{
			fetchOpts: {
				callbacks: {
					certificateCheck: function() {
						return 1;
					},
					credentials: function(url, userName) {
						return cred;
					}
				}
			}
		})
		.then(function(repoRes){
			console.log('Clone finished');
			repo = repoRes;
			fse.outputFileSync(path.join(clonePath,'_posts',dateOnlyString+'-'+codeTitle+'.markdown'), body, 'utf8');
			return repo.refreshIndex();
		})
		.then(function(indexRes){
			console.log('Refreshed Index');
			index = indexRes;
			return index.addByPath(path.join(clonePath,'_posts',dateOnlyString+'-'+codeTitle+'.markdown'));
		})
		.then(function(){
			console.log('Added Post');
			index.write();
		})
		.then(function(){
			console.log('Finished Writing Index');
			index.writeTree();
		})
		.then(function(oidRes){
			console.log('Finished Writing Tree');
			oid = oidRes;
			return Git.Reference.nameToId(repo, "HEAD");
		})
		.then(function(head){
			console.log('Gotten name to ID');
			return repo.getCommit(head);
		})
		.then(function(parent){
			console.log('Gotten Head Commit');
			var author = Git.Signature.now("Sirawit Pongnakintr", "s6007589@mwit.ac.th");
			return repo.createCommit("HEAD", author, author, "Test", oid, [parent]);
		})
		.then(function(commitId){
			console.log('Committed');
			console.log(commitId);
		})
		.then(function(){
			return Git.Remote.lookup(repo,"origin");
		})
		.then(function(remoteRes){
			remote = remoteRes;
			return remote.push(
				["refs/heads/master:refs/heads/master"],
				{
					callbacks: {
						credentials: function(url, username) {
							return cred;
						}
					}
				}
			);
		})
		.then(function(){
			res.status(201).send(template);
		})
		.catch(function(error){
			res.status(503).send(error);
		});
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
