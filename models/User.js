class User {
    constructor(id, name, password, active) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.active = active;
    }
}

module.exports = {
    User: User
}