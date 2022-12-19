-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema cooking
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema cooking
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `cooking`;
CREATE SCHEMA IF NOT EXISTS `cooking` DEFAULT CHARACTER SET utf8 ;
USE `cooking` ;

-- -----------------------------------------------------
-- Table `cooking`.`measurement`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`measurement` (
  `measurement_id` INT NOT NULL AUTO_INCREMENT,
  `measurement_name` VARCHAR(5) NOT NULL,
  PRIMARY KEY (`measurement_id`),
  UNIQUE INDEX `measurement_id_UNIQUE` (`measurement_id` ASC) VISIBLE,
  UNIQUE INDEX `measurement_name_UNIQUE` (`measurement_name` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cooking`.`ingredient`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`ingredient` (
  `ingredient_id` INT NOT NULL AUTO_INCREMENT,
  `ingredient_name` VARCHAR(45) NOT NULL,
  `measurement_id` INT NOT NULL,
  PRIMARY KEY (`ingredient_id`),
  UNIQUE INDEX `ingredient_id_UNIQUE` (`ingredient_id` ASC) VISIBLE,
  UNIQUE INDEX `ingredient_name_UNIQUE` (`ingredient_name` ASC) VISIBLE,
  INDEX `fk_ingredient_measurement_idx` (`measurement_id` ASC) VISIBLE,
  CONSTRAINT `fk_ingredient_measurement`
    FOREIGN KEY (`measurement_id`)
    REFERENCES `cooking`.`measurement` (`measurement_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `cooking`.`role`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`role` (
  `role_id` INT NOT NULL,
  `role` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`role_id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `cooking`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(128) NOT NULL,
  `role_id` INT NOT NULL,
  `refresh_token` VARCHAR(255)
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  INDEX `role_idx` (`role_id` ASC) VISIBLE,
  CONSTRAINT `role`
    FOREIGN KEY (`role_id`)
    REFERENCES `cooking`.`role` (`role_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cooking`.`recipe`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`recipe` (
  `recipe_id` INT NOT NULL AUTO_INCREMENT,
  `recipe_name` VARCHAR(45) NOT NULL,
  `recipe_desc` TEXT NOT NULL,
  `user_id` INT NULL,
  `recipe_img` VARCHAR(100) NULL,
  `likes` INT NOT NULL DEFAULT(0),
  `is_private` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`recipe_id`),
  UNIQUE INDEX `recipe_id_UNIQUE` (`recipe_id` ASC) VISIBLE,
  INDEX `fk_recipe_user1_idx` (`user_id` ASC) VISIBLE,
  UNIQUE INDEX `recipe_img_UNIQUE` (`recipe_img` ASC) VISIBLE,
  CONSTRAINT `fk_recipe_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `cooking`.`user` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cooking`.`comment` (
  `comment_id` INT NOT NULL AUTO_INCREMENT,
  `recipe_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `comment` VARCHAR(255) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  UNIQUE INDEX `comment_id` (`comment_id` ASC) VISIBLE,
  INDEX `fk_comment_recipe1` (`recipe_id` ASC) VISIBLE,
  INDEX `fk_comment_user1` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_comment_recipe1`
    FOREIGN KEY (`recipe_id`)
    REFERENCES `cooking`.`recipe` (`recipe_id`),
  CONSTRAINT `fk_comment_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `cooking`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 23
DEFAULT CHARACTER SET = utf8mb3;

-- -----------------------------------------------------
-- Table `cooking`.`ingredient_has_recipe`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`ingredient_has_recipe` (
  `ingredient_id` INT NOT NULL,
  `recipe_id` INT NOT NULL,
  `amount` DOUBLE UNSIGNED NOT NULL,
  PRIMARY KEY (`ingredient_id`, `recipe_id`),
  INDEX `fk_ingredient_has_recipe_recipe1_idx` (`recipe_id` ASC) VISIBLE,
  INDEX `fk_ingredient_has_recipe_ingredient1_idx` (`ingredient_id` ASC) VISIBLE,
  CONSTRAINT `fk_ingredient_has_recipe_ingredient1`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `cooking`.`ingredient` (`ingredient_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ingredient_has_recipe_recipe1`
    FOREIGN KEY (`recipe_id`)
    REFERENCES `cooking`.`recipe` (`recipe_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cooking`.`favorite`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cooking`.`favorite` (
  `recipe_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`recipe_id`, `user_id`),
  INDEX `fk_recipe_has_user_user1_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_recipe_has_user_recipe1_idx` (`recipe_id` ASC) VISIBLE,
  CONSTRAINT `fk_recipe_has_user_recipe1`
    FOREIGN KEY (`recipe_id`)
    REFERENCES `cooking`.`recipe` (`recipe_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_recipe_has_user_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `cooking`.`user` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TRIGGER add_like AFTER INSERT ON favorite
	FOR EACH ROW UPDATE recipe SET likes = likes + 1 WHERE recipe_id = NEW.recipe_id;
    
CREATE TRIGGER remove_like BEFORE DELETE ON favorite
	FOR EACH ROW UPDATE recipe SET likes = likes - 1 WHERE recipe_id = OLD.recipe_id;
    

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

USE `cooking`;


-- INSERT --

INSERT INTO role (role_id, role) VALUES 
(0, "admin"),
(1, "user");

INSERT INTO user (username, password, role_id) VALUES 
("dprzygocka", "$2b$15$Wp3v5v0B0fVQhdAQj7ztIuJE8s9j2Br.S.VV3MC7M2wIVHmz193/C", 1),
("mzimmer", "$2b$15$p.RGKhZezfLSswbcshvJpe5WGHY8r.8tb4/Wjm0emndPmJxMNqnaW", 1),
("bubbly_snowflake", "$2b$15$HUey/1SH5Tdgpzh4UR.TGeu.Fy.0AK7RDA.53gM0XDuFlcWuLhm26", 0),
("SteelTitan", "$2b$15$HzWS6O5cmMJE5m6zOu72TO/ghCdzyGU456X0ona.OZu1.SqDTjOiG", 0),
("Jamie Oliver", "$2b$15$i6NyzXk/6pSOm7qh3r7eguqg3eUCtxRT9zp.v9GYOFXZ8l1B5XSY2", 0),
("CrashTV", "$2b$15$avnx7us69VxRRq218UI8gurrK773oKQFxf7H6QRG8vniM9pSL5pPS", 0),
("fantastic.shoppingaddict", "$2b$15$SeFI7h1KUyQkmnfno2N.UebZGBd/4x.2gjguIAlTsuCb8Y1946Em6", 0),
("hello", "$2b$15$hOcjiOg6vOXyzWE7zO/eDe7DA14TatIHKOgbpP8nhBH7MYO6CmK9u", 0);

INSERT INTO measurement (measurement_name) VALUES ("kg"), ("g"), ("cup"), ("tsp"), ("tbs"),
("pt"), ("l"), ("ml"), ("°C"), ("°F"), ("pcs"), ("sl"), (" ");


INSERT INTO ingredient (ingredient_name, measurement_id) VALUES 
("feta cheese", 2),
("jarred red peppers", 2),
("olive oil", 5),
("apricot", 11),
("orange-blossom honey", 5),
("egg",11),
("vanilla sugar",5),
("butter", 5),
("icing sugar",13),
("hazelnuts", 5),
("courgettes",11),
("penne", 2),
("single cream",8),
("parmesan",2),
("bacon",12),
("thyme",2),
("strawberries",2),
("pineapple",2),
("blueberries",2),
("raspberries",2),
("walnuts",2),
("lemon juice",8),
("onion",11),
("garlic clove",11),
("broccoli",2),
("carrots",2),
("cauliflower",2),
("peas",2),
("parsley",5),
("pepper",4),
("rice",3),
("ramen noodles",2),
("scallions",2),
("salt",4);

INSERT INTO recipe (recipe_name, recipe_desc, user_id, recipe_img, is_private) VALUES
("Courgette Carbonara", "
    Put a large pan of salted water on to boil.
    Halve and then quarter any larger courgettes lengthways. Cut out and discard any fluffy middle bits, and slice the courgettes at an angle into pieces roughly the same size and shape as the penne. Smaller courgettes can simply be sliced finely.
    Your water will now be boiling, so add the penne to the pan and cook according to the packet instructions.
    To make your creamy carbonara sauce, separate the eggs and put the yolks into a bowl (saving the whites for another recipe). Add the cream and grate in half the Parmesan, and mix together with a fork. Season lightly with sea salt and black pepper, and put to one side.
    Heat a very large frying pan (a 35cm one is a good start – every house should have one!) and add a good splash of olive oil. Cut the pancetta or bacon into chunky lardons and fry until dark brown and crisp.
    Add the courgette slices and 2 big pinches of black pepper, not just to season but to give it a bit of a kick. Pick, chop and sprinkle in the thyme leaves (reserving any flowers), give everything a stir, so the courgettes become coated with all the lovely bacon-flavoured oil, and fry until they start to turn lightly golden and have softened slightly.
    It’s very important to get this next bit right or your carbonara could end up ruined. You need to work quickly. When the pasta is cooked, drain it, reserving a little of the cooking water. Immediately, toss the pasta in the pan with the courgettes, bacon and lovely flavours, then remove from the heat and add a ladleful of the reserved cooking water and your creamy sauce. Stir together quickly. (No more cooking now, otherwise you’ll scramble the eggs)
    Get everyone around the table, ready to eat straight away. While you’re tossing the pasta and sauce, grate in the rest of the Parmesan and add a little more of the cooking water if needed, to give you a silky and shiny sauce. Taste quickly for seasoning.
    If you’ve managed to get any courgette flowers, tear them over the top, then serve and eat immediately, as the sauce can become thick and stodgy if left too long.
", 1, "courgette_carbonara", 0),
("Souffle omelette with vanilla apricots", "

    Halve the apricots, then place in a saucepan with the honey and 2 tablespoons of water.
    Cover and cook until soft but still holding their shape.
    Preheat the grill to high. Separate the egg yolk from the white.
    Add the vanilla sugar and 2 tablespoons of water to the yolks, then whisk until thick and creamy.
    Using a clean whisk, beat the egg whites until stiff, then fold into the yolk mixture with a metal spoon.
    Melt the butter in a 20cm omelette pan, tipping it around the pan to cover the surface. Pour in the egg mixture and cook over a medium heat until the omelette is golden brown and set on the underside.
    Place under the grill to cook until the top is set.
    Run a spatula under the omelette to loosen it, then make an indentation across the middle. Spoon over the apricots, then gently fold over one half of the omelette.
    Tip onto a plate, dust with icing sugar, chop and scatter over the hazelnuts and serve immediately.

", 5,"souffle_omelette_with_vanilla_apricots", 1),
("Spicy feta & pepper dip", "

    In a food processor combine the feta, red peppers and oil.
    Season with black pepper and blend until smooth.
    Transfer to a bowl, then serve.

", 5,"spicy_feta_&_pepper_dip", 0),
("Fruit Salad", "
	Slice strawberries and pineapple
    Add blueberries, raspberries and walnuts.
    Squeeze fresh lemon juice and mix.

", 5,"fruit_salad", 0),
("Vegetarian risotto with parmesan", "

In 10-inch nonstick pan, heat butter and oil over medium-high heat until butter is melted. Add onion and garlic; cook 3 to 4 minutes, stirring frequently, until onion is tender.
Stir in rice. Cook, stirring occasionally, until rice is tender.
Meanwhile, cook frozen vegetables as directed on bag. Stir vegetables, Parmesan cheese, parsley and pepper into rice .

", 4,"vegetarian_risotto_with_parmesan", 1),
("Ramen with bacon and egg", "

	Boil 2 cups of water in a pot.
    Add the ramen seasoning packet and 1 tablespoon of butter. Stir until the butter melts.
    Add the ramen noodle cube and cook until the noodles become tender. (2 minutes) Pour the ramen into a bowl.
    Fry an egg. Cook bacon and slice scallions.
	Add fried egg, bacon, scallions and season with salt and pepper.

", 3,"ramen_with_bacon_and_egg", 0);

INSERT INTO ingredient_has_recipe (ingredient_id, recipe_id, amount) VALUES 
(1,3,240),
(2,3, 120),
(3,3,3),
(4,2,2),
(5,2,1),
(6,2,1),
(7,2,0.5),
(8,2,0.5),
(9,2,0),
(10,2,0.5),
(11,1,6),
(12,1,500),
(6,1,4),
(13,1,100),
(14,2,20),
(3,1,1),
(15,1,6),
(16,1,15),
(17, 4, 100),
(18, 4, 100),
(19, 4, 100),
(20, 4, 100),
(21, 4, 50),
(22, 4, 25),
(23, 5, 1),
(24, 5, 1),
(25, 5, 250),
(26, 5, 250),
(27, 5, 250),
(28, 5, 250),
(29, 5, 2),
(30, 5, 0.25),
(31, 5, 1),
(8, 5, 2),
(3, 5, 2),
(14, 5, 20),
(8,6,1),
(32,6,1),
(15,6,3),
(6,6,100),
(33,6,50),
(34,6,0.25),
(30,6,0.25);


-- UPDATE recipe SET recipe_img = "spicy_feta_&_pepper_dip" WHERE recipe_id = 3;
-- UPDATE recipe SET recipe_img = "courgette_carbonara" WHERE recipe_id = 1;
-- UPDATE recipe SET recipe_img = "souffle_omelette_with_vanilla_apricots" WHERE recipe_id = 2;