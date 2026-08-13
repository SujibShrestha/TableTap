import express, { type Application, type Request, type Response } from "express";
import authRoute from "./routes/auth.route.js";
import cors from "cors";
import helmet from "helmet";
import logger from "./config/logger.js";
import morgan from "morgan";

const app:Application = express();

//  Middlewares
app.use(helmet());
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

// Routes
app.use("/api/v1/auth", authRoute);



app.get("/", (req:Request, res:Response) => {
    logger.info('Hello from TableTap!');
    res.status(200).json({
        success: true,
        message: "Server is running"
    })

});


export default app;