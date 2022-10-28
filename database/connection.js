require('dotenv').config();

const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : process.env.HOST,
    database : process.env.DATABASE,
    user     : process.env.USER,
    password : process.env.PASSWORD
})

connection.connect();

module.exports = {
    connection
}