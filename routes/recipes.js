const router = require("express").Router();
const db = require("./../database/connection").connection; 
const Recipe = require("./../models/Recipe").Recipe;
const Ingredient = require("./../models/Ingredient").Ingredient; 
const multer = require('multer');
const path = require('path');

//Code neccessary for uploading the images. multer, path def at the top of the page!
const storage = multer.diskStorage({
    destination: (req, file, cb) => { //cb = collback function
        cb(null, './public/global/images'); //first arg is error, second destination
    },
    filename: (req, file, cb) => {
        if (file.mimetype!=='image/jpg' && file.mimetype !=='image/jpeg') {
            let err = new Error();
            err.code = 'filetype';
            return cb(err);
        } else {
            cb(null, req.body.recipe_name.toLowerCase().split(" ").join("_") + '.jpg');
        }
    }
});

const upload = multer({
    storage: storage, //holds the destnation and filename
    limits: {fileSize: 5000000}, //def allowed file size   
}).single('image-recipe');   

router.get("/api/recipes", (req, res) => {
    let page = req.query.page || 1;
    let size = req.query.size || 1000;

    //add filtering
    let filter = req.query.filter || "likes";
    let direction = req.query.direction || "desc";

    //needs to be in there as else it is putting it into quotes
    let query = `SELECT recipe_id, recipe_name, recipe_img, likes FROM recipe ORDER BY ${filter} ${direction} LIMIT ? OFFSET ?;`;
    values = [Number(size), Number((page - 1) * size)];
    db.query(query, values, (error, result, fields) => {
        if (result && result.length) {

            //write recipe to object
            const recipes = [];
            for (const recipe of result) {
                recipes.push(new Recipe(recipe.recipe_id, recipe.recipe_name,'', '', recipe.recipe_img, recipe.likes));
            }
            res.status(200).send({recipes});
        } else {
            res.status(200).send({
                message: "No recipes found"
            });
        }
    });
})

router.get("/api/recipes/user/:user_id", (req, res) => {

    //add filtering
    let filter = req.query.filter;
    let user_id = req.params["user_id"];
    let query = "";
    let values= "";

    if (filter == "") {
        query = 'SELECT recipe_id, recipe_name,recipe.recipe_desc, recipe_img, recipe.likes FROM recipe WHERE recipe.user_id = ? ;';
        values = [user_id];
    } else if (filter == "favorite") {
        query = 'SELECT recipe.recipe_id, recipe.recipe_name,recipe.recipe_desc, recipe.recipe_img, recipe.likes FROM recipe INNER JOIN favorite ON recipe.recipe_id = favorite.recipe_id WHERE favorite.user_id = ?;';
        values = [user_id];
    } else {
        res.status(200).send({
            message: "No recipes found"
        });
    }
   
    db.query(query, values, (error, result, fields) => {
        if (result && result.length) {

            //write recipe to object
            const recipes = [];
            for (const recipe of result) {
                recipes.push(new Recipe(recipe.recipe_id, recipe.recipe_name,recipe.recipe_desc, '', recipe.recipe_img, recipe.likes));
            }
            res.status(200).send({recipes});
        } else {
            res.status(200).send({
                message: "No recipes found"
            });
        }
    });
})

router.get("/api/recipes/user/:user_id/favorite/:recipe_id", (req, res) => {

    //add filtering
    let user_id = req.params["user_id"];
    let recipe_id = req.params["recipe_id"];
    let query = "";
    let values= "";

    query = 'SELECT recipe_id, user_id FROM favorite WHERE user_id = ? AND recipe_id = ?;';
    values = [user_id, recipe_id];

    db.query(query, values, (error, result, fields) => {
        if (result && result.length) {

            res.status(200).send({
                includes: true
            });
        } else {
            res.status(200).send({
                message: "No recipes found"
            });
        }
    });
})

