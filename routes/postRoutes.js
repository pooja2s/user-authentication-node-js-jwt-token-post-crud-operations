const router = require('express').Router();
const post = require('../controllers/post')
const verifyToken = require('../middlewares/verifyToken');
const getDynamicUpload = require("../middlewares/upload");


// Dynamic folder path based on user ID or any other criteria
const dynamicFolder = (req, file, cb) => {
    const destinationFolder = 'public/images/postImages/';
    cb(null, destinationFolder);
};

const upload = getDynamicUpload(dynamicFolder);

/* GET All Post. */
router.get("/", verifyToken , post.getAllPost);
/* POST Add Post. */
router.post("/", [ verifyToken , upload.array("postImage", 10) ] , post.addPost);
/* GET Post Detail. */
router.get("/:postId", verifyToken , post.getAllPost);
/* PATCH Post. */
router.patch("/:postId",  [ verifyToken , upload.array("postImage", 10) ] , post.updatePost);
/* Delete Post. */
router.delete("/:postId", verifyToken , post.deletePost);
/* Delete Post Image. */
router.delete("/image/:postId", verifyToken , post.deletePostImage);

module.exports = router;