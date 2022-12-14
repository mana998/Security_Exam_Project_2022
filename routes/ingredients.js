const router = require("express").Router();
const Ingredient = require("./../models/Ingredient").Ingredient;
const multer = require("multer");
const sanitize = require("./sanitize.js");
const { getConnection, disconnect } = require("../database/connection");
const requireAuth = require("../middleware/requireAuthorization");

router.get("/api/ingredients", (req, res) => {
  let db = getConnection();

  //get ingredients from db
  db.query(
    "SELECT * FROM ingredient INNER JOIN measurement ON ingredient.measurement_id = measurement.measurement_id ORDER BY ingredient_name ASC;",
    (error, result, fields) => {
      if (result.length !== 0) {
        //write recipe to object
        const ingredients = [];
        for (let ingredient of result) {
          ingredient = sanitize(ingredient);
          ingredients.push(
            new Ingredient(
              ingredient.ingredient_id,
              ingredient.ingredient_name,
              ingredient.measurement_name
            )
          );
        }
        res.status(200).send({
          ingredients: ingredients,
        });
      } else {
        res.status(200).send({
          message: "There are no ingredients.",
        });
      }
    }
  );
  disconnect(db)
});

const parseMulter = multer();

router.post("/api/ingredients", requireAuth, parseMulter.none(), (req, res) => {
  let db = getConnection(req.user.role);
  let exists = 0;
  db.query("SELECT * FROM ingredient;", (error, result, fields) => {
    if (result.length != 0) {
      for (let ingredient of result) {
        if (ingredient.ingredient_name === req.body.ingredient_name) {
          exists = 1;
          res.status(409).send({
            message: "Ingredient already exists.",
          });
          break;
        }
      }
      if (!exists) {
        db.query(
          "INSERT INTO ingredient (ingredient_name, measurement_id) VALUES (?,?);",
          [req.body.ingredient_name, req.body.measure_id],
          (error, result, fields) => {
            if (error) {
              throw error;
            } else {
              if (result.affectedRows === 0) {
                res.status(500).send({
                  message: "Something went wrong. Try again.",
                });
                return;
              } else {
                res.status(201).send({ message: "Ingredient added." });
              }
            }
          }
        );
      }
    }
  });
  disconnect(db);
});

module.exports = {
  router: router,
};
