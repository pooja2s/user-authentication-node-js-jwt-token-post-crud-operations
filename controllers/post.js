const router = require('express').Router();
const { connectToDatabase } = require('../config/db');
const { ObjectId } = require('mongodb');
const { addPostValidation } = require('../middlewares/validation');
const fs = require('fs');
const baseURL = process.env.BASE_URL;

/* GET All Post. */
/* GET Post Detail. */
const getAllPost = async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('post');

    try {
        let filter ={};
        let postsData = null;
        let postsDataPromise = null;
        if(req.params.postId)
        {
            filter = { createdBy: new ObjectId(req.user._id),_id: new ObjectId(req.params.postId) };
        }
        const option = { 
            projection: { 
                _id: 1 ,
                title: 1, 
                description: 1, 
                createdBy: 1, 
                createdAt: 1,
                postImage: 1
            }
        };
        if(req.params.postId)
        {
            postsDataPromise = dbcol.aggregate([
                {
                    $match: filter
                },
                {
                    $lookup: {
                        from: "users",             // The name of the second collection (users)
                        localField: "createdBy",   // The field from the first collection (posts)
                        foreignField: "_id",       // The field from the second collection (users)
                        as: "userData"             // The alias for the resulting array of user information
                    }
                },
                {
                    $unwind: {
                        path: "$userData",         // Unwind the array of user information
                        preserveNullAndEmptyArrays: true // Preserve documents that don't have matching users
                    }
                },
                {
                    $project: {
                        _id: 1,                     // Include the default "_id" field
                        title: 1,                   // Include the title field
                        description: 1,             // Include the description field
                        postImage: 1,                   // Include the image field
                        createdBy: 1,               // Include the createdBy field
                        createdAt: 1,           // Include the entire post document
                        userName: "$userData.userName", // Include the user's name
                        userImage: "$userData.userImage" // Include the user's name
                    }
                }
            ]).next();
            
            postsData = await postsDataPromise;

            if (postsData && postsData.userImage!='') {
                postsData.userImage = `${baseURL}/public/images/userImages/${postsData.userImage}`;
            }
            if(postsData.postImage.length>0){
                postsData.postImage = postsData.postImage.map(image => `${baseURL}/public/images/postImages/${image}`);
            }
        }
        else
        {
            postsDataPromise = dbcol.aggregate([
                {
                    $match: filter
                },
                {
                    $lookup: {
                        from: "users",             // The name of the second collection (users)
                        localField: "createdBy",   // The field from the first collection (posts)
                        foreignField: "_id",       // The field from the second collection (users)
                        as: "userData"             // The alias for the resulting array of user information
                    }
                },
                {
                    $sort: {
                        "createdAt": -1 // 1 for ascending, -1 for descending
                    }
                },
                {
                    $unwind: {
                        path: "$userData",         // Unwind the array of user information
                        preserveNullAndEmptyArrays: true // Preserve documents that don't have matching users
                    }
                },
                {
                    $project: {
                        _id: 1,                     // Include the default "_id" field
                        title: 1,                   // Include the title field
                        description: 1,             // Include the description field
                        postImage: 1,                   // Include the image field
                        createdBy: 1,               // Include the createdBy field
                        createdAt: 1,           // Include the entire post document
                        userName: "$userData.userName", // Include the user's name
                        userImage: "$userData.userImage" // Include the user's name
                    }
                }
            ]).toArray();
            
            postsData = await postsDataPromise;

            for (const type of postsData) {  
                if(type.postImage.length>0){
                    type.postImage = type.postImage.map(image => `${baseURL}/public/images/postImages/${image}`);
                }
                if (type.userImage!='') {
                    type.userImage = `${baseURL}/public/images/userImages/${type.userImage}`;
                }
            }
        }

        // If no post is found 
        if (!postsData) return res.status(404).json({status: false, message: 'No data found!' ,data: []});
        
        res.status(200).json({
            status: true,
            message: 'Post data found!',
            data: postsData,
        });

    } catch (err) {
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }

}
/* POST Add Post. */
const addPost = async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('post');
    
    const option = { 
        projection: { 
            _id: 1 ,
            title: 1, 
            description: 1, 
            createdBy: 1, 
            createdAt: 1,
            postImage: 1
        }
    };

    let fileReferences = '';
    // Lets validate the data before we create post
    const {error} = addPostValidation(req.body);
    if (error) return res.status(400).json({status: false, message: error.details[0].message ,data: []});
    
    if(req.files.length!=0){
        fileReferences = req.files.map(file => file.filename); // Assuming Multer renames files
    }
    const postData = {
        title: req.body.title,
        description: req.body.description,
        createdBy:new ObjectId(req.user._id),
        createdAt: new Date(),
        updatedAt: new Date(),
        postImage: fileReferences
    };
    try {
        const savedPost = await dbcol.insertOne(postData);
        if(savedPost.insertedId == '')
        {
            res.status(400).json({
                status: false,
                message: 'Something went wrong',
                data: [],
            });
        }
        const savePostsData = await dbcol.findOne({_id:new ObjectId(savedPost.insertedId)},option);
        if(savePostsData.postImage.length>0){
            savePostsData.postImage = savePostsData.postImage.map(image => `${baseURL}/public/images/postImages/${image}`);
        }
        res.status(200).json({
            status: true,
            message: 'Post Added Successfully!',
            data: savePostsData,
        });
    } catch (err) {
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }

}
/* PATCH Post. */
const updatePost = async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('post');
    let fileReferences = '';

    const filter = { createdBy: new ObjectId(req.user._id),_id: new ObjectId(req.params.postId) };
    const option = {
         returnDocument: 'after',
         projection: { 
             _id: 1 ,
             title: 1, 
             description: 1, 
             createdBy: 1, 
             createdAt: 1,
             postImage: 1
         }
    }

    try {
        // Lets validate the data before we create post
        const {error} = addPostValidation(req.body);
        if (error) return res.status(400).json({status: false, message: error.details[0].message ,data: []});

        //Check is post belong to current user
        let authorizePostUser = await dbcol.findOne(filter);
        if (!authorizePostUser) return res.status(401).json({status: false, message: 'You are not authorized to perform this action' ,data: []});
        //check If Post exist
        if(authorizePostUser){
            
            if(req.files.length!=0){
                fileReferences = req.files.map(file => file.filename); // Assuming Multer renames files
            }
            //Merge Old post Image with new one
            fileReferences =  [...authorizePostUser.postImage, ...fileReferences] 
            const postData = {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    postImage: fileReferences,
                    updatedAt: new Date()
                }
            };

           // Updating Post Data in Database
            const updatedPost = await dbcol.findOneAndUpdate(filter,postData, option); 
            if (!updatedPost){
                res.status(200).json({
                    status:false,
                    message:'Error while updating post',
                    data: []
                })
            }
            else{
                if(updatedPost.postImage.length>0){
                    updatedPost.postImage = updatedPost.postImage.map(image => `${baseURL}/public/images/postImages/${image}`);
                }
                res.status(201).json({
                    status: true,
                    message:"Post Updated Successfully.",
                    data:updatedPost
                })
            }
        }
    } catch (err) {
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }
}
/* Delete Post. */
const deletePost = async (req, res, next) => {
    
    const db = await connectToDatabase();
    const dbcol = db.collection('post');
    const filter = { createdBy: new ObjectId(req.user._id),_id: new ObjectId(req.params.postId) };
    try {
        //Check is post belong to current user
        let authorizePostUser = await dbcol.findOne(filter);
        if (!authorizePostUser) return res.status(401).json({status: false, message: 'You are not authorized to perform this action' ,data: []});
        //check If Post exist
        if(authorizePostUser){
        // Updating Post Data in Database
            const deletedPost = await dbcol.findOneAndDelete(filter); 
            if (!deletedPost){
                res.status(200).json({
                    status:false,
                    message:'Error while updating post',
                    data: []
                })
            }
            else{
                if(authorizePostUser.postImage!=''){
                    const postImage = authorizePostUser.postImage.map(image =>{
                        const existingFilePath = 'public/images/postImages/' + image;
                        if (fs.existsSync(existingFilePath) && image!='') {
                            fs.unlinkSync(existingFilePath);
                        }
                    } );
                }
                res.status(201).json({
                    status: true,
                    message:"Post Deleted Successfully.",
                    data:[]
                })
            }
        }

    } catch (err) {
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }
}
/* Delete Post. */
const deletePostImage = async (req, res, next) => {
    
    const db = await connectToDatabase();
    const dbcol = db.collection('post');
    const filter = { createdBy: new ObjectId(req.user._id),_id: new ObjectId(req.params.postId) };
    const option = {
        returnDocument: 'after',
        projection: { 
            _id: 1 ,
            title: 1, 
            description: 1, 
            createdBy: 1, 
            postImage: 1
        }
    };
    
    try {
        //Check is post belong to current user
        let authorizePostUser = await dbcol.findOne(filter);
        if (!authorizePostUser) return res.status(401).json({status: false, message: 'You are not authorized to perform this action' ,data: []});
        //check If Post exist
        if(authorizePostUser){
            const postImageArray = authorizePostUser.postImage;
            const fileNameToDelete = req.body.postImageName;

            // Check if the file exists in the array
            const fileExists = postImageArray.filter(fileName => fileName == fileNameToDelete);

            if (fileExists.length==1) {
                // create new post image array 
                let newPostImage = postImageArray.filter(fileName => fileName !== fileNameToDelete);
                
                // delete Post Image
                const existingFilePath = 'public/images/postImages/' + fileNameToDelete;
                if (fs.existsSync(existingFilePath) && fileNameToDelete!='') {
                    fs.unlinkSync(existingFilePath);
                }
                const postData = {
                    $set: {
                        postImage: newPostImage,
                        updatedAt: new Date()
                    }
                };
                 // Updating Post Data in Database
                const updatedPost = await dbcol.findOneAndUpdate(filter,postData, option); 
                if (!updatedPost){
                    res.status(200).json({
                        status:false,
                        message:'Error while updating post',
                        data: []
                    })
                }
                else{
                    if(updatedPost.postImage.length>0)
                    {
                        updatedPost.postImage = updatedPost.postImage.map(image => `${baseURL}/public/images/postImages/${image}`);
                    }
                    res.status(201).json({
                        status: true,
                        message:"Post Image Deleted Successfully.",
                        data:updatedPost
                    })
                }

            } else {
                return res.status(401).json({status: false, message: 'File does not exist in the array.' ,data: []});
            }
        }

    } catch (err) {
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }
}


module.exports = { getAllPost , addPost , updatePost , deletePost , deletePostImage };


    
