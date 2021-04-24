const jwt = require('jsonwebtoken') 


module.exports = function(req,res, next){
    //check if token is in the header 
    const token = req.header('auth-token')
    if(!token) return res.status(401).send('Access Denied');

    //verify the token 
    try {
        const verified = jwt.verify(token, 'SUPERSECRET555')
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).send('Invalid Token')
    }
}