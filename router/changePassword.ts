import express from 'express'
import userControl from '../control/userControl'
const apiRouter = express.Router()

apiRouter.get('/changepassword', userControl.changePassword)

export default apiRouter