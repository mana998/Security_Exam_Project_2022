const router = require("express").Router();
const { getConnection, disconnect } = require("../database/connection");
const sanitize = require("./sanitize.js");

router.get("/api/measurements", (req, res) => {
  let db = getConnection();
  //get ingredients from db
  db.query("SELECT * FROM measurement;", (error, result, fields) => {
    if (result?.length !== 0) {
      const measures = [];
      for (let measure of result) {
        measure = sanitize(measure);
        measures.push({
          name: measure.measurement_name,
          id: measure.measurement_id,
        });
      }
      res.status(200).send({
        measures: measures,
      });
    } else {
      res.status(200).send({
        message: "There are no measures.",
      });
    }
  });
  disconnect(db)
});

module.exports = {
  router: router,
};
