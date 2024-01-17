const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//Validation
const { registrationValidation, loginValidation } = require('../middlewares/validation');
const { connectToDatabase } = require('../config/db');

/* POST Registration. */
const register = async (req, res, next) => {
//  return async (req, res, next) => {
    const db = await connectToDatabase();
    const dbcol = db.collection('users');
        //Checking the validation
        // Lets validate the data before we create user
        const { error } = registrationValidation(req.body); 
        if (error) return res.status(400).json({status: false,message: error.details[0].message ,data: []});

        //Check if user is already in the database

        const emailExist = await dbcol.findOne({ email: req.body.email });
        if (emailExist) return res.status(400).json({status: false,message: 'Email already exist',data: []});

        //Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        //Create new user
        const user = {
            email: req.body.email,
            userName: req.body.userName,
            password: hashPassword,
            phone: req.body.phone,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            zipcode: req.body.zipcode,
            role: 'user',
            isActive: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: ''
        };

        try {
            const savedUser = await dbcol.insertOne(user);
            if(savedUser.insertedId == '')
            {
                res.status(400).json({
                    status: false,
                    message: 'Something went wrong',
                    data: [],
                });
            }
            res.status(200).json({
                status: true,
                message: 'User Register successfully!',
                data: savedUser,
            });

        } catch (err) {
            const code = err.code ? err.code : 500;
            res.status(code).json({
                status: false,
                message: err.message ? err.message : 'Something went wrong. Please try again!!',
                data: []
            });
        }
    // }
}
/* POST Login. */
const login = async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const dbcol = db.collection('users');
        
        // Lets validate the data before we login user
        const {error} = loginValidation(req.body);
        if (error) return res.status(400).json({status: false,message: error.details[0].message, data: []});

        //Check if email exist in the database
        const userData = await dbcol.findOne({ email: req.body.email });
        if (!userData) return res.status(400).json({status: false,message: 'Email or password is wrong', data: []});

        //Password is correct
        const validPass = await bcrypt.compare(req.body.password,userData.password);
        if (!validPass) return res.status(400).json({status: false,message: 'Invalid password', data: []});

        //Create and assign token
        const token = jwt.sign({_id:userData._id},process.env.TOKEN_SECRET, { expiresIn: '1h' });
        dbcol.updateOne( { _id: userData._id }, { $set: { lastLogin: new Date() } });

        res.header('auth-token',token).status(200).json({
            status: true,
            message: 'User Login successfully!',
            data: [{token: token}],
        });
    }  catch (err) {
        const code = err.code ? err.code : 500;
        res.status(code).json({
            status: false,
            message: err.message ? err.message : 'Something went wrong. Please try again!!',
            data: []
        });
    }    
}

module.exports= { register , login };