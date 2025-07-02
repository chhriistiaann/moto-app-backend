import { DataTypes } from "sequelize";
import db from "../../database/connection";

const RoundType = db.define(
  "round_type",
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
  },
  {
    timestamps: false,
    tableName: "round_type",
  }
);

export default RoundType;