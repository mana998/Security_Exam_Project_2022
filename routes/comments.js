const router = require("express").Router();
const bcrypt = require("bcrypt");
const Comment = require("./../models/Comment").Comment;
const requireAuth = require("../middleware/requireAuthorization");
const { getConnection, disconnect } = require("../database/connection");
const sanitize = require("./sanitize.js");

router.get("/api/comments/:recipe_id", (req, res) => {
  let db = getConnection();
  let id = req.params["recipe_id"];
  let query =
    "SELECT comment_id, user.user_id, username, comment, timestamp FROM comment INNER JOIN user ON user.user_id = comment.user_id WHERE recipe_id = ?;";
  db.query(query, [id], (error, result, fields) => {
    if (result && result.length) {
      const comments = [];
      for (let comment of result) {
        comment = sanitize(comment);
        comments.push(
          new Comment(
            comment.comment_id,
            comment.user_id,
            comment.username,
            comment.comment,
            comment.timestamp
          )
        );
      }
      res.send({ comments });
    } else {
      res.status(200).send({
        message: "No comments found",
      });
    }
  });
  disconnect(db);
});

router.post("/api/comments", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  db.query(
    "INSERT INTO comment (recipe_id, user_id, comment) VALUES (?, ?, ?);",
    [req.body.recipe_id, req.body.user_id, req.body.comment],
    (error, result, fields) => {
      if (result && result.affectedRows === 1) {
        res.status(201).send({
          message: "User added.",
        });
      } else {
        res.status(500).send({
          message: "Something went wrong. Try again.",
        });
      }
    }
  );
  disconnect(db);
});

router.patch("/api/comments/:comment_id", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  let id = req.params["comment_id"];
  db.query(
    "UPDATE comment SET comment = ? WHERE comment_id = ?;",
    [req.body.comment, id],
    (error, result, fields) => {
      if (result.affectedRows === 1) {
        res.status(201).send({
          message: "Comment updated.",
        });
      } else {
        res.status(500).send({
          message: "Something went wrong. Try again.",
        });
      }
    }
  );
  disconnect(db);
});

router.delete("/api/comments/:comment_id", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  let id = req.params["comment_id"];
  db.query(
    "DELETE FROM comment WHERE comment_id = ?;",
    [id],
    (error, result, fields) => {
      if (result && result.affectedRows === 1) {
        res.status(201).send({
          message: "Comment deleted.",
        });
      } else {
        res.status(500).send({
          message: "Something went wrong. Try again.",
        });
      }
    }
  );
  disconnect(db);
});

module.exports = {
  router: router,
};
