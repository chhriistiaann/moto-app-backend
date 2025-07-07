import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Category from "./category";
import Rider from "./rider";

const CategoryHistory = db.define(
  "category_history",
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
    id_category: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "category_history",
  }
);



export default CategoryHistory;
