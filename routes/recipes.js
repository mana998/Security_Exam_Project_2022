const router = require("express").Router();
const Recipe = require("./../models/Recipe").Recipe;
const Ingredient = require("./../models/Ingredient").Ingredient;
const multer = require("multer");
const path = require("path");
const replaceRegex = /[^A-Za-z0-9\.]/g;
const sanitize = require("./sanitize.js");
const { getConnection, disconnect } = require("../database/connection");
const requireAuth = require("../middleware/requireAuthorization");

//Code neccessary for uploading the images. multer, path def at the top of the page!
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //cb = collback function
    cb(null, "./public/global/images"); //first arg is error, second destination
  },
  filename: (req, file, cb) => {
    if (file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg") {
      let err = new Error();
      err.code = "filetype";
      return cb(err);
    } else {
      //   req = sanitize(req);
      let recipe_image =
        req.body.recipe_name.toLowerCase().split(" ").join("_") + ".jpg";
      recipe_image = recipe_image.replaceAll(replaceRegex, "");
      cb(null, recipe_image);
    }
  },
});

const upload = multer({
  storage: storage, //holds the destnation and filename
  limits: { fileSize: 5000000 }, //def allowed file size
}).single("image-recipe");

router.get("/api/recipes", (req, res) => {
  let db = getConnection();
  let page = req.query.page || 1;
  let size = req.query.size || 1000;

  //add filtering
  let filter = req.query.filter || "likes";
  let direction = req.query.direction || "desc";
  //needs to be in there as else it is putting it into quotes
  let query;
  console.log(req.cookies);
  if (req?.cookies?.auth?.role === 'admin') {
    console.log('admin');
    query = `SELECT recipe_id, recipe_name, recipe_img, likes, is_private FROM recipe ORDER BY ${filter} ${direction} LIMIT ? OFFSET ?;`;
    values = [Number(size), Number((page - 1) * size)];
  } else if (req?.cookies?.auth?.role === 'user') {
    console.log('else');
    query = `SELECT recipe_id, recipe_name, recipe_img, likes, is_private FROM recipe WHERE (is_private = 0 OR recipe.user_id = ?) ORDER BY ${filter} ${direction} LIMIT ? OFFSET ?;`;
    values = [req.cookies.auth.user_id, Number(size), Number((page - 1) * size)];
  } else {
    console.log("logged out")
    query = `SELECT recipe_id, recipe_name, recipe_img, likes, is_private FROM recipe WHERE (is_private = 0) ORDER BY ${filter} ${direction} LIMIT ? OFFSET ?;`;
    values = [Number(size), Number((page - 1) * size)];
  }
  db.query(query, values, (error, result, fields) => {
    if (result && result.length) {
      //write recipe to object
      const recipes = [];
      for (let recipe of result) {
        recipe = sanitize(recipe);
        recipes.push(
          new Recipe(
            recipe.recipe_id,
            recipe.recipe_name,
            "",
            "",
            recipe.recipe_img,
            recipe.likes,
            recipe.is_private
          )
        );
      }
      res.status(200).send({ recipes });
    } else {
      res.status(200).send({
        message: "No recipes found",
      });
    }
  });
  disconnect(db);
});

router.get("/api/recipes/user/:user_id", requireAuth, async (req, res) => {
  let db = getConnection(req.user.role);
  
  //add filtering
  console.log(req.user);

  let filter = req.query.filter;
  let user_id = req.params["user_id"];
  let query = "";
  let values = "";

  if (filter == "") {
    query =
      "SELECT recipe_id, recipe_name,recipe.recipe_desc, recipe_img, recipe.likes, recipe.is_private FROM recipe WHERE recipe.user_id = ? ;";
    values = [user_id];
  } else if (filter == "favorite") {
    //or add admin role
    const userRole = await getUserRole(user_id);
    if (userRole === 'admin') {
      query = "SELECT recipe.recipe_id, recipe.recipe_name,recipe.recipe_desc, recipe.recipe_img, recipe.likes, recipe.is_private FROM recipe INNER JOIN favorite ON recipe.recipe_id = favorite.recipe_id WHERE favorite.user_id = ?;";
      values = [user_id];
    } else {
      query = "SELECT recipe.recipe_id, recipe.recipe_name,recipe.recipe_desc, recipe.recipe_img, recipe.likes, recipe.is_private FROM recipe INNER JOIN favorite ON recipe.recipe_id = favorite.recipe_id  WHERE favorite.user_id = ? AND (recipe.is_private=0 OR recipe.user_id = ?);";
      values = [user_id, user_id];
    }
  } else {
    res.status(200).send({
      message: "No recipes found",
    });
  }

  db.query(query, values, (error, result, fields) => {
    if (result && result.length) {
      //write recipe to object
      const recipes = [];
      for (let recipe of result) {
        recipe = sanitize(recipe);
        recipes.push(
          new Recipe(
            recipe.recipe_id,
            recipe.recipe_name,
            recipe.recipe_desc,
            "",
            recipe.recipe_img,
            recipe.likes,
            recipe.is_private
          )
        );
      }
      res.status(200).send({ recipes });
    } else {
      res.status(200).send({
        message: "No recipes found",
      });
    }
  });
  disconnect(db);
});

