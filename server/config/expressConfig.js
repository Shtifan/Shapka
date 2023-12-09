const express = require("express");

const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const { auth } = require("../middlewares/authMiddleware");

const expressConfig = (app) => {
  app.use(express.static(path.resolve(__dirname, "../public")));
  // app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(cookieParser());
  app.use(cors());
  //app.use(auth)
};

module.exports = expressConfig;
