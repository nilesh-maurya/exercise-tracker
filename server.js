const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const shortId = require("shortid");
const cors = require("cors");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));

const User = mongoose.model("User", {
  _id: {
    type: String,
    default: shortId.generate()
  },
  username: {
    type: String,
    required: true
  }
});

const Exercise = mongoose.model(
  "Exercise",
  mongoose.Schema({
    username: String,
    userId: { type: String, ref: "User" },
    description: String,
    duration: Number,
    date: Date
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", function(req, res) {
  User.create({ username: req.body.username }, function(err, data) {
    if (err) {
      throw err;
    } else {
      res.json({ username: data.username, _id: data._id });
    }
  });
});

app.get("/api/exercise/users", function(req, res) {
  User.find({}, { _id: 1, username: 1 }, function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

app.route("/api/exercise/add").post(function(req, res) {
  req.body.date = req.body.date || new Date();
  if (!req.body.userId || !req.body.description || !req.body.duration) {
    return res.send("Must enter userId, description and duration fields");
  }

  User.findOne({ _id: req.body.userId })
    .then(user => {
      console.log(user);
      if (!user) return res.send("no user exists with that Id");
      req.body.username = user.username;
      Exercise.create(req.body).then(exercise => {
        console.log(exercise);
        res.json(exercise);
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.get("/api/exercise/log", function(req, res) {
  const userId = req.query.userId;
  const from = req.query.from;
  const to = req.query.to;
  const limit = Number(req.query.limit) || 0;
  
  if( (from && !to) || (!from && to) )
  {
    return res.send("both from and to should be provided in format (yyyy-mm-dd)");
  }
  console.log(limit);
  Exercise.find({ userId: userId }).limit(limit).then(exercises => {
    console.log(exercises);
    exercises = exercises.map(exercise => {
      const { _id, description, duration, date } = exercise;
      return { _id, description, duration, date };
    });
  
    res.json({
      _id: userId,
      username: exercises[0].username,
      count: exercises.length,
      log: exercises
    });
  }).catch(err => {
    console.log(err);
  })
  
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