router.get("/api/recipes/user/:user_id/favorite/:recipe_id", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  
  //add filtering
  let user_id = req.params["user_id"];
  let recipe_id = req.params["recipe_id"];
  let query = "";
  let values = "";
  if (req.user.role === 'admin') {
    query = "SELECT favorite.recipe_id, favorite.user_id, is_private FROM favorite JOIN recipe ON favorite.recipe_id = recipe.recipe_id WHERE favorite.user_id = ? AND favorite.recipe_id = ?;";
  } else {
    query = "SELECT favorite.recipe_id, favorite.user_id, is_private FROM favorite JOIN recipe ON favorite.recipe_id = recipe.recipe_id  WHERE favorite.user_id = ? AND favorite.recipe_id = ? AND (is_private=0 OR favorite.user_id = ? );";
  }
  values = [user_id, recipe_id, user_id];

    db.query(query, values, (error, result, fields) => {
      if (result && result.length) {
        res.status(200).send({
          includes: true,
        });
      } else {
        res.status(200).send({
          message: "No recipes found",
        });
      }
    });
  disconnect(db);
});

router.get("/api/recipes/ingredients", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  let values = [];
  /*`SELECT recipe.recipe_id, recipe_name, recipe_img, likes, ingredient_has_recipe.ingredient_id  FROM recipe 
	INNER JOIN ingredient_has_recipe 
	ON recipe.recipe_id = ingredient_has_recipe.recipe_id
	WHERE ingredient_id = ?
	GROUP BY recipe_id
    ) AS t0 `;*/
  let query = `SELECT recipe.recipe_id, recipe_name, recipe_img, likes, ingredient_has_recipe.ingredient_id  FROM recipe INNER JOIN ingredient_has_recipe ON recipe.recipe_id = ingredient_has_recipe.recipe_id WHERE ingredient_id = ? GROUP BY recipe_id) AS t0 `;
  if (req.query.ingredients && typeof req.query.ingredients !== "string") {
    values = [...req.query.ingredients];
    req.query.ingredients.map((id, index) => {
      if (index !== 0) {
        query = `SELECT t${
          index - 1
        }.recipe_id, recipe_name, recipe_img, likes FROM ( ${query}`;
        /* `INNER JOIN ingredient_has_recipe
                ON t${index - 1}.recipe_id = ingredient_has_recipe.recipe_id
                WHERE ingredient_has_recipe.ingredient_id = ?
                GROUP BY recipe_id) AS t${index} `;*/
        query += `INNER JOIN ingredient_has_recipe ON t${
          index - 1
        }.recipe_id = ingredient_has_recipe.recipe_id WHERE ingredient_has_recipe.ingredient_id = ? GROUP BY recipe_id) AS t${index} `;
      }
    });
  } else {
    values.push(req.query.ingredients);
  }
  let regex = /^\(?(.*)/;
  query = query.replace(regex, "$1");
  regex = /^(.+?)(\) AS t(\d)+ )?$/;
  query = query.replace(regex, "$1;");
  //let regex = /^\(*+(.+?)(\) AS t(\d)+ )?$/;
  //query = query.replace(regex, '$1;')
  db.query(query, values, (error, result, fields) => {
    if (result && result.length) {
      //write recipe to object
      const recipes = [];
      for (let recipe of result) {
        recipe = sanitize(recipe);
        recipes.push(
          new Recipe(
            recipe.recipe_id,
            recipe.recipe_name,
            "",
            "",
            recipe.recipe_img,
            recipe.likes
          )
        );
      }
      res.status(200).send({ recipes });
    } else {
      res.status(200).send({
        message: "No recipes found",
      });
    }
  });
  disconnect(db);
});

