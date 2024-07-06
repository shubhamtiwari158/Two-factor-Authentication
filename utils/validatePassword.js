const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;

// Middleware function for password validation
function validatePassword(req, res, next) {
    const { password } = req.body;

    if (!passwordRegex.test(password)) {
        req.flash("error", "Password must be at least 8 characters long and include at least one number, one special character, and one letter.");
        // alert("user must be logged in")
        return res.redirect("./register");
    }

    // If password is valid, continue to the next middleware or route handler
    next();
}

module.exports = validatePassword;