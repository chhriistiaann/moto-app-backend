import { DataTypes } from "sequelize";
import db from "../../database/connection";

const Flag = db.define(
  "flag",
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
  },
  {
    timestamps: false,
    tableName: "flag",
  }
);

export default Flag;
