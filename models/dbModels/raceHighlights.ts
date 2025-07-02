import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Race from "./race";

const RaceHighlights = db.define(
  "race_highlights",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_race: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Race,
        key: "id",
      },
    },
  },
  {
    timestamps: false,
    tableName: "race_highlights",
  }
);

export default RaceHighlights;
