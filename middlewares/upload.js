const multer = require("multer");

// Create a function that generates dynamic storage configuration
const generateStorage = (destinationFolder) => {
    return multer.diskStorage({
        destination: destinationFolder,

        filename: function (req, file, cb) {
            cb(null, new Date().getTime() + req.user._id.slice(-4)  + '_' + file.originalname);
        }
    });
};

// Update fileFilter to handle file type and size errors
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
        // cb('Invalid file type. Only JPG, JPEG, and PNG files are allowed.', false);

    } else {
        cb(null, false);
    }
};

// Create a function that returns the dynamic upload middleware
const getDynamicUpload = (destinationFolder) => {
    return multer({
        storage: generateStorage(destinationFolder),
        limits: {
            fileSize: 1024 * 1024 * 5
        },
        fileFilter: fileFilter
    });
};

module.exports = getDynamicUpload;

