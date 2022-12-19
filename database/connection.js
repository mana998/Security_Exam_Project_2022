require('dotenv').config();

const mysql = require('mysql2');

function getConnection(userType) {
    const connectionParams = {
        host: process.env.HOST,
        database: process.env.DATABASE
    }
    switch(userType){
        case "admin": {
            connectionParams.user = process.env.ADMIN_USER
            connectionParams.password = process.env.ADMIN_PASSWORD
            break;
        }
        case "user": {
            connectionParams.user = process.env.NORMAL_USER
            connectionParams.password = process.env.NORMAL_PASSWORD

            break;
        }
        default: {
            connectionParams.user = process.env.GUEST_USER
            connectionParams.password = process.env.GUEST_PASSWORD
            break;
        }
    }

    
    console.log(connectionParams);
    const connection = mysql.createConnection(connectionParams);

    connection.connect(function(err) {
        if (err) {
            console.log(err.message);
            throw err.message;
        }
        console.log("Connected!");
        // console.log(connection.config);
    });
    
    return connection;
}

function disconnect(connection) {
    connection.end();
}

// const connection = mysql.createConnection({
//     host     : process.env.HOST,
//     database : process.env.DATABASE,
//     user     : process.env.USER,
//     password : process.env.PASSWORD
// })



module.exports = {
    getConnection, disconnect
}