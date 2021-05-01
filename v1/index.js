const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const verifyToken = require("./routes/verifyToken");

//for digital ocean spaces access:
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
//-------------------
//const multer = require('multer')
const sharp = require('sharp')
const storage = require('./upload-config')
const upload = multer(storage)
const path = require('path')
const fs = require('fs')

//------------------
app.use(express.static("./public"));
//app.use("/public/images", express.static(__dirname + "/public/images/"));

var currentImageName = null;
var currentPostImageName = null;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//check process.env
require("dotenv").config({ path: ".env" });
app.use(cors());
//Stripe Dependencies:
const stripe = require("stripe")(
  "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"
);
const bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());


// NOTE: every endpoint in this index.js file has a 'prefix' of 'api' already set.
//ROUTES:
app.use("/users/", authRoutes);
app.use("/posts/", postRoutes);
// app.use("/api/users/", authRoutes);
// app.use("/api/posts/", postRoutes);
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASS}@cluster0.mputo.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("server is running on port .");
    });
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("welcome to the auth system.");
});
app.get("/jack", (req, res) => {
  console.log("req.body:", req.body);

  res.send({ success: true, data: req.body });
});
app.get("/jacky", (req, res) => {
  console.log("req.body:", req.body);
  res.send({ success: true, data: req.body });

  //res.send("welcome to the jacky system.");
});
app.post("/jacky", (req, res) => {
  console.log("req.body:", req.body);
  res.send({ success: true, data: req.body });

  //res.send("welcome to the jacky system.");
});

app.post("/test", async (req, res) => {
  console.log("req.body:", req.body);
  res.send(200);
});

// app.post("/ONHOLD/uploadUserImage", function (req, res) {
//   // USER IMAGE UPLOADING ---------------------------------------
//   var multer = require("multer");
//   var storage = multer.diskStorage({
//     destination: "./public/images",
//     filename: function (req, file, cb) {
//       console.log("req.body 3:", req.body);

//       const _id = req.body._id;
//       currentImageName = _id + "-" + file.originalname;
//       cb(null, _id + "-" + file.originalname);
//     },
//   });
//   var upload = multer({ storage: storage }).array("file");

//   console.log("1-req.body:", req.body);
//   upload(req, res, function (err) {
//     console.log("currentImageName:", currentImageName);
//     console.log("req.body 2:", req.body);

//     if (err instanceof multer.MulterError) {
//       return res.status(500).json(err);
//     } else if (err) {
//       return res.status(500).json(err);
//     }

//     return res.status(200).send(currentImageName);
//   });
// });


// app.post("/uploadPostImage/DEPRECATED", function (req, res) {
//   // USER IMAGE UPLOADING ---------------------------------------
//   var multer = require("multer");
//   var storage = multer.diskStorage({
//     destination: "./public/images/posts",
//     filename: function (req, file, cb) {
//       console.log("req.body 3:", req.body);

//       const postId = req.body.id; // was postId: should solve the undefined value in image file name....
//       console.log("POST ID: sent to server: ", postId);
//       currentPostImageName = postId + "-" + file.originalname;
//       cb(null, postId + "-" + file.originalname);
//     },
//   });
//   var upload = multer({ storage: storage }).array("file");

//   console.log("2-req.body:", req.body);
//   upload(req, res, function (err) {
//     console.log("currentPostImageName:", currentPostImageName);
//     console.log("req.body 3:", req.body);

//     if (err instanceof multer.MulterError) {
//       return res.status(500).json(err);
//     } else if (err) {
//       return res.status(500).json(err);
//     }

//     return res.status(200).send(currentPostImageName);
//   });
// });

//------------------------------------------------------------

// Stripe Functions:
// stripe payments    https://www.youtube.com/watch?v=JkSgXgqRH6k

app.post("/pay", async (req, res) => {
  const { email } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100,
    currency: "usd",
    // Verify your integration in this guide by including this parameter
    metadata: { integration_check: "accept_a_payment" },
    receipt_email: email,
  });

  res.json({ client_secret: paymentIntent["client_secret"] });
});

app.post("/sub", async (req, res) => {
  const { email, payment_method } = req.body;

  const customer = await stripe.customers.create({
    payment_method: payment_method,
    email: email,
    invoice_settings: {
      default_payment_method: payment_method,
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan: "price_1Id0ALKxNNqNmAYUMBHI3bfX" }],
    expand: ["latest_invoice.payment_intent"],
  });

  const status = subscription["latest_invoice"]["payment_intent"]["status"];
  const client_secret =
    subscription["latest_invoice"]["payment_intent"]["client_secret"];

  res.json({ client_secret: client_secret, status: status });
});

