const router = require("express").Router();

router.get("/getsession", (req, res) => {
    res.status(200).send({
        id: req.session.userId, 
    });
})

router.post("/setsession/id", (req, res) => {
    if (req.body.id) {
        req.session.userId = req.body.id;
        res.status(201).send({id: req.body.id, message: "Session set"});
    } else {
        res.status(500).send({message: "Session not set"});
    }
})

router.delete("/destroysession", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            res.status(500).send({ 
                message: "Something went wrong"
            });
        } else {
            res.status(200).send({ 
                message: "Session destroyed"
            });
        }
    });
})

module.exports = {
    router: router
}
