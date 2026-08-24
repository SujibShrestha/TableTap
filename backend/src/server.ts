import dns from "node:dns";
import net from "node:net";
import dotenv from "dotenv";
import app from "./app.js";

dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

dotenv.config();


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});