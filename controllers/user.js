const router = require('express').Router();
const { connectToDatabase } = require('../config/db');
const { ObjectId } = require('mongodb');
const { profileUpdateValidation , passwordValidation } = require('../middlewares/validation');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const baseURL = process.env.BASE_URL;

// process.env.BASE_URL
/* GET User Detail. */
const getUserDetail = async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('users');
    try {
        const filter = { _id: new ObjectId(req.user._id)};
        const option = {
            projection: { 
                _id: 1 ,
                email: 1, 
                userName: 1, 
                phone: 1, 
                firstName: 1, 
                lastName: 1, 
                address: 1, 
                city: 1, 
                state: 1, 
                country: 1, 
                zipcode: 1,
                userImage: 1
            }
        }

        const userData = await dbcol.findOne(filter,option); 
        if(!userData || userData.length === 0)
        {
            return res.status(200).json({
                status: false,
                message: 'No user found',
                data: [],
            });
        }
        // Add base URL to userImage property
        if (userData && userData.userImage) {
            userData.userImage = `${baseURL}/public/images/userImages/${userData.userImage}`;
        }
        res.status(200).json({
            status: true,
            message: 'User Details found',
            data: userData,
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
/* POST User Profile Update. */
const updateProfile = async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('users');
    try{
        // Checking the validation
        // Lets validate the data before we updating user
        const { error } = profileUpdateValidation(req.body); 
        if (error) return res.status(400).json({status: false, message: error.details[0].message ,data: []});


        const filter = { _id: new ObjectId(req.user._id)};
        const updateData = {
           $set: {
            userName: req.body.userName,
            phone: req.body.phone,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            zipcode: req.body.zipcode,
            updatedAt: new Date()
           }
        };

        const option = {
            returnDocument: 'after',
            projection: { 
                _id: 1 ,
                email: 1, 
                userName: 1, 
                phone: 1, 
                firstName: 1, 
                lastName: 1, 
                address: 1, 
                city: 1, 
                state: 1, 
                country: 1, 
                zipcode: 1,
                userImage:1
            }
        }
        
        // Updating User Data in Database
        const updatedUser = await dbcol.findOneAndUpdate(filter,updateData, option); 
        if (!updatedUser){
            res.status(200).json({
                status:false,
                message:'Error while updating user profile',
                data: []
            })
        }
        else{
            
            // Add base URL to userImage property
            if (updatedUser && updatedUser.userImage) {
                updatedUser.userImage = `${baseURL}/public/images/userImages/${updatedUser.userImage}`;
            }
            res.status(201).json({
                status: true,
                message:"User Profile Updated Successfully.",
                data:updatedUser
            })
        }
    }
    catch(err){
        console.log("Error in updating profile", err);
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }



}
/* POST User Profile Image Update. */
const updateProfileImage = async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('users');
    try{
         // Check if there were any multer errors  
        const filter = { _id: new ObjectId(req.user._id)};
        const updateData = {
           $set: {
            userImage: req.file.filename,
            updatedAt: new Date()
           }
        };

        const option = {
            returnDocument: 'after',
            projection: { 
                _id: 1 ,
                email: 1, 
                userName: 1, 
                phone: 1, 
                firstName: 1, 
                lastName: 1, 
                address: 1, 
                city: 1, 
                state: 1, 
                country: 1, 
                zipcode: 1,
                userImage: 1
            }
        }
        // Delete existing file
        if(req.file.filename)
        {
            const userData = await dbcol.findOne(filter,{projection: { 
                userImage: 1
            }});

            const existingFilePath = 'public/images/userImages/' + userData.userImage;
            if (fs.existsSync(existingFilePath) && userData.userImage!='') {
                fs.unlinkSync(existingFilePath);
            }

        }
        
        // Updating User Image Data in Database
        const updatedUser = await dbcol.findOneAndUpdate(filter,updateData, option); 
        if (!updatedUser){
            res.status(200).json({
                status:false,
                message:'Error while updating user profile',
                data: []
            })
        }
        else{
            
            // Add base URL to userImage property
            if (updatedUser && updatedUser.userImage) {
                updatedUser.userImage = `${baseURL}/public/images/userImages/${updatedUser.userImage}`;
            }
            res.status(201).json({
                status: true,
                message:"User Profile Image Updated Successfully.",
                data:updatedUser
            })
        }
    }
    catch(err){
        console.log("Error in updating profile", err);
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }



}
/* POST User Password Change Update. */
const changePassword = async (req, res, next) => {
    
    const db = await connectToDatabase();
    const dbcol = db.collection('users');
    try{
        const filter = { _id: new ObjectId(req.user._id)};
        const option = {
            projection: { 
                _id: 1 ,
                password: 1
            }
        }

        // Checking the validation
        // Lets validate the data before we updating password
        const { error } = passwordValidation(req.body); 
        if (error) return res.status(400).json({status: false, message: error.details[0].message ,data: []});
        
        // check old Hash password
        const userData = await dbcol.findOne(filter,option); 
        const oldPasswordCompare = await bcrypt.compare(req.body.password,userData.password);
        if (oldPasswordCompare) return res.status(400).json({status: false, message: 'Old Password and New Password are same' , data: []});
        
        // Generate a new hashed password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        const updateData = {
           $set: {
            password: hashPassword,
            updatedAt: new Date()
           }
        };
        const updatedUserPassword = await dbcol.updateOne( filter, updateData);
        if(updatedUserPassword.modifiedCount==1)
        {
            res.status(200).json({
                status:true,
                message:"Password updated Successfully!",
                data: []
            });
        }
        else{
            res.status(400).json({
                status:false,
                message:'Failed to update the password',
                data: []
            })
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
module.exports = { getUserDetail , updateProfile , changePassword , updateProfileImage};