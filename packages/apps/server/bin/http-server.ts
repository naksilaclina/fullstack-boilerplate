/* eslint-disable import/first */
require("dotenv").config(); // eslint-disable-line

import "../src/moduleAliases";
import App from "../src/App";

const app = new App();

app.start().catch((err) => {
  console.error(err);
});