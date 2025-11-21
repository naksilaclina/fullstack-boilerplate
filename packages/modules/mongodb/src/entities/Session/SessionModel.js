"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const SessionSchema_1 = __importDefault(require("./SessionSchema"));
// Create and export the model
const SessionModel = mongoose_1.default.model("Session", SessionSchema_1.default);
exports.default = SessionModel;
