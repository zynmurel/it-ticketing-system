import "./types/express";
import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import ticketRoutes from "./routes/tickets";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
