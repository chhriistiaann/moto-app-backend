import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Race from "./race";
import RoundType from "./roundType";

const Round = db.define(
  "round",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_type:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: RoundType,
            key: "id",
        },
    },
    temperature:{
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    humidity:{
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    wind:{
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    start_time:{
        type: DataTypes.DATE,
        allowNull: false,
    },
    id_race:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Race,
            key: "id",
        },
    }
  },
  {
    timestamps: false,
    tableName: "round",
  }
);

export default Round;