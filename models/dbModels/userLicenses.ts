import { DataTypes } from "sequelize";
import db from "../../database/connection";
import User from "./user";
import License from "./license";

const UserLicenses = db.define(
  "user_licences",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_licence:{
        type: DataTypes.INTEGER,
        references: {
            model: License,
            key: 'id'
        }
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
    tableName: "user_licences",
  }
);



export default UserLicenses;