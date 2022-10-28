const router = require("express").Router();
const db = require("./../database/connection").connection; 

router.get('/api/measurements', (req,res) => {

    //get ingredients from db
    db.query('SELECT * FROM measurement;', (error, result, fields) => {
        if (result.length !== 0) {
            const measures = [];
            for (let measure of result){
                measures.push( {name : measure.measurement_name, id: measure.measurement_id} );
            }      
            res.status(200).send({
                measures: measures
            });
        } else {
            res.status(200).send({
                message: "There are no measures."
            });
        }
    });  
})

module.exports = {
    router: router
}