router.get("/api/recipes/ingredients", (req, res) => {
    let values = [];
    /*`SELECT recipe.recipe_id, recipe_name, recipe_img, likes, ingredient_has_recipe.ingredient_id  FROM recipe 
	INNER JOIN ingredient_has_recipe 
	ON recipe.recipe_id = ingredient_has_recipe.recipe_id
	WHERE ingredient_id = ?
	GROUP BY recipe_id
    ) AS t0 `;*/
    let query = `SELECT recipe.recipe_id, recipe_name, recipe_img, likes, ingredient_has_recipe.ingredient_id  FROM recipe INNER JOIN ingredient_has_recipe ON recipe.recipe_id = ingredient_has_recipe.recipe_id WHERE ingredient_id = ? GROUP BY recipe_id) AS t0 `;
    if (req.query.ingredients && typeof(req.query.ingredients) !== 'string') {
        values = [...req.query.ingredients];
        req.query.ingredients.map((id, index) => {
            if (index !== 0) {
                query = `SELECT t${index - 1}.recipe_id, recipe_name, recipe_img, likes FROM ( ${query}`;
                /* `INNER JOIN ingredient_has_recipe
                ON t${index - 1}.recipe_id = ingredient_has_recipe.recipe_id
                WHERE ingredient_has_recipe.ingredient_id = ?
                GROUP BY recipe_id) AS t${index} `;*/
                query += `INNER JOIN ingredient_has_recipe ON t${index - 1}.recipe_id = ingredient_has_recipe.recipe_id WHERE ingredient_has_recipe.ingredient_id = ? GROUP BY recipe_id) AS t${index} `;
            }
        })
    } else {
        values.push(req.query.ingredients);
    }
    let regex = /^\(?(.*)/;
    query = query.replace(regex, '$1');
    regex = /^(.+?)(\) AS t(\d)+ )?$/;
    query = query.replace(regex, '$1;');
    //let regex = /^\(*+(.+?)(\) AS t(\d)+ )?$/;
    //query = query.replace(regex, '$1;')
    db.query(query, values, (error, result, fields) => {
        if (result && result.length) {

            //write recipe to object
            const recipes = [];
            for (const recipe of result) {
                recipes.push(new Recipe(recipe.recipe_id, recipe.recipe_name,'', '', recipe.recipe_img, recipe.likes));
            }
            res.status(200).send({recipes});
        } else {
            res.status(200).send({
                message: "No recipes found"
            });
        }
    });
})



router.get("/api/recipes/:recipe_name", (req, res) => {

    //get recipe from db
    db.query('SELECT * FROM recipe INNER JOIN ingredient_has_recipe ON recipe.recipe_id = ingredient_has_recipe.recipe_id INNER JOIN ingredient ON ingredient_has_recipe.ingredient_id = ingredient.ingredient_id INNER JOIN measurement ON ingredient.measurement_id = measurement.measurement_id WHERE recipe.recipe_name=?;',[req.params.recipe_name],
    (error, result, fields) => {
        if (result.length !== 0){
        
            //write recipe to object
            const ingredients = [];
            for (const ingredient of result){
                ingredients.push(new Ingredient(ingredient.ingredient_id, ingredient.ingredient_name, ingredient.measurement_name, ingredient.amount));
            };
            const recipe = new Recipe(result[0].recipe_id, result[0].recipe_name, result[0].recipe_desc, result[0].user_id, result[0].recipe_img, result[0].likes );
            res.status(200).send({
                recipe: recipe,
                ingredients: ingredients
            });
        } else {
            res.status(200).send({
                message: "This recipe does not exists."
            });
        }
    }); 
})

router.post("/api/recipes", (req, res) => {
    upload(req, res, (err) => {

        if (err) {
            res.status(400).send({
                message: "Make sure that your image is .jpg or .jpeg and has max. 5MB size."
            });
            return;
        } else {
            if (req.file === undefined) {
                res.status(400).send({
                    message: "No image selected."
                });
                return;               
            } 
        }

        //insert into recipe table
        const recipe_img = req.body.recipe_name.toLowerCase().split(" ").join("_");
        db.query("INSERT INTO recipe (recipe_name, recipe_desc, user_id, recipe_img) VALUES (?, ?, ?, ?);",[req.body.recipe_name, req.body.recipe_description, req.body.user_id, recipe_img], (error, result, fields) => {
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
                    if (ingredients.length !==0) {
                        for (let i in ingredients) {
                            db.query("INSERT INTO ingredient_has_recipe VALUES (?,?,?);",[ingredients[i].id, recipe_id,ingredients[i].amount], (error, result, fields) => {
                                if (error) {
                                    throw error;
                                } else {
                                    if (result.affectedRows === 0) {
                                        res.status(500).send({message: "Something went wrong. Try again."});
                                        return;
                                    }
                                } 
                            });
                        } 
                    }
                }
            }                     
            
        });
               
        res.status(201).send({
            message: "Success!"
        });  
    });
})

