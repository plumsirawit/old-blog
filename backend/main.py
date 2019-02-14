from flask import Flask, request
from config import password, secret_token
app = Flask(__name__)

@app.route("/", methods = ['GET'])
def hello():
	return "Welcome to Plummmm's Back-end.<br>Here goes nothing."

@app.route("/login", methods = ['POST'])
def login():
	passwd = request.form.get('password', '')
	if passwd == '':
		return "[RJ] No password found"
	elif passwd == password:
		return "[OK] " + secret_token
	else:
		return "[RJ] Incorrect Password"
