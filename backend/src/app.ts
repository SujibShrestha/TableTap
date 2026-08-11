import express, { type Application, type Request, type Response } from "express";
import authRoute from "./routes/auth.route.js";


const app:Application = express();

//  Middlewares

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/v1/auth", authRoute);



app.get("/", (req:Request, res:Response) => {

    res.status(200).json({
        success: true,
        message: "Server is running"
    })

});


export default app;