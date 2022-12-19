class User {
    constructor(id, name, password, active, refresh_token) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.active = active;
        this.refresh_token = refresh_token
    }
}

module.exports = {
    User: User
}