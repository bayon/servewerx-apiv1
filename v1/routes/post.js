const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const verifyToken = require("./verifyToken");
const { check, validationResult } = require("express-validator");

router.get("/", (req, res) => {
  res.send("post route blank...");
});

//CREATE
const validatePost = [
  check("email").isEmail().withMessage("provide a valid email"),
  check("title").isLength({ min: 2 }).withMessage("title is required"),
];
// TODO: ^ validate other post fields.
/*
    POST FIELDS as of 4/11/2021
    userId: { type: String, required: true},
    postType: { type: String, required: true},
    title: {type:String , required:true},
    description: {type: String, required: true},
    email: { type: String, required: true},
    phone: { type: String} ,
    postImage: { type: String },  
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    website: { type: String }
*/




router.post("/create", validatePost, async (req, res) => {
  console.log("CREATE POST ENDPOINT: req.body:", req.body);
  //check validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  //prevent duplicate post
  const postExist = await Post.findOne({ userId: req.body._id });
  if (postExist)
    return res
      .status(400)
      .send({ success: false, message: "Email already exists." });
      var ts = new Date();
      console.log(ts.toISOString());
      //# %2021-04-21T21:09:41+02:00
      var now = ts.toISOString();
  const post = new Post({
    userId: req.body.userId,
    title: req.body.title,
    activated:"1",
    description: req.body.description,
    category: req.body.category,
    postType: req.body.postType,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    website: req.body.website,
    postImage: req.body.postImage,
    dateCreated: now,
  });
  try {
    const savedPost = await post.save();
    res.send({
      success: true,
      data: {
        id: savedPost._id,
        userId: savedPost.userId,
        title: savedPost.title,
        description: savedPost.description,
        category: savedPost.category,
        postType: savedPost.postType,
        email: savedPost.email,
        phone: savedPost.phone,
        address: savedPost.address,
        city: savedPost.city,
        state: savedPost.state,
        zip: savedPost.zip,
        website: savedPost.website,
        postImage: savedPost.postImage,
        dateCreated: savedPost.dateCreated,
      },
    });
  } catch (error) {
    console.log("error:", error);
    res.status(400).send({ success: false, error });
  }
});

//endpoint is actually API_HOST/api/posts/posts
// router.get('/posts',async  (req,res) => {
//    // TO BE DEPRECATED : use /user/posts  instead.
//     const post = await Post.find();
//     console.log('post:',post);
//     res.send(post)

// } )

router.post("/user/posts", async (req, res) => {
  console.log("user posts: req.body:", req.body);
  const key = req.body.key;
  const posts = await Post.find({
    $or: [{ userId: `${key}` }],
  });
  console.log("filter .....posts:", posts);
  res.send(posts);

  //  const post = await Post.find();
  //  console.log('post:',post);
  //  res.send(post)
});

router.get("/site/posts", async (req, res) => {

// FIND all where dateCreated is greater than one month ago today. 
  var d = new Date();
  // Set it to one month ago
  d.setMonth(d.getMonth() - 1);
 let isoDateMonthAgo = d.toISOString();
  //console.log('isoDateMonthAgo:',isoDateMonthAgo)

  const post = await Post.find({dateCreated: {$gt:isoDateMonthAgo}});
  console.log("post:", post);
  res.send(post);
});

router.post("/filter", async (req, res) => {
  const key = req.body.key;
  const post = await Post.find(
   
    //or description ? 
     { $or: [          {title: new RegExp(key, 'i')}  ,       {description: new RegExp(key, 'i')}         ] } 
    
 );
 console.log('filter .....posts:',post);
 res.send(post)
}); // NEXT: make sure only BY USER ID and regex.


router.post("/filterOwners", async (req, res) => {
  console.log("API filterOwners: req.body:",req.body)
  const key = req.body.key;
  const userId = req.body.userId;
  console.log('key and userId:',key,userId)
  const post = await Post.find(
    { title: new RegExp(key, 'i'), userId: userId }
 );
 console.log('filter .....posts:',post);
 res.send(post)
}); 

router.put("/update", async (req, res) => {
  //thanks: https://www.youtube.com/watch?v=bRRA-SrNyxg
  console.log("api -- update ... req.body:", req.body);
  const postId = req.body.id;
 


  var ts = new Date();
  var now = ts.toISOString();


  Post.findById(postId, (err, post) => {
    if (!post) {
      res.status(404).send("Post record not found");
    } else {
      console.log("post:", post);
      (post.id = req.body.id),
      (post.userId = req.body.userId),
        (post.title = req.body.title),
        (post.description = req.body.description),
        (post.category = req.body.category),
        (post.postType = req.body.postType),
        (post.phone = req.body.phone),
        (post.email = req.body.email),
        (post.postImage = req.body.postImage),
        (post.address = req.body.address),
        (post.city = req.body.city),
        (post.state = req.body.state),
        (post.zip = req.body.zip),
        (post.website = req.body.website),
        (post.activated = req.body.activated),
        (post.lastUpdated = now);

      post
        .save()
        .then((post) => {
          res.status(200).send({
            success: true,
            post: post,
          });
        })
        .catch((err) => res.status(404).send(err.message));
    }
  });
});


