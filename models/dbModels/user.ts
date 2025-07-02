import { DataTypes } from "sequelize";
import db from "../../database/connection";

const User = db.define(
  "user",
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
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    auth_token:{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    notification_token:{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    }
  },
  {
    timestamps: false,
    tableName: "user",
  }
);

export default User;