//no user id so need to check where is this used
router.post("/api/recipes/:recipe_name", (req, res) => {
  let db = getConnection();
  //get recipe from db
  let query;
  let values;
  const userRole = getUserRole(req.body.user_id);
  console.log("role", userRole);
  if (userRole === 'admin') {
    query = "SELECT * FROM recipe INNER JOIN ingredient_has_recipe ON recipe.recipe_id = ingredient_has_recipe.recipe_id INNER JOIN ingredient ON ingredient_has_recipe.ingredient_id = ingredient.ingredient_id INNER JOIN measurement ON ingredient.measurement_id = measurement.measurement_id WHERE recipe.recipe_name=?;";
    values = [req.params.recipe_name]
  } else {
    query = "SELECT * FROM recipe INNER JOIN ingredient_has_recipe ON recipe.recipe_id = ingredient_has_recipe.recipe_id INNER JOIN ingredient ON ingredient_has_recipe.ingredient_id = ingredient.ingredient_id INNER JOIN measurement ON ingredient.measurement_id = measurement.measurement_id WHERE recipe.recipe_name=? AND (recipe.is_private=0 OR recipe.user_id = ?);";
    values = [req.params.recipe_name, req.body.user_id]
  }
  db.query(
    query, values,
    (error, result, fields) => {
      if (result && result.length !== 0) {
        //write recipe to object
        const ingredients = [];
        for (let ingredient of result) {
          ingredient = sanitize(ingredient);
          ingredients.push(
            new Ingredient(
              ingredient.ingredient_id,
              ingredient.ingredient_name,
              ingredient.measurement_name,
              ingredient.amount
            )
          );
        }
        result[0] = sanitize(result[0]);
        const recipe = new Recipe(
          result[0].recipe_id,
          result[0].recipe_name,
          result[0].recipe_desc,
          result[0].user_id,
          result[0].recipe_img,
          result[0].likes,
          result[0].is_private
        );
        res.status(200).send({
          recipe: recipe,
          ingredients: ingredients,
        });
      } else {
        res.status(200).send({
          message: "This recipe does not exists.",
        });
      }
    }
  );
  disconnect(db);
});

router.post("/api/recipes", requireAuth, (req, res) => {
  console.log("here");
  upload(req, res, (err) => {
    let db = getConnection(req.user.role);
    // req = sanitize(req, res);
    if (err) {
      console.log("err", err);
      res.status(400).send({
        message:
          "Make sure that your image is .jpg or .jpeg and has max. 5MB size.",
      });
      return;
    } else {
      if (req.file === undefined) {
        res.status(400).send({
          message: "No image selected.",
        });
        return;
      }
    }
    console.log("db 286", db);
    //insert into recipe table
    let recipe_img = req.body.recipe_name.toLowerCase().split(" ").join("_");
    recipe_img = recipe_img.replaceAll(replaceRegex, "");
    db.query(
      "INSERT INTO recipe (recipe_name, recipe_desc, user_id, recipe_img, is_private) VALUES (?, ?, ?, ?, ?);",
      [
        req.body.recipe_name,
        req.body.recipe_description,
        req.body.user_id,
        recipe_img,
        req.body.privacy,
      ],
      (error, result, fields) => {
        if (error) {
          throw error;
        } else {
          const recipe_id = result.insertId;
          if (recipe_id) {
            let formObjectIngredients = req.body.ingredients;
            let ingredients = [];
            for (key in formObjectIngredients) {
              ingredients.push(formObjectIngredients[key]);
            }
            if (ingredients.length !== 0) {
              for (let i in ingredients) {
                db.query(
                  "INSERT INTO ingredient_has_recipe VALUES (?,?,?);",
                  [ingredients[i].id, recipe_id, ingredients[i].amount],
                  (error, result, fields) => {
                    if (error) {
                      throw error;
                    } else {
                      if (result.affectedRows === 0) {
                        res.status(500).send({
                          message: "Something went wrong. Try again.",
                        });
                        return;
                      }
                    }
                  }
                );
              }
            }
          }
        }
      }
    );
    res.status(201).send({
      message: "Success!",
    });
    disconnect(db);
  });
});

