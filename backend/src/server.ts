import dns from "node:dns";
import net from "node:net";
import http from "node:http";
import dotenv from "dotenv";
import app from "./app.js";
import { initSocket } from "./utils/socket.js";

dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

dotenv.config();

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});