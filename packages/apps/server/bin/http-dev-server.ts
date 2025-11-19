/* eslint-disable import/first */
// Load environment variables from root .env file
const path = require("path");
const dotenv = require("dotenv");
const envPath = path.join(__dirname, "../../../../.env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath }); // eslint-disable-line

import "../src/moduleAliases";
import App from "../src/App";

const app = new App();

app.start().catch((err) => {
  console.error(err);
});