/*
TO GO: 
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');

const spacesEndpoint = new aws.Endpoint("nyc3.digitaloceanspaces.com");
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
});
// Change bucket property to your Space name
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "servewerx-space-1",
    acl: "public-read",
    key: function (request, file, cb) {
      console.log(file);
      cb(null, file.originalname);
    },
  }),
}).array("upload", 1);
*/

app.post("/uploadUserImage", function (req, res) {
  console.log("api image upload: spot 1");
  console.log("req.body:", req.body);

  const aws = require("aws-sdk");
  const multer = require("multer");
  const multerS3 = require("multer-s3");
  const spacesEndpoint = new aws.Endpoint("nyc3.digitaloceanspaces.com");
  const s3 = new aws.S3({
    endpoint: spacesEndpoint,
    accessKeyId:'HAEFYFNNHKJKKG2JVKTX' ,
    secretAccessKey:'PIw8/1AZiPosqVtTCMdzRTlKES2wLOt8jdWdDkGLjLA'
  });
  console.log("api image upload: spot 2");
  // Change bucket property to your Space name
  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: "servewerx-space-1",
      acl: "public-read",
      key: function (request, file, cb) {
        console.log(file);
               const _id = req.body._id;
       currentImageName = _id + "-" + file.originalname;
       cb(null, _id + "-" + file.originalname);
       // cb(null, file.originalname);
      },
    }),
  }).array("file", 1); // "upload" from space example....name of html input element

  console.log("api image upload: spot 3");

  upload(req, res, function (err) {
    console.log("api image upload: spot 4");

    if (err) {
      console.log(err);
      //return response.redirect("/error");
      return res.status(500).json(err);
    }
    console.log("File uploaded successfully.");
    //response.redirect("/success");
    return res.status(200).send(currentImageName);
  });
 
});



app.post("/uploadPostImageOLD", function (req, res) {
  console.log("api image upload: spot 1");
  console.log("req.body:", req.body);

  const aws = require("aws-sdk");
  const multer = require("multer");
  const multerS3 = require("multer-s3");
  const spacesEndpoint = new aws.Endpoint("nyc3.digitaloceanspaces.com");
  const s3 = new aws.S3({
    endpoint: spacesEndpoint,
    accessKeyId:'HAEFYFNNHKJKKG2JVKTX' ,
    secretAccessKey:'PIw8/1AZiPosqVtTCMdzRTlKES2wLOt8jdWdDkGLjLA'
  });
  console.log("api image upload: spot 2");
  // Change bucket property to your Space name
  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: "servewerx-space-1",
      acl: "public-read",
      key: function (request, file, cb) {
        console.log(file);
        const postId = req.body.id;
        currentPostImageName = postId + "-" + file.originalname;
        cb(null, postId + "-" + file.originalname);
      },
    }),
  }).array("file", 1); // "upload" from space example....name of html input element


  upload(req, res, function (err) {

    if (err) {
      console.log(err);
      //return response.redirect("/error");
      return res.status(500).json(err);
    }
    console.log("File uploaded successfully.");
    //response.redirect("/success");
    return res.status(200).send(currentPostImageName);
  });
 
});
 //--------------

 //const aws = require("aws-sdk");
 //const multer = require("multer");
 //const multerS3 = require("multer-s3");
 const spacesEndpoint = new aws.Endpoint("nyc3.digitaloceanspaces.com");
 const s3 = new aws.S3({
   endpoint: spacesEndpoint,
   accessKeyId:'HAEFYFNNHKJKKG2JVKTX' ,
   secretAccessKey:'PIw8/1AZiPosqVtTCMdzRTlKES2wLOt8jdWdDkGLjLA'
 });
 console.log("api image upload: spot 2");
 // Change bucket property to your Space name
 const uploadSharp = multer({
   storage: multerS3({
     s3: s3,
     bucket: "servewerx-space-1",
     acl: "public-read",
     key: function (request, file, cb) {
       console.log(file);
       const postId = req.body.id;
       currentPostImageName = postId + "-" + file.originalname;
       cb(null, postId + "-" + file.originalname);
     },
   }),
 }).array("file", 1); // "upload" from space example....name of html input element





app.post('/uploadPostImage',upload.single('file') ,async (req, res) => {
  const { filename: image } = req.file 

  await sharp(req.file.path)
   .resize(500)
   .jpeg({quality: 50})
   .toFile(
       path.resolve(req.file.destination,'resized',image)
   )

   uploadSharp(req, res, function (err) {

    if (err) {
      console.log(err);
      //return response.redirect("/error");
      return res.status(500).json(err);
    }
    console.log("File uploaded successfully.");
    //response.redirect("/success");
    fs.unlinkSync(req.file.path)
    return res.status(200).send(currentPostImageName);
  });


  // fs.unlinkSync(req.file.path)

   //return res.send('SUCCESS!')
})

/*
sharp(input)
  .resize({ width: 100 })
  .toBuffer()
  .then(data => {
    // 100 pixels wide, auto-scaled height
  });
*/