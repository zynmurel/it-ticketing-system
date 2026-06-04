"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 4000;
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use("/auth", auth_1.default);
app.use("/tickets", tickets_1.default);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
