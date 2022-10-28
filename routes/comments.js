const router = require("express").Router();
const db = require("./../database/connection").connection; 
const bcrypt = require("bcrypt");
const Comment = require("./../models/Comment").Comment;

router.get("/api/comments/:recipe_id", (req, res) => {
    
    let id = req.params["recipe_id"];
    let query = 'SELECT comment_id, user.user_id, username, comment, timestamp FROM comment INNER JOIN user ON user.user_id = comment.user_id WHERE recipe_id = ?;'
    db.query(query, [id], (error, result, fields) => {
        if (result && result.length) {
            const comments = [];
            for (const comment of result) {
                comments.push(new Comment(comment.comment_id, comment.user_id, comment.username, comment.comment, comment.timestamp));
            }
            res.send({comments});
        } else {
            res.status(200).send({
                message: "No comments found"
            });
        }
    });
})

router.post("/api/comments", (req, res) => {
    
    db.query('INSERT INTO comment (recipe_id, user_id, comment) VALUES (?, ?, ?);',[req.body.recipe_id, req.body.user_id, req.body.comment], (error, result, fields) => {
        if (result && result.affectedRows === 1) {
            res.status(201).send({
                message: "User added."
            });
        } else {
            res.status(500).send({
                message: "Something went wrong. Try again."
            });
        }
    });
})

router.patch("/api/comments/:comment_id", (req, res) => {
    
    let id = req.params["comment_id"];
    db.query('UPDATE comment SET comment = ? WHERE comment_id = ?;',[req.body.comment, id], (error, result, fields) => {
        if (result.affectedRows === 1) {
            res.status(201).send({
                message: "Comment updated."
            });
        } else {
            res.status(500).send({
                message: "Something went wrong. Try again."
            });
        }
    });
})

router.delete("/api/comments/:comment_id", (req, res) => {
    
    let id = req.params["comment_id"];
    db.query('DELETE FROM comment WHERE comment_id = ?;',[id], (error, result, fields) => {
        if (result && result.affectedRows === 1) {
            res.status(201).send({
                message: "Comment deleted."
            });
        } else {
            res.status(500).send({
                message: "Something went wrong. Try again."
            });
        }
    });
})

module.exports = {
    router: router
}
