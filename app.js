const dotenv = require("dotenv");
dotenv.config();

const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { StatusCodes, ReasonPhrases } = require("http-status-codes");


const connectDB = require("./config/mongo");
const { PORT } = require("./constants/envConstants");
const logger = require("./logger/logger");
const routes = require("./routes/main");
const app = express();

async function initializeApp() {
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(routes);
  // Database Connection
  connectDB();

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    logger.warn(
      `404 NOTFOUND Warning: URL: ${req.protocol}://${req.get("host")}${
        req.originalUrl
      }`
    );
    next(createError(StatusCodes.NOT_FOUND));
  });

  // error handler
  app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err?.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res
      .status(err?.status ?? StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err?.message ?? ReasonPhrases.INTERNAL_SERVER_ERROR });
    logger.error(
      `URL: ${req.protocol}://${req.get("host")}${
        req.originalUrl
      }, Error: ${err}`
    );
  });
  return app;
}
module.exports = { app, initializeApp };