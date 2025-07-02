import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Rider from "./rider";
import Round from "./round";

const Lap = db.define(
  "lap",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_rider: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Rider,
        key: "id",
      },
    },
    id_round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Round,
        key: "id",
      },
    },
    lap_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sector1: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sector2: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sector3: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sector4: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    top_speed: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "lap",
  }
);

export default Lap;
