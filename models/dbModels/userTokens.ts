import { DataTypes } from "sequelize";
import db from "../../database/connection";

const UserToken = db.define(
  "user_tokens",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    tableName: "user_tokens",
  }
);

export default UserToken;
