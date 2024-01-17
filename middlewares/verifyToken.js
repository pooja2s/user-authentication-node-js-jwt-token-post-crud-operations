const jwt = require('jsonwebtoken');

//Middleware Function

module.exports = function (req,res,next){
    const token = req.header('auth-token');
    //Check if not token is supplied
    if(!token) return res.status(401).send('Access Denied');
    try{
        //Verify Token
        const verifiedToken = jwt.verify(token,process.env.TOKEN_SECRET)
        req.user = verifiedToken;
        next();
    }
    catch(e){
        res.status(400).send('Invalid Token')
    }
}
