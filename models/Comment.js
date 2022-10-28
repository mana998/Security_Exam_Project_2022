class Comment {
    constructor(id, user_id, username, comment, timestamp) {
        this.id = id;
        this.user_id = user_id;
        this.username = username;
        this.comment = comment;
        this.timestamp = timestamp;
    }
}

module.exports = {
    Comment: Comment
}