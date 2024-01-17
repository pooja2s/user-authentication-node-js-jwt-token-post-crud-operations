const router = require('express').Router();
const auth = require('../controllers/auth')


/* POST Registration. */
router.post("/register", auth.register);
/* POST Login. */
router.post("/login", auth.login);


module.exports = router;
