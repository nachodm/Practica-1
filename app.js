"use strict";

/*
    Antes de ejecutar este script, modifica el fichero "config.js"
    con la información de tu instalación de MySQL.
*/

const config = require("./config");
const mysql = require("mysql");
const daoUsers = require("./DAOs/daoUsers");
const daoQuestions = require("./DAOs/daoQuestions");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require ("express-session")
const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});
const mysqlSession = require("express-mysql-session");
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});
const middlewareSession = session ({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(middlewareSession);

let questions = new daoQuestions.daoQuestions(pool);
let users = new daoUsers.daoUsers(pool);

app.post("/sendFriendRequest", (request, response) => {
    users.sendFriendRequest(request.session.loggedUser.email, request.body.name, (err, result) => {
        if (result) {
            response.render("/friends", {requests: requests, friends: friends, user: request.session.loggedUser});
            response.end();
        }
    });
});

app.post("/isUserCorrect", (request, response) => {
    if (request.session.loggedUser !== undefined) {
        response.render("profile");
        response.end();
    }
    users.isUserCorrect(request.body.emailaddress, request.body.password, (err, result)=> {
        if (err) {
            console.log("Se ha producido un error.");
            response.render("main");
        } 
        if (result === false) {
            response.render("main");
        }
        else {
            users.getUser(request.body.emailaddress, (err, user) => {
                request.session.loggedUser = user;
                response.render("profile", {user: request.session.loggedUser});
            });
        }
    });
});

app.get("/friends", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("main");
    }
    users.getFriendRequests(request.session.loggedUser.email, (err, requests) => {
        if (err) {
            console.log("Se ha producido un error.");
            response.end();
        } else {
            users.getUserFriends(request.session.loggedUser.email, (err, friends) => {        
                if (err) {
                    console.log("Se ha producido un error.");
                    response.end();
                } else {
                    response.render("friends", { requests: requests, friends: friends, user: request.session.loggedUser });
                }
            });
        }
    });
});

app.post("/friends_Search", (request, response) => {
    users.search(request.body.searchfriend, request.session.loggedUser.email, (err, result) => {
        if (err) {
            console.log("Se ha producido un error.");
            response.end();
        } else {
            response.render("searchResults", {user: request.session.loggedUser, friends: result});
         }

    });
});
app.get("/", (request, response) => {
    response.render("main", {user: request.session.loggedUser})
    response.end();
});

app.get("/main", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.render("main")
        response.end();
    }
    response.render("profile", {user: request.session.loggedUser})
    response.end();
});

app.get("/signup", (request, response) => {
    if (request.session.loggedUser !== undefined) {
        response.render("profile");
        response.end();
    }
    response.render("signup");
    response.end();
});

app.get("/redirectModify", (request, response) => {
    response.render("modify", {user: request.session.loggedUser});
    response.end();
});

app.get("/questions", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.render("main");
    }
    else {
        questions.randomQuestion((err, result) => {
            if (err) {
                response.write("ERROR");
                response.end;
            }
            else {
                response.render("questions", {user: request.session.loggedUser, questions:result})
                response.end();
            }
        });
    }
});

app.get("/profile", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("main");
    }
    response.render("profile", {user: request.session.loggedUser})
    response.end();
});

app.get("/modify", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("main");
    }
    response.render("modify", {user: request.session.loggedUser})
    response.end();
});

app.post("/newUser", (request, response) => {
    request.session.loggedUser = {
        email: request.body.newemailaddress,
        password: request.body.newpassword,
        name: request.body.newname,
        gender: request.body.gender,
        birthdate: request.body.birthdate,
        profile_picture: request.body.profilepic,
        points: 0
    } 
    users.newUser(request.session.loggedUser, err=> {
        response.write("ERROR");
        response.end();
    });
    response.render("profile", {user: request.session.loggedUser});
    response.end();
});

app.get("/logout", (request, response) => {
    request.session.destroy();
    response.redirect("/main");
});

app.post("/modifyUser", (request, response) => {
    let modifiedUser = {
        email: request.body.newemailaddress,
        password: request.body.newpassword,
        name: request.body.newname,
        gender: request.body.gender,
        birthdate: request.body.birthdate,
        profile_picture: request.body.profilepic,
        points: request.session.loggedUser.points
    } 

    users.modifyUser(modifiedUser, (err, result) => {
        if (err) {
            console.log("Se ha producido un error.");
            response.end();
        }
        if (result) {
            request.session.loggedUser = modifiedUser;
            response.render("profile", {user: request.session.loggedUser});
            response.end();
        } 
    });
});

app.post("/newUser", (request, response) => {
    if (err) {
        users.newUser(request.body.user, err=> {
            response.write("ERROR");
            response.end();
        });
    }
    else {
        users.getUser(request.body.emailaddress, (err, user) => {
            request.session.loggedUser = user;
            response.render("profile", {user: request.session.loggedUser});
            response.end();
        });
        request.session.loggedUser = request.body.emailaddress;
        response.render("profile");
        response.end();
    }
});

app.post("/createQuestion", (request, response)=>{
    let question = {
        text: request.body.newQuestion,
        op1: request.body.op1,
        op2: request.body.op2,
        op3: request.body.op3,
        other: request.body.other,
    } 
        questions.insertQuestion(question, err =>{
            if(err){
                response.write("ERROR");
                response.end();
            }
            else{
                response.redirect("/questions");
                response.end();
            }
        });
});

app.get("/showQuestions",(request,response) =>{

    questions.randomQuestion(err,result =>{
        if (err) {
            console.log("Se ha producido un error.");
            response.end();
        } else {
            response.render("questions", {user: request.session.loggedUser, questions: result});
         }

    });
});
app.get("/newQuestions", (request,response)=>{
    response.render("newQuestion");
    response.end();
});

app.listen(config.port, (err) => {
    if (err) {
        console.error("No se pudo inicializar el servidor: " + err.message);
    } else {
        console.log("Servidor arrancado en el puerto " + config.port);
    }
});