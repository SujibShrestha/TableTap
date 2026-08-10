import express, { type Application, type Request, type Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app:Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req:Request, res:Response) => {

    res.status(200).json({
        success: true,
        message: "Server is running"
    })

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});