import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOrigins } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { borrowerRouter } from "./modules/borrowers/borrower.routes";
import { loanRouter } from "./modules/loans/loan.routes";
import { paymentRouter } from "./modules/payments/payment.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (corsOrigins.includes(origin) || isLocalDevOrigin) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  return res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/borrowers", borrowerRouter);
app.use("/api/loans", loanRouter);
app.use("/api/payments", paymentRouter);

app.use(errorHandler);
