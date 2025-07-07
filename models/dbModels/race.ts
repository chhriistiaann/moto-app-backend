import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Circuit from "./circuit";
import Seasson from "./seasson";

const Race = db.define(
  "race",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_circuit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Circuit,
        key: "id",
      },
    },
    day: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    id_seasson: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Seasson,
        key: "id",
      },
    },
  },
  {
    timestamps: false,
    tableName: "race",
  }
);



export default Race;
