require('dotenv').config();

const mysql = require('mysql');

function getConnection(userType) {
    const connectionParams = {
        host: process.env.HOST,
        database: process.env.DATANASE
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
    const connection = mysql.createConnection(connectionParams);
    connection.connect();
    return connection;
}

function disconnect(connection) {
    connection.disconnect();
}

module.exports = {
    getConnection,
    disconnect
}