//adding to favorites
router.post("/api/recipes/favorites/modify", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  const recipe_id = req.body.recipe_id;
  const user_id = req.body.user_id;
  db.query(
    "INSERT INTO favorite VALUES (?,?)",
    [recipe_id, user_id],
    (error, result, fields) => {
      if (!error && result && result.affectedRows === 1) {
        res.status(201).send({
          message: "Like added.",
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

router.put("/api/recipes", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  upload(req, res, (err) => {
    // req = sanitize(req, res);
    let recipe_img = req.body.recipe_name.toLowerCase().split(" ").join("_");
    recipe_img = recipe_img.replaceAll(replaceRegex, "");
    if (err) {
      res.status(400).send({
        message:
          "Make sure that your image is .jpg or .jpeg and has max. 1MB size.",
      });
      return;
    } else {
      if (req.file === undefined) {
        res.status(400).send({
          message: "No image selected.",
        });
        return;
      }
    }
    //deletes unused images
    db.query(
      "SELECT recipe_img from recipe WHERE recipe.recipe_id = ?",
      [req.body.recipe_id],
      (error, result, fields) => {
        if (error) {
          throw error;
        } else {
          if (result[0].recipe_img != recipe_img) {
            const fs = require("fs");
            result[0] = sanitize(result[0]);
            const path = `./public/global/images/${result[0].recipe_img}.jpg`;
            fs.unlink(path, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          }
        }
      }
    );

    //update  recipe table
    db.query(
      "UPDATE recipe SET recipe_name = ?, recipe_desc = ?, recipe_img = ?, is_private = ? WHERE recipe.recipe_id = ?;",
      [
        req.body.recipe_name,
        req.body.recipe_description,
        recipe_img,
        req.body.recipe_id,
        req.body.privacy,
      ],
      (error, result, fields) => {
        if (error) {
          throw error;
        } else {
          if (result.affectedRows === 0) {
            res.status(500).send({
              message: "Something went wrong with updating. Try again.",
            });
            return;
          }
        }
      }
    );

    //delete previous ingredients
    db.query(
      "DELETE FROM ingredient_has_recipe WHERE ingredient_has_recipe.recipe_id = ?;",
      [req.body.recipe_id],
      (error, result, fields) => {
        if (error) {
          throw error;
        } else if (result.affectedRows === 0) {
          res.status(500).send({
            message:
              "Something went wrong with updating ingredients. Try again.",
          });
          return;
        }
      }
    );

    //chceck if recipe has ingredients:
    let formObjectIngredients = req.body.ingredients;
    let ingredients = [];
    for (key in formObjectIngredients) {
      let duplicate = 0;
      ingredients.forEach((i) => {
        if (i.id === formObjectIngredients[key].id) {
          i.amount =
            Number(i.amount) + Number(formObjectIngredients[key].amount);
          duplicate = 1;
        }
      });
      if (!duplicate) {
        ingredients.push(formObjectIngredients[key]);
      }
    }

    if (ingredients.length !== 0) {
      //add new ingredients
      for (let i in ingredients) {
        db.query(
          "INSERT INTO ingredient_has_recipe VALUES (?,?,?);",
          [ingredients[i].id, req.body.recipe_id, ingredients[i].amount],
          (error, result, fields) => {
            if (error) {
              throw error;
            } else if (result.affectedRows === 0) {
              res.status(500).send({
                message:
                  "Something went wrong with updating ingredients. Try again.",
              });
              return;
            }
          }
        );
      }
    }

    res.status(200).send({
      message: "Success!",
    });
  });
  disconnect(db)
});

//delete from favorite
router.delete("/api/recipes/favorites/modify", requireAuth, (req, res) => {
  let db = getConnection(req.user.role);
  const recipe_id = req.body.recipe_id;
  const user_id = req.body.user_id;
  db.query(
    "DELETE FROM favorite WHERE favorite.recipe_id = ? AND favorite.user_id = ?",
    [recipe_id, user_id],
    (error, result, fields) => {
      if (!error && result && result.affectedRows === 1) {
        res.status(200).send({
          message: "Like deleted.",
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

async function getUserRole(userId) {
  role = 'guest';
  if (userId) {
    let db = await getConnection();
    console.log(db);
    db.query(
      "SELECT role FROM role JOIN user ON user.role_id = role.role_id WHERE user.user_id = ?",
      [userId],
      (error, result, fields) => {
        if (!error && result && result.length === 1) {
          role = result[0];
        }
    });
    disconnect(db);
  }
  return role;
}

module.exports = {
  router: router,
};