router.put("/updateCreating", async (req, res) => {
  //thanks: https://www.youtube.com/watch?v=bRRA-SrNyxg
  console.log("api -- update creating post... req.body:", req.body);
  const postId = req.body.id;
  var ts = new Date();
  var now = ts.toISOString();
 
  Post.findById(postId, (err, post) => {
    if (!post) {
      res.status(404).send("Post record not found");
    } else {
      console.log("post:", post);
      (post.id = req.body.id),
      (post.userId = req.body.userId),
        (post.title = req.body.title),
        (post.description = req.body.description),
        (post.category = req.body.category),
        (post.postType = req.body.postType),
        (post.phone = req.body.phone),
        (post.email = req.body.email),
        (post.postImage = req.body.postImage),
        (post.address = req.body.address),
        (post.city = req.body.city),
        (post.state = req.body.state),
        (post.zip = req.body.zip),
        (post.website = req.body.website),
        (post.activated = req.body.activated),
        (post.lastUpdated = now);

      post
        .save()
        .then((post) => {
          res.status(200).send({
            success: true,
            post: post,
          });
        })
        .catch((err) => res.status(404).send(err.message));
    }
  });
});




router.get("/post", verifyToken, async (req, res) => {
  //console.log(req.post)//because it got added in the 'verifyToken' middleware...
  //res.send('This is the PROTECTED post profile')
  console.log("req.body:", req.body);
  //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const post = await Post.findOne({ email: req.user.email });
  if (!post)
    return res.status(200).send({
      success: false,
      message: "Post is not registered with this email.",
    });
  res.send({ success: true, data: post });
});

router.post("/delete", async (req, res) => {
  console.log("API delete post: req.body:",req.body)
  const key = req.body.key;
 await Post.remove({_id: key});

  //res.json({"message":"Successfully Deleted Post"})
  res.status(200).send({ success: true, message:"Successfully Deleted Post" });
}); 


router.post("/initPost", async (req, res) => {
  console.log("API initPost: req.body:",req.body)
  
 //console.log('filter .....posts:',post);
 res.status(200).send({success: true, message:"init post creation."})
}); 


router.post("/acceptPost", async (req, res) => {
  const key = req.body.key;
  const userId = req.body.userId;
  console.log('key and userId:',key,userId)
  const post = await Post.find(
    { _id:  key }
 );
 //console.log('filter .....posts:',post);
 res.status(200).send({success: true, post:post})
}); 

router.post("/cancelPost", async (req, res) => {
  const key = req.body.key;
  
  await Post.remove({_id: key});
  res.status(200).send({ success: true, message:"Successfully canceled Post creation. REALLY, need to delete image file if exists." });
  
 //console.log('filter .....posts:',post);
}); 

router.post("/clearPost", async (req, res) => {
  console.log("API clearPost: req.body:",req.body)
    
 res.status(200).send({success: true, message:"cleared all post vars."})
}); 


router.post("/proximity", async (req, res) => {
  console.log("user posts: req.body:", req.body);
  const arrayOfZips = req.body.arrayOfZips ;
 


  const posts = await Post.find( { zip: { $in: arrayOfZips } } );
  console.log("proximity .....posts:", posts);
  res.send(posts);
  

 
});

////////////====================================
// const validateCategory = [
//   check("description").withMessage("provide a description"),
//   check("title").isLength({ min: 2 }).withMessage("title is required"),
// ];

// router.post("/createCategory", validateCategory, async (req, res) => {
//   console.log("CREATE CATEGORY ENDPOINT: req.body:", req.body);
//   //check validation
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(422).json({ errors: errors.array() });
//   }
//   //prevent duplicate post
//   const categoryExist = await Category.findOne({ title: req.body.title });
//   if (categoryExist)
//     return res
//       .status(400)
//       .send({ success: false, message: "category already exists." });

//   const category = new Category({
//     title: req.body.title,
//     description: req.body.description,
    
//   });
//   try {
//     const savedCategory = await category.save();
//     res.send({
//       success: true,
//       data: {
//         title: savedCategory.title,
//         description: savedCategory.description,
//       },
//     });
//   } catch (error) {
//     console.log("error:", error);
//     res.status(400).send({ success: false, error });
//   }
// });




//================================================

module.exports = router;
