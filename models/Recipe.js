class Recipe {
    constructor(id, name, description, user_id, img, likes) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.user_id = user_id;
        this.img = img;
        this.likes = likes;
    }
}

module.exports = {
    Recipe: Recipe
}