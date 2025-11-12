/* eslint-disable import/first */
// Environment variables are already loaded by the parent process

import "../src/moduleAliases";
import App from "../src/App";

const app = new App();

app.start().catch((err) => {
  console.error(err);
});