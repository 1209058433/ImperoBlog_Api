import express from "express";
import userControl from "../control/userControl.js";

const apiRouter = express.Router()
apiRouter.get('/changepersonalintroduce', userControl.changePersonalIntroduce)

export default apiRouter

//