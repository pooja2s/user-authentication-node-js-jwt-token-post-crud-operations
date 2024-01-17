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
    
    // if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    //     // Invalid file type error
    //     return cb(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed.'));
    // }
    
    // if (file.size > 1024 * 1024 * 5) {
    //     // File size exceeds the limit error
    //     return cb(new Error('File size exceeds the limit of 5MB.'));
    // }

    // // Accept the file
    // cb(null, true);
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

