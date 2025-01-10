const express = require("express");
const routes = express.Router();
const attachModels = require("../middlewares/attachModels");

const authRouter = require("./auth");
const migrationRouter = require("./migration");

const applicationApiPrefix = "/api";

routes.use(`${applicationApiPrefix}/auth`,attachModels, authRouter);
routes.use(`${applicationApiPrefix}/migration`,attachModels, migrationRouter);


module.exports = routes;