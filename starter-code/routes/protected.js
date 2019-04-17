const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

const authenticationCheck = (req, res, next) => {
    if (req.isAuthenticated()) next();
    else res.render("error", { errorMessage: "This is a protected route" });
};

const rolesCheck = role => {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            res.render("error", { errorMessage: "This is a protected route" });
        } else if (req.user.role !== role) {
            res.render("error", {
                errorMessage: "You do not have sufficient privileges",
            });
        } else {
            next();
        }
    };
};

router.get("/protected/secret", authenticationCheck, (req, res, next) => {
    res.render("protected/secret");
});

router.get("/protected/employees/new", rolesCheck("Boss"), (req, res, next) => {
    res.render("protected/employees/new");
});

router.get("/protected/employees", authenticationCheck, (req, res, next) => {
    User.find({})
        .then(users => {
            res.render("protected/employees", { users });
        })
        .catch(err => {
            console.error("error rendering users", err);
        });
});

router.post("/protected/employees/:id/delete", rolesCheck("Boss"), (req, res, next) => {
    User.findByIdAndRemove(req.params.id)
        .then(() => {
            res.redirect("/protected/employees");
        })
        .catch(err => {
            console.error("Error while deleting user", err);
        });
});

router.post("/protected/employees", rolesCheck("Boss"), (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    const salt = bcrypt.genSaltSync();
    const hashPassword = bcrypt.hashSync(password, salt);

    if (username === "" || password === "") {
        res.render("protected/employees/new", {
            errorMessage: "You need a username and a password to register",
        });
        return;
    }
    User.findOne({ username })
        .then(user => {
            if (user) {
                res.render("protected/employees/new", {
                    errorMessage: "There is already a registered user with this username",
                });
                return;
            }
            User.create({ username, password: hashPassword, role })
                .then(() => {
                    res.redirect("/protected/employees");
                })
                .catch(err => {
                    console.error("Error while registering new user", err);
                    next();
                });
        })
        .catch(err => {
            console.error("Error while looking for user", err);
        });
});

module.exports = router;
