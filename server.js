const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const shortId = require("shortid");
const cors = require("cors");

const mongoose = require("mongoose");
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