//adding to favorites
router.post('/api/recipes/favorites', (req,res) => {
    const recipe_id = req.body.recipe_id;
    const user_id = req.body.user_id;
    db.query('INSERT INTO favorite VALUES (?,?)', [recipe_id, user_id], (error, result, fields) => {     
        if (!error && result && result.affectedRows === 1) {
            res.status(201).send({
                message: "Like added."
            });
        } else {
            res.status(500).send({
                message: "Something went wrong. Try again."
            });
        }   
    });
});

router.put("/api/recipes", (req, res) => {
    upload(req, res, (err) => {
        const recipe_img = req.body.recipe_name.toLowerCase().split(" ").join("_");
        if (err) {
            res.status(400).send({
                message: "Make sure that your image is .jpg or .jpeg and has max. 1MB size."   
            });
            return;
        } else {
            if (req.file === undefined) {
                res.status(400).send({
                    message: "No image selected."
                });
                return;
            }
        }
        //deletes unused images
        db.query('SELECT recipe_img from recipe WHERE recipe.recipe_id = ?', [req.body.recipe_id], (error, result, fields) => {
            if (error) {
                throw error;
            } else {
                if (result[0].recipe_img != recipe_img) {
                    const fs = require('fs');
                    const path = `./public/global/images/${result[0].recipe_img }.jpg`;
                    fs.unlink(path, err => {
                        if (err) {
                            console.error(err)
                            return;
                        }
                    });
                }                   
            }
        });

        //update  recipe table
        db.query("UPDATE recipe SET recipe_name = ?, recipe_desc = ?, recipe_img = ? WHERE recipe.recipe_id = ?;", [req.body.recipe_name, req.body.recipe_description, recipe_img, req.body.recipe_id], (error, result, fields) => {  
            if (error) {
                throw error;
            } else {
                if (result.affectedRows === 0) {
                    res.status(500).send({
                        message: "Something went wrong with updating. Try again."
                    });
                    return;
                }
            } 
        }); 

        //delete previous ingredients
        db.query("DELETE FROM ingredient_has_recipe WHERE ingredient_has_recipe.recipe_id = ?;", [req.body.recipe_id], (error, result, fields) => {
            if (error) {
                throw error;
            } else if (result.affectedRows === 0) {
                res.status(500).send({
                    message: "Something went wrong with updating ingredients. Try again."
                });
                return;     
            } 
        });

        //chceck if recipe has ingredients:
        let formObjectIngredients = req.body.ingredients;
        let ingredients = [];
        for (key in formObjectIngredients) { 
            let duplicate = 0;
            ingredients.forEach(i => {
                if (i.id === formObjectIngredients[key].id) {
                    i.amount = Number(i.amount) + Number(formObjectIngredients[key].amount);
                    duplicate = 1;
                }
            })
            if (!duplicate) {
                ingredients.push(formObjectIngredients[key]);
            }          
        }

        if (ingredients.length !== 0) {

            //add new ingredients
            for (let i in ingredients){
                db.query("INSERT INTO ingredient_has_recipe VALUES (?,?,?);", [ingredients[i].id, req.body.recipe_id, ingredients[i].amount], (error, result, fields) => {
                    if (error) {
                        throw error;
                    } else if (result.affectedRows === 0) {
                        res.status(500).send({
                            message: "Something went wrong with updating ingredients. Try again."
                        });
                        return;
                    }    
                });
            }    
        } 

        res.status(200).send({
            message: "Success!"
        });
             
    });
})

//delete from favorite
router.delete('/api/recipes/favorites', (req,res) => {
    const recipe_id = req.body.recipe_id;
    const user_id = req.body.user_id;
    db.query('DELETE FROM favorite WHERE favorite.recipe_id = ? AND favorite.user_id = ?', [recipe_id, user_id], (error, result, fields) => {
        if (!error && result && result.affectedRows === 1) {
            res.status(200).send({
                message: "Like deleted."
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
