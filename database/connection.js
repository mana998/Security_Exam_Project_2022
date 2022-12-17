require('dotenv').config();

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host     : process.env.HOST,
    database : process.env.DATABASE,
    user     : process.env.USER,
    password : process.env.PASSWORD
})

connection.connect(function(err) {
    if (err) {
        console.log(err.message);
        throw err.message;
    }
    console.log("Connected!");
});

module.exports = {
    connection
}