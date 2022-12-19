const router = require("express").Router();
const db = require("./../database/connection").connection; 
const bcrypt = require("bcrypt");
const User = require("./../models/User").User;

const saltRounds = 15;

router.post("/api/users/login", (req, res) => {
    db.query('SELECT * FROM user WHERE username=?;',[req.body.username], (error, result, fields) => {
        if (result && result.length === 1) {
            bcrypt.compare(req.body.password, result[0].password, (error, match) => {
                if (match) {
                    res.status(200).send({
                        id: result[0].user_id
                    });
                } else {
                    res.status(401).send({
                        message: "Incorrect username or password. Try again."
                    });
                }
            })
        } else {
            res.status(401).send({
                message: "Incorrect username or password. Try again."
            });
        }
    });  
})


router.post("/api/users/register", (req, res) => {
    db.query('SELECT * FROM user WHERE username=?;',[req.body.username], (error, result, fields) => {
        if (result && result.length === 1) {
            res.status(409).send({
                message: "User with the same username already exists. Try again."
            });
        } else if (result.length === 0) {
            bcrypt.hash(req.body.password, saltRounds, (error, hash) => {
                if (!error) {
                    db.query('INSERT INTO user (username, password) VALUES (?, ?);',[req.body.username, hash], (error, result, fields) => {
                        if (result.affectedRows === 1) {
                            res.status(201).send({
                                message: "User added."
                            });
                        } else {
                            res.status(500).send({
                                message: "Something went wrong. Try again."
                            });
                        }
                    });
                } else {
                    res.status(500).send({
                        message: "Something went wrong. Try again."
                    });
                }
            });
        } else {
           res.status(500).send({
                message: "Something went wrong. Try again."
            });
        }
    });
})

router.patch("/api/users/login", (req, res) => {
    updateActive(req.body.id, 1, res);
})

router.patch("/api/users/logout", (req, res) => {
    updateActive(req.body.id, 0, res);
})

function updateActive(id, active, res) {
    db.query('UPDATE user SET active=? WHERE user_id=?;',[active, id], (error, result, fields) => {
        if (!result || result.changedRows > 1) {
            res.status(500).send({
                message: "Something went wrong. Try again."
            });
        } else {
            res.status(200).send({
                id: id
            });
        }
    }); 
}

module.exports = {
    router: router
}
