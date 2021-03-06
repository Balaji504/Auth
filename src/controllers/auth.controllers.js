import User from '../models/User';
import jwt from 'jsonwebtoken';
import config from '../config';
import Role from '../models/Role';

export const signup = async (req, res) => {
    const {username, email, password, roles} = req.body;

    const newUser = new User({
        username,
        email,
        password: await User.encryptPassword(password)
    })

    // Find Roles
    if (req.body.roles) {
        const foundRoles = await Role.find({name: {$in: roles}})
        newUser.roles = foundRoles.map(role => role._id)
    } else {
        const role = await Role.findOne({name: "user"})
        newUser.roles = [role._id];
    }

    // Save User
    const saveUser = await newUser.save();
    console.log(saveUser);

    // JWT Token
    const token = jwt.sign({id: saveUser._id}, config.SECRET, {
        expiresIn: 43200 // Token expire in 12 hours
    })


    res.json({token});
}

export const signin = async (req, res) => {
    
    // Find User
    const userFound = await User.findOne({email: req.body.email}).populate("roles");
    
    if (!userFound) return res.status(400).json({message: "User not Found!"});

    // Compare Password
    const comparePassword = await User.matchPassword(req.body.password, userFound.password);

    if (!comparePassword) return res.status(401).json({token: null, message: "Invalid Password!"})

    // Token Emitting
    const token = jwt.sign({id: userFound._id}, config.SECRET, {
        expiresIn: 43200 // 12 Hours expire Token
    });

    res.json({token});
}