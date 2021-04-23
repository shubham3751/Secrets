//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');



const app = express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema =new mongoose.Schema({ //now we have define a proper mongoose schema
     email: String,
    password: String
});

  //secure key
userSchema.plugin(encrypt, {secret:process.env.SECRET, encrptedFields: ["password"] }); //encriptedfields is used to encrypt a particular field

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
  });

  app.get("/register", function(req, res){
    res.render("register");
  });

app.post("/register", function(req, res){
    const newUser = new User({    // storing user data into the database
        email: req.body.username,
        password: req.body.password
    });
     
    newUser.save(function (err) {
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
      })

});

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    
    User.findOne({email: username}, function(err, foundUser){
        if(err) {
            console.log(err);
        }else {
            if( foundUser) {
                if(foundUser.password === password){
                    res.render("secrets");
                }

            }
        }
    });
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});