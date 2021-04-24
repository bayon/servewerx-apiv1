const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const verifyToken = require("./routes/verifyToken");

app.use(express.static("./public"));
app.use("/public/images", express.static(__dirname + "/public/images/"));

var currentImageName = null;
var currentPostImageName = null;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//check process.env
require("dotenv").config({ path: ".env" });
app.use(cors());
//Stripe Dependencies:
const stripe = require("stripe")(
  "sk_test_51DxDsuKxNNqNmAYUC2HgNDaYbb3wgKg5yqr8MFcsygJVmxtPCDFkNyVUB2YMfQgO4rLublkoQ9la38gGx72BDKdH00s8eLiOjP"
);
const bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

//ROUTES:
app.use("/api/users/", authRoutes);
app.use("/api/posts/", postRoutes);

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

  res.send({"success":true,"data": req.body});
});
app.get("/jacky", (req, res) => {
  console.log("req.body:", req.body);
  res.send({"success":true,"data": req.body});

  //res.send("welcome to the jacky system.");
});
app.post("/jacky", (req, res) => {
  console.log("req.body:", req.body);
  res.send({"success":true,"data": req.body});

  //res.send("welcome to the jacky system.");
});

app.post("/api/test", async (req, res) => {
  console.log("req.body:", req.body);
  res.send(200);
});

// // IMAGE UPLOADING ---------------------------------------
// var multer = require("multer");
// var storage = multer.diskStorage({
//   destination: "./public/images",
//   filename: function (req, file, cb) {
//     console.log('req.body 3:',req.body)

//     const _id = req.body._id;
//      currentImageName = _id+ "-" + file.originalname;
//     cb(null, _id + "-" + file.originalname);
//   },
// });

// var upload = multer({ storage: storage }).array("file");
app.post("/api/uploadUserImage", function (req, res) {
  // USER IMAGE UPLOADING ---------------------------------------
  var multer = require("multer");
  var storage = multer.diskStorage({
    destination: "./public/images",
    filename: function (req, file, cb) {
      console.log("req.body 3:", req.body);

      const _id = req.body._id;
      currentImageName = _id + "-" + file.originalname;
      cb(null, _id + "-" + file.originalname);
    },
  });
  var upload = multer({ storage: storage }).array("file");

  console.log("1-req.body:", req.body);
  upload(req, res, function (err) {
    console.log("currentImageName:", currentImageName);
    console.log("req.body 2:", req.body);

    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    return res.status(200).send(currentImageName);
  });
});

app.post("/api/uploadPostImage", function (req, res) {
  // USER IMAGE UPLOADING ---------------------------------------
  var multer = require("multer");
  var storage = multer.diskStorage({
    destination: "./public/images/posts",
    filename: function (req, file, cb) {
      console.log("req.body 3:", req.body);

      const postId = req.body.id; // was postId: should solve the undefined value in image file name....
      console.log("POST ID: sent to server: ",postId)
      currentPostImageName = postId + "-" + file.originalname;
      cb(null, postId + "-" + file.originalname);
    },
  });
  var upload = multer({ storage: storage }).array("file");

  console.log("2-req.body:", req.body);
  upload(req, res, function (err) {
    console.log("currentPostImageName:", currentPostImageName);
    console.log("req.body 3:", req.body);

    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    return res.status(200).send(currentPostImageName);
  });
});

//------------------------------------------------------------

// Stripe Functions:
// stripe payments    https://www.youtube.com/watch?v=JkSgXgqRH6k

app.post("/api/pay", async (req, res) => {
  const { email } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 5000,
    currency: "usd",
    // Verify your integration in this guide by including this parameter
    metadata: { integration_check: "accept_a_payment" },
    receipt_email: email,
  });

  res.json({ client_secret: paymentIntent["client_secret"] });
});

app.post("/api/sub", async (req, res) => {
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
