class Ingredient {
    constructor(id, name, measure, amount) {
        this.id = id;
        this.name = name;
        this.measure = measure;
        this.amount = amount;
    }
}

module.exports = {
    Ingredient: Ingredient
}