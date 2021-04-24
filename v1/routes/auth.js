const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("./verifyToken");
require("dotenv").config({ path: ".env" });
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const validate = [
  check("fullName")
    .isLength({ min: 2 })
    .withMessage("Your full name is required"),
  check("email").isEmail().withMessage("provide a valid email"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters."),
];

const validateCategory = [
  check("title").isLength({ min: 2 }).withMessage("Title is required"),
  check("description")
    .isLength({ min: 2 })
    .withMessage("Description is required."),
];

const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, fullName: user.fullName },
    "SUPERSECRET555"
  );
};

router.get("/", (req, res) => {
  res.send("auth route blank...");
});
//endpoint is actually API_HOST/api/users/users
router.get("/users", async (req, res) => {
  // res.send('users data not implemented yet......')
  const user = await User.find();
  console.log("user:", user);
  res.send(user);
});
router.post("/filter", async (req, res) => {
  // res.send('users data not implemented yet......')
  const key = req.body.key;
  const user = await User.find({
    $or: [{ fullName: `${key}` }],
  });
  console.log("filter .....users:", user);
  res.send(user);
});

/*
 $and:[
            {$or: [
                { fullName: `${key}` },

              ]
            }, {$or: [
                { email: `${key}` },

              ]
            }
        ]
  */
//take out validate,  middleware to see req.body ..... 
router.post("/register", async (req, res) => {


console.log('req.body:',req.body);
if(req.body.sms_secret != "0592"){
    return res.status(401).send({success:false, message:"incorrect text code"})
}

  //check validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  //prevent duplicate email
  const userExist = await User.findOne({ email: req.body.email });
  if (userExist)
    return res
      .status(400)
      .send({ success: false, message: "Email already exists." });
  // {success:false, message:'Email already exists.'}
  //hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    fullName: req.body.fullName,
    email: req.body.email,
    password: hashPassword,
    created: Date.now(),
  });
  try {
    const savedUser = await user.save();
    //
    const token = generateToken(user);
    //best practice to NOT return even hashed password.
    res.send({
      success: true,
      data: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
      },
      token,
    });
  } catch (error) {
    console.log("error:", error);
    res.status(400).send({ success: false, error });
  }

  //res.send('register route.')
});

const validateLogin = [
  check("email").isEmail().withMessage("provide a valid email"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters."),
];
router.post("/login", validateLogin, async (req, res) => {
  //check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  //check if email exists.
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(404).send({
      success: false,
      message: "User is not registered with this email.",
    });

  // check if password is correct
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res
      .status(404)
      .send({ success: false, message: "Invalid email or password." });

  // create and assign web token. ( npm install jsonwebtoken )
  const token = generateToken(user); //jwt.sign({_id: user._id, email: user.email}, 'SUPERSECRET555')
  // res.send('logged In...!')
  res
    .header("auth-token", token)
    .send({ success: true, message: "Logged in successfully", token });
});

router.put("/update", async (req, res) => {
  //thanks: https://www.youtube.com/watch?v=bRRA-SrNyxg
  console.log("api /update ... req.body:", req.body);
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(404).send({
      success: false,
      message: "User is not registered with this email.",
    });

  const id = user._id;
  User.findById(id, (err, user) => {
    if (!user) {
      res.status(404).send("not found");
    } else {
      console.log("user:", user);
      const newUser = Object.assign(user, req.body);

      (user.fullName = req.body.fullName),
        (user.phone = req.body.phone),
        (user.email = req.body.email),
        (user.profileImage = req.body.profileImage),
        (user.address = req.body.address),
        (user.city = req.body.city),
        (user.state = req.body.state),
        (user.zip = req.body.zip),
        (user.website = req.body.website),
        (user.lastUpdated = Date.now());

      user
        .save()
        .then((user) => {
          res.json(user);
        })
        .catch((err) => res.status(500).send(err.message));
    }
  });
});

router.get("/profile", verifyToken, async (req, res) => {
  //console.log(req.user)//because it got added in the 'verifyToken' middleware...
  //res.send('This is the PROTECTED user profile')
  const user = await User.findOne({ email: req.user.email });
  if (!user)
    return res.status(404).send({
      success: false,
      message: "User is not registered with this email.",
    });
  res.send({ success: true, data: user });
});

router.post("/category", async (req, res) => {
  const categoryExist = await Category.findOne({ title: req.body.title });
  if (categoryExist)
    return res
      .status(400)
      .send({ success: false, message: "Category already exists." });

  const category = new Category({
    title: req.body.title,
    description: req.body.description,
    created: Date.now(),
  });
  try {
    const savedCategory = await category.save();

    res.send({
      success: true,
      data: {
        id: savedCateogry._id,
        title: savedCategory.title,
        description: savedCategory.description,
      },
    });
  } catch (error) {
    console.log("error:", error);
    res.status(400).send({ success: false, error });
  }

  //res.send('register route.')
});

router.get("/category", async (req, res) => {
  console.log("req.body:", req.body);
  const category = await Category.find();
  console.log("category:", category);
  res.send(category);
});

router.get("/sms", async (req, res) => {
  console.log("test my sms code.");
  // Download the helper library from https://www.twilio.com/docs/node/install
  // Your Account Sid and Auth Token from twilio.com/console
  // and set the environment variables. See http://twil.io/secure
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  client.messages
    .create({
      body: "This is the ship that made the Kessel Run in fourteen parsecs?",
      from: "+17702855486",
      to: `+18122670592`,
    })
    .then((message) => console.log(message.sid))
    .catch((err) => console.log("error:", err));
});

router.post("/sms", (req, res) => {

console.log('phone sms req.body:',req.body);
console.log('req body FROM --------->>',req.body.From);

  const twiml = new MessagingResponse();
    console.log('req.body:',req.body);
    //const secret = "0592"
    const secret = process.env.SERVEWERX_SECRET_SMS;
    twiml.message(secret);
    //create a secret to respond with, save it yarn s
    //here we send the user the secret in  sms response
    // when the user submits the secret back to an endpoint that we create, 
    // compare the saved secret and the response secret. 
    // IF GOOD, forward them to 'Register' page, 
    // IF BAD, thanks try again. 


  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});
module.exports = router;
