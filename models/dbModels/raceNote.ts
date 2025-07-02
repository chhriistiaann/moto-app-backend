import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Race from "./race";
import User from "./user";

const RaceNote = db.define(
  "race_note",
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
    id_race: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Race,
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
  },
  {
    timestamps: false,
    tableName: "circuit_note",
  }
);

export default RaceNote;
