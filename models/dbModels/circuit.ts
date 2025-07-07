import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Flag from "./flag";

const Circuit = db.define(
  "circuit",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    silueta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_flag: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Flag,
        key: "id",
      },
    },
    distance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    laps: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "circuit",
  }
);


export default Circuit;
