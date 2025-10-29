import { Router } from "express";

import {
  corsMiddleware,
  jsonMiddleware,
  handleErrorMiddleware,
  publicImagesMiddleware,
} from "./middlewares";
import router from "./router";

const api = Router();

api.use(corsMiddleware);
api.use(jsonMiddleware);
api.use(publicImagesMiddleware);

api.use(router);

api.use(handleErrorMiddleware);

export default api;