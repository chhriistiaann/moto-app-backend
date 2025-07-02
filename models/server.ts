import express, { Application } from "express";
import cors from "cors";

import db from "../database/connection";
import {
  decryptRequestMiddleware,
  encryptResponseMiddleware,
} from "../middlewares/encryptMiddleware";


class Server {
  private app: Application;
  private port: string;
  private apiPaths = {
    license: "/api/license",
    restaurant: "/api/restaurant",
    user: "/api/user",
    timesheet: "/api/timesheet",
    schedule: "/api/schedule",
    booking: "/api/booking",
    inventory: "/api/inventory",
    product: "/api/product",
    productIngredient: "/api/productIngredient",
    order: "/api/order",
    deliveryOrders: "/api/deliveryOrders",
    orderProductRoutes: "/api/orderProduct",
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
    // this.app.use(this.apiPaths.license, licenseRoutes);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server running  on port ${this.port}`);
    });
  }
}

export default Server;
