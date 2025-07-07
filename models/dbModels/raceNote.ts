import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Race from "./race";
import User from "./user";
import Rider from "./rider";
import License from "./license";

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
    tableName: "race_note",
  }
);

export default RaceNote;
