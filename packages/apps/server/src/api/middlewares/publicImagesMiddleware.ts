import express from "express";
import path from "path";

const publicImagesMiddleware = express.static(
  path.join(__dirname, "..", "public")
);
console.log(path.join(__dirname, "..", "public"));

export default publicImagesMiddleware;
