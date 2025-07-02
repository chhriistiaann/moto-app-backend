import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Category from "./category";

const Seasson = db.define(
  "seasson",
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
    start_date:{
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    id_category:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Category,
            key: "id",
        },
    }
  },
  {
    timestamps: false,
    tableName: "seasson",
  }
);

export default Seasson;