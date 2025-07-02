import { DataTypes } from "sequelize";
import db from "../../database/connection";
import License from "./license";
import Rider from "./rider";

const LicensedRiders = db.define(
  "licensed_riders",
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
    id_license: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: License,
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
    tableName: "licensed_riders",
  }
);

export default LicensedRiders;
