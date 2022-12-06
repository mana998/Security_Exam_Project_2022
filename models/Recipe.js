class Recipe {
    constructor(id, name, description, user_id, img, likes, is_private) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.user_id = user_id;
        this.img = img;
        this.likes = likes;
        this.is_private = is_private
    }
}

module.exports = {
    Recipe: Recipe
}