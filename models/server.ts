import express, { Application } from "express";
import cors from "cors";

import db from "../database/connection";
import {
  decryptRequestMiddleware,
  encryptResponseMiddleware,
} from "../middlewares/encryptMiddleware";
import userRoutes from "../routes/userRoutes";
import licenceRoutes from "../routes/licenceRoutes";
import riderRoutes from "../routes/riderRoutes";
import raceRoutes from "../routes/raceRoutes";
import rankRoutes from "../routes/rankRoutes";
import circuitRoutes from "../routes/circuitRoutes";
import comparationRoutes from "../routes/comparationRoutes";
import "../models/associations";

class Server {
  private app: Application;
  private port: string;
  private apiPaths = {
    user: "/api/user",
    licence: "/api/licence",
    rider: "/api/rider",
    race: "/api/race",
    rank: "/api/rank",
    circuit: "/api/circuit",
    comparation: "/api/comparation",
  };

  constructor() {
    this.app = express();
    this.port = process.env.PORT || "8000";

    this.dbConnection();
    this.middlewares();

    this.routes();
  }

  async dbConnection() {
    try {
      await db.authenticate();
      console.log("Database online");
      await db.sync({ force: false });
      console.log("Base de datos conectada y tablas sincronizadas");
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  middlewares() {
    this.app.use(cors());

    this.app.use(express.json({ limit: "50mb" }));

    this.app.use(encryptResponseMiddleware);
    this.app.use(decryptRequestMiddleware);
  }

  routes() {
    this.app.use(this.apiPaths.user, userRoutes);
    this.app.use(this.apiPaths.licence, licenceRoutes);
    this.app.use(this.apiPaths.rider, riderRoutes);
    this.app.use(this.apiPaths.race, raceRoutes);
    this.app.use(this.apiPaths.rank, rankRoutes);
    this.app.use(this.apiPaths.circuit, circuitRoutes);
    this.app.use(this.apiPaths.comparation, comparationRoutes);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server running  on port ${this.port}`);
    });
  }
}

export default Server;
