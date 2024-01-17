const router = require('express').Router();
const user = require('../controllers/user')
const verifyToken = require('../middlewares/verifyToken');
const getDynamicUpload = require("../middlewares/upload");


// Dynamic folder path based on user ID or any other criteria
const dynamicFolder = (req, file, cb) => {
    const destinationFolder = 'public/images/userImages/';
    cb(null, destinationFolder);
};

const upload = getDynamicUpload(dynamicFolder);


/* GET User Detail. */
router.get("/", verifyToken , user.getUserDetail);
/* POST User Profile Update. */
router.post("/update-profile", verifyToken , user.updateProfile);
/* POST User Profile Image Update. */
router.post("/update-profile-image", [ verifyToken ,upload.single('userImage')] , user.updateProfileImage);
/* POST User Password Change Update. */
router.post("/change-password", verifyToken , user.changePassword);


module.exports = router;
