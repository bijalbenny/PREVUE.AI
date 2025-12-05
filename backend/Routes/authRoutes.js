import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/user.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
    const { fullname, username, password } = req.body;
    const existingUser = await userModel.findOne({ username });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.create({ fullname, username, password: hashedPassword });

    const token = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET);
    res.cookie("token", token ,{
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/"
    });
    res.status(200).json({ message: "User registered successfully" });
});

// Signin Route
router.post("/signin", async (req, res) => {
    const user = await userModel.findOne({ username: req.body.username });
    if (!user) return res.status(404).json({ message: "Username or password is incorrect!" });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(404).json({ message: "Username or password is incorrect!" });

    user.lastSignIn = new Date();
    await user.save();

    const token = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET);
    res.cookie("token", token ,{
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/",
    });
    res.status(200).json({ message: "User signed in successfully" });
});

// Logout Route
router.get('/logout', (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,  
        sameSite: "none",  
        path: "/",
    });
    res.status(200).json({ message: "User logged out successfully" });
});

export default router;