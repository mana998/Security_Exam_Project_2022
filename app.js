const express = require("express");
const app = express();
const session = require("express-session");
const fs = require('fs');
const fetch = require("node-fetch");
const helmet = require("helmet");

//get the connection to db so yuo can run queries, connection defined in folder database file connection.js
const db = require("./database/connection").connection; 

//setup sockets
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], 
                scriptSrc: ["'self'", "'unsafe-inline'",  'https://ajax.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://maxcdn.bootstrapcdn.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://maxcdn.bootstrapcdn.com'],
                imgSrc: ["'self'", "'unsafe-inline'", 'http://www.w3.org', 'data:'],
                connectSrc: ["'self'"],
                objectSrc: [],
                mediaSrc: [],
                frameSrc: ["'self'"],
            },
        }
    })
);

//1 sec from backend send date to all clients, client console log

app.use(session({
    secret: 'keyboard cat', //will see later
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use(express.json());
//allow to pass form data
app.use(express.urlencoded({ extended: true}));
app.use(express.static(__dirname + '/public'));

const recipesRouter = require("./routes/recipes.js");
const usersRouter = require("./routes/users.js");
const sessionRouter = require("./routes/session.js");
const ingredientsRouter = require("./routes/ingredients.js");
const measurementsRouter = require("./routes/measurements.js");
const commentsRouter = require("./routes/comments.js");

app.use(recipesRouter.router);
app.use(usersRouter.router);
app.use(sessionRouter.router);
app.use(ingredientsRouter.router);
app.use(measurementsRouter.router);
app.use(commentsRouter.router);


const header = fs.readFileSync(__dirname + '/public/header/header.html', 'utf8');
const recipes = fs.readFileSync(__dirname + '/public/recipes/recipes.html', 'utf8');
const chat = fs.readFileSync(__dirname + '/public/chat/chat.html', 'utf8');
const recipe = fs.readFileSync(__dirname + '/public/recipe/recipe.html', 'utf8');
const footer = fs.readFileSync(__dirname + '/public/footer/footer.html', 'utf8');
const homepage = fs.readFileSync(__dirname + '/public/homepage/homepage.html', 'utf8');
const myAccount = fs.readFileSync(__dirname + '/public/myAccount/myAccount.html', 'utf8');
const fridge = fs.readFileSync(__dirname + '/public/fridge/fridge.html', 'utf8');

app.get("/recipes", (req, res) => {
    res.status(200).send(header + chat + recipes + footer);
});

app.get("/recipes/:recipe_name", (req, res) => {
    res.status(200).send(header + chat + recipe + footer);
});

app.get("/", (req, res) => {
    res.status(200).send(header + chat + homepage + footer);
});

app.get("/myAccount/:user_id", (req, res) => {
    if (req.params.user_id) {
        res.status(200).send(header + chat + myAccount +footer);
    } else {
        res.status(200).send(header + chat + homepage + footer);
    }
});

app.get("/fridge", (req, res) => {
    res.status(200).send(header + chat + fridge + footer);
});

//store active sockets
//const sockets = {};

//chat management
io.on('connection', (socket) => { 

    socket.on("client send message", (data) => {
        //send to everyone but sender
        //will receive depending on passed id
        socket.broadcast.emit(`server send message ${data.to}`, {to: data.to, from: data.from, message: data.message});
    })

    socket.on("online users change", (data) => {
        //send to all
        io.emit("user list update", {message: "update"});
    })

    socket.on("user connected", (data) => {
        //store user id assigned to socket
        //sockets[socket.id] = data.id;
    })

    setInterval(() => {
        io.emit("date", {date: new Date()})
    }, 1000);

    /*socket.on("disconnect", () => {
        disconnect(socket);
        io.emit("user list update", {message: "update"});
    })*/
});

/*async function disconnect(socket) {
    if (sockets[socket.id]) {
        //let fullURL =  req.protocol + '://' + req.get('host') + req.originalUrl;
        let fetchString = `http://localhost:8080/api/logout/${sockets[socket.id]}`;
        let response = await fetch(fetchString);
        let result = await response.json();
        sockets[socket.id].delete;
    }
}*/

server.listen(process.env.PORT || 8080, (error) => {

    if (error) {
        console.log(error);
    }
    console.log("Server is running on port", server.address().port);
});