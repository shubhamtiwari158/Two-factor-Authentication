const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { isLoggedIn } = require("../utils/middleware.js");
const { saveRedirectUrl } = require("../utils/middleware.js");
const bcrypt = require("bcrypt");
const validator = require("validator");
const validatePassword = require('../utils/validatePassword.js');

//Register User
router.get("/register", (req, res) => {
  res.render("API/register.ejs");
});

router.post(
  "/register",
  validatePassword,  
  wrapAsync(async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!validator.isEmail(email)) {
        req.flash(
          "error",
          "Invalid Email ! Please Enter a valid email address"
        );
        res.redirect("/api/user/register");
      }

      // Extract domain name
      const domain = email.split("@")[1];

      // Check if domain is allowed
      const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "aol.com", "protonmail.com", "zoho.com", "mail.com" ]; // Add your allowed domains here
      if (!allowedDomains.includes(domain)) {
        throw new ExpressError(
          403,
          'Incorrect Domain name'
        );
      }
      // console.log(username);
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      const secret = speakeasy.generateSecret();

      let newUser = new User({
        username: username,
        email: email,
        password: hashedPassword,
        salt: salt,
        secret: secret,
      });

      let checkUser = await User.findOne({ email: newUser.email });
      if (checkUser) {
        throw new ExpressError(
          403,
          `User with the given email already exist. Please enter another email ID.`
        );
      }
      let registerdUser = await newUser.save();
      console.log(registerdUser);
      req.flash("success", "User registered successfully");
      res.redirect("/api/user/login");
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/api/user/register");
    }
  })
);

//Login User
router.get("/login", (req, res) => {
  res.render("API/login.ejs");
});

router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/api/user/login",
    failureFlash: true,
  }),

  wrapAsync(async (req, res) => {
    let { email: login_email, password: login_password } = req.body;
    let user = await User.findOne({ email: login_email });
    console.log(user);
    req.user = user;
    if (user.OTPEnabled) {
      req.flash(
        "success",
        "Welcome to SecurifyJS!  Please enter the authentication code"
      );
      res.redirect("/api/user/validateUser");
    } else {
      req.flash("success", "Welcome to SecurifyJS!");
      res.redirect("/api/user/profile");
    }

    console.log("working");
  })
);

router.get("/profile", isLoggedIn, async (req, res) => {
  let user = req.user;
  console.log(user);
  res.render("API/userProfile.ejs", { user });
});

//Verify and Activate 2FA
router.post(
  "/generateOTP/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let newSecret = speakeasy.generateSecret();

    let updatedUser = await User.findByIdAndUpdate(
      id,
      { secret: newSecret },
      { new: true }
    );
    let secret = updatedUser.secret;

    QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
      // console.log(data_url);
      res.render("API/generateOTP.ejs", { user: updatedUser, data_url });
    });
  })
);

//Verify OTP
router.put(
  "/verifyOTP/:id",
  wrapAsync(async (req, res) => {
    let { token } = req.body;
    let { id } = req.params;
    let user = await User.findById(id);
    let secret = user.secret.base32;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (verified) {
      let updatedUser = await User.findByIdAndUpdate(
        id,
        { OTPEnabled: true },
        { new: true }
      );
      console.log(updatedUser);
      req.flash("success", "User Verfied!  Welcome to SecurifyJS");
      res.redirect("/api/user/login");
    } else {
      // throw new ExpressError(401, "");
      req.flash("error", "Invalid Verfication Code: User not Verfied");
      res.redirect("/api/user/profile");
    }
  })
);

router.get("/validateUser", async (req, res) => {
  let user = req.user;
  console.log(user);
  res.render("API/validateUser", { user });
});

//Validate User
router.post(
  "/validate/:id",
  wrapAsync(async (req, res) => {
    let { token } = req.body;
    let { id } = req.params;

    let user = await User.findById(id);
    let secret = user.secret.base32;

    // const displayTime = 5000; // Adjust this value to the desired time in milliseconds
    // setTimeout(() => {
    //     res.redirect('/api/home');
    // }, displayTime);

    const validate = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (validate) {
      req.flash("success", "User Validated!  Welcome to SecurifyJS");
      res.redirect("/api/user/profile");
    } else {
      req.flash(
        "error",
        " Error retrieving user!  Please enter a valid authentication code"
      );
      res.redirect("/api/user/validateUser");
    }

    // const displayTime = 5000; // Adjust this value to the desired time in milliseconds
    // setTimeout(() => {
    //     res.redirect('/api/home');
    // }, displayTime);
  })
);

//Disable User
router.put(
  "/disable/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let user = await User.findById(id);
    console.log(user);
    let updatedUser = await User.findByIdAndUpdate(
      id,
      { OTPEnabled: false },
      { new: true }
    );
    console.log(updatedUser);
    res.render("API/userProfile.ejs", { user: updatedUser });
  })
);

//Logout
router.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    // req.flash("success", "Logout Successfully");
    res.redirect("/api/home");
  });
});

module.exports = router;
