import { DataTypes } from "sequelize";
import db from "../../database/connection";
import User from "./user";

const UserLicenses = db.define(
  "user_licenses",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_license:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_user:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    admin:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_modify_riders:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_manage_notes:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    start_date:{
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_date:{
        type: DataTypes.DATE,
        allowNull: true,
    }
  },
  {
    timestamps: false,
    tableName: "user_licenses",
  }
);

export default UserLicenses;