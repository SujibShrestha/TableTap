import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./config/logger.js";
import morgan from "morgan";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import tableRoute from "./routes/table.route.js";
import uploadRoute from "./routes/upload.route.js";
import categoryRoute from "./routes/category.route.js";
import menuRoute from "./routes/menu.route.js";
import orderRoute from "./routes/order.route.js";
import paymentRoute from "./routes/payment.route.js";
import analyticsRoute from "./routes/analytics.route.js";


const app:Application = express();


  //  Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/tables", tableRoute);
app.use("/api/v1/upload", uploadRoute);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/menu", menuRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/analytics", analyticsRoute);


app.get("/", (req:Request, res:Response) => {
    res.status(200).json({
        success: true,
        message: "Server is running"
    })
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ success: false, message: "Internal server error" });
});


export default app;