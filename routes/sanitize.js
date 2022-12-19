const sanitizeHtml = require('sanitize-html');


//router.use('/api', sanitize)
const sanitizeOptions = {
    allowedTags: [],
    allowedAttributes: {}
}
//sanitize middleware
module.exports = function (req, res, next) {
    //console.log("in sanitize", req.body, req.params, req.query, req.file)
    if (req.params || req.query || req.body) {
        req.params = sanitizeObject(req.params)
        req.query = sanitizeObject(req.query)
        req.body = sanitizeObject(req.body)
    } else { //used as normal function and not middleware to sanitize normal objects
        req = sanitizeObject(req);
    }
    //console.log("in here", next)
    if (next) {
        next()
    } else {
        return req
    };
}

function sanitizeObject(object) {
    for (key in object) {
        //console.log("key", key)
        //console.log('typeof', typeof object[key])
        if (typeof object[key] !== 'object') {
            //console.log("key", key, "object", object[key])
            //console.log(`before query ${object[key]}`)
            object[key] = sanitizeHtml(object[key], sanitizeOptions)
        } else { //recursion if data to sanitize is object
            object[key] = sanitizeObject(object[key]);
        }
        //console.log(`after query ${object[key]}`)
    }
    return object
}