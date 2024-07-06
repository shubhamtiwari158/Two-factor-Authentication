if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const bcrypt = require('bcrypt');
const dbUrl = process.env.ATLASDB_URL;

const userRoute = require("./routes/user.js");
const { errorMonitor } = require("events");

main()
  .then(() => {
    console.log("Connection Successfull");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto:{
    secret: process.env.SECRET,
  },
  touchAfter: 24* 3600
});

store.on("error", ()=>{
  console.log("Error in Mongo Session Store", error);
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());


// Configure Passport local strategy for authenticating users
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    // console.log(user);

    if (!user) {
      return done(null, false, { message: 'Invalid email, Please enter a valid email address' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return done(null, false, { message: 'Incorrect password' });
    }

    // Authentication successful
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

app.use((req, res, next) => { 
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});


passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

//Home Page
app.get("/api/home", (req, res) => {
  res.render("API/home.ejs");
});

//User route
app.use("/api/user", userRoute);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "PAGE NOT FOUND"));
});

//Error handling midddleware
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { err });
});

app.listen(3000, () => {
  console.log("Server listening on port 8080");
});
