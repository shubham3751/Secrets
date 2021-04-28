//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');
//const bcrypt = require('bcrypt');
//const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

//console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({                   //initializing session 
    secret: "My little secrets.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());   // initializing passport
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-shubham:Shubham123@secrets.rrhsf.mongodb.net/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
const userSchema =new mongoose.Schema({ //now we have define a proper mongoose schema
     email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


  //secure key
//userSchema.plugin(encrypt, {secret:process.env.SECRET, encrptedFields: ["password"] }); //encriptedfields is used to encrypt a particular field

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); 

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));  //after clicking on signin with google it will initiate authetication with google

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),  //authenticating locally
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res){
    res.render("login");
  });

  app.get("/register", function(req, res){
    res.render("register");
  });

  app.get("/secrets", function(req, res){
      User.find({"secret": {$ne: null}}, function(err, foundUsers){    //users secrets should not be equal to none
          if(err){
              console.log(err);
          }else{
              if(foundUsers){
                  res.render("secrets", {usersWithSecrets: foundUsers});
              }
          }
      });
  });

  app.get("/submit", function(req, res){
      
    if (req.isAuthenticated()){     //agar user authenticated hai tab hi secrets render hoga otherwise login page redirect hoga
        res.render("submit");
  }else{
      res.redirect("/login");
  }
  });

  app.post("/submit", function(req, res){   //user information is saved inside req expect hass and salt
      const submittedSecret = req.body.secret;

      console.log(req.user.id);

      User.findById(req.user.id, function(err, foundUser){
          if(err){
              console.log(err);
          } else{
              if(foundUser){       //if founduser exist
                  foundUser.secret = submittedSecret;   //setting founduser secret field to submitted secret
                  foundUser.save(function(){
                      res.redirect("/secrets");
                  });
              }
          }
      });
  });

  app.get("/logout", function(req, res){
      req.logout();
      res.redirect("/");
  });

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.redirect("/register");                                 
        }else{
            passport.authenticate("local")(req, res, function(){  //agar error nhi show hua tab passport authenticate karega locally aur redirect kardega directly to secrets page
                res.redirect("/secrets");
            });
        }
    });

});


 // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
      
     //   const newUser = new User({    // storing user data into the database
      //      email: req.body.username,
      //      password: hash
     //   });
         
      //  newUser.save(function (err) {
      //      if(err){
           //     console.log(err);
          //  }else{
          //      res.render("secrets");
         //   }
       //   })

  //  });

app.post("/login", function(req, res){
      
   const user = new User({
       username: req.body.username,
       password: req.body.password,
   });
 
   req.login(user, function(err) {
    if (err) { 
        console.log(err);
     }else{
       passport.authenticate("local")(req, res, function(){
           res.redirect("/secrets");
       });
    }
  });
  
});




//const username = req.body.username;
 //   const password = req.body.password;
    
//    User.findOne({email: username}, function(err, foundUser){
        //if(err) {
          //  console.log(err);
        //}else {
            //if( foundUser ) {
                //bcrypt.compare(password, foundUser.password , function(err, result) {    // for comparing bcrypt hass with the password from database
                //    if( result === true){
              //          res.render("secrets");
            //        }
          //      });
                   
                

        //    }
      //  }
    //});

    // let port = process.env.PORT;
    // if (port == null || port == "") {
    //   port = 3000;
    // }
    // app.listen(port);

app.listen(process.env.PORT || 3000 , function(){
  console.log("Server started on port 3000.");
});