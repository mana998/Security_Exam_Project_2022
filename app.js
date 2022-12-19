require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const helmet = require("helmet");
const requireAuth = require("./middleware/requireAuthorization");

// CSRF Protection
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const bodyParser = require("body-parser");

// setup route middleware
const csrfProtectionMiddleware = csrf({ cookie: true });
// A new body object containing the parsed data is populated on the request object
// after the middleware (i.e. req.body). This object will contain key-value pairs,
// where the value can be a string or array (when extended is false)
const parseFormMiddleware = bodyParser.urlencoded({ extended: false });

// create express server
const app = express();
// app.set('view engine', 'ejs');
const server = require("http").createServer(app);

// mitigate cross-site scripting attacks
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://ajax.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://maxcdn.bootstrapcdn.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://maxcdn.bootstrapcdn.com",
        ],
        imgSrc: ["'self'", "'unsafe-inline'", "http://www.w3.org", "data:"],
        connectSrc: ["'self'"],
        objectSrc: [],
        mediaSrc: [],
        frameSrc: ["'self'"],
      },
    },
  })
);

// change the name of the session cookie,
// so the attacker doesn't know the technologies of the app
// (by default, it is connect.sid which is standard for node apps)
app.use(
  session({
    name: "SESS_ID",
    secret: process.env.COOKIE_SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      httpOnly: true,
    },
  })
);
app.use(express.json());

//allow to pass form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// mount routes before csrf is appended to the app stack
const recipesRouter = require("./routes/recipes.js");
const usersRouter = require("./routes/users.js");
const sessionRouter = require("./routes/session.js");
const ingredientsRouter = require("./routes/ingredients.js");
const measurementsRouter = require("./routes/measurements.js");
const commentsRouter = require("./routes/comments.js");
const authenticationRouter = require("./routes/authentication.js");

// order is important
app.use(parseFormMiddleware);
app.use(cookieParser());

app.use(authenticationRouter.router);

app.use(csrfProtectionMiddleware);

// app.use(requireAuth); // VERY IMPORTANT WHERE IT'S PLACED // we can't rly use it like this in this case, we need more specific usages
app.use(recipesRouter.router);
app.use(usersRouter.router);
app.use(sessionRouter.router);
app.use(ingredientsRouter.router);
app.use(measurementsRouter.router);
app.use(commentsRouter.router);

// Prerequisite for every http request (cookie setup to prevent CSRF)
app.all("*", (req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

const header = fs.readFileSync(
  __dirname + "/public/header/header.html",
  "utf8"
);
const recipes = fs.readFileSync(
  __dirname + "/public/recipes/recipes.html",
  "utf8"
);
const recipe = fs.readFileSync(
  __dirname + "/public/recipe/recipe.html",
  "utf8"
);
const footer = fs.readFileSync(
  __dirname + "/public/footer/footer.html",
  "utf8"
);
const homepage = fs.readFileSync(
  __dirname + "/public/homepage/homepage.html",
  "utf8"
);
const myAccount = fs.readFileSync(
  __dirname + "/public/myAccount/myAccount.html",
  "utf8"
);
const fridge = fs.readFileSync(
  __dirname + "/public/fridge/fridge.html",
  "utf8"
);

app.get("/test", (req, res) => {
  // console.log(req);
  res.status(200).send({ csrfToken: req.csrfToken() });
});

app.post("/test", parseFormMiddleware, (req, res) => {
  res.status(200).send({ message: "success post" });
});

app.get("/recipes", (req, res) => {
  res.status(200).send(header + recipes + footer);
});

app.get("/recipes/:recipe_name", (req, res) => {
  res.status(200).send(header + recipe + footer);
});

app.get("/", (req, res) => {
  res.status(200).send(header + homepage + footer);
});

app.get("/myAccount/:user_id", requireAuth, (req, res) => {
  if (req.params.user_id) {
    res.status(200).send(header + myAccount + footer);
  } else {
    res.status(200).send(header + homepage + footer);
  }
});

app.get("/fridge", (req, res) => {
  res.status(200).send(header + fridge + footer);
});

server.listen(process.env.PORT || 8080, (error) => {
  if (error) {
    console.log(error);
  }
  console.log("Server is running on port", server.address().port);
});
