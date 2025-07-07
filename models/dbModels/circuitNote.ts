import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Circuit from "./circuit";
import User from "./user";
import License from "./license";
import Rider from "./rider";

const CircuitNote = db.define(
  "circuit_note",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    id_circuit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Circuit,
        key: "id",
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_rider: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Rider,
        key: "id",
      },
    },
    id_licence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: License,
        key: "id",
      },
    },
  },
  {
    timestamps: false,
    tableName: "circuit_note",
  }
);

export default CircuitNote;
