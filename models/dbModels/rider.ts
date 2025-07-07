import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Flag from "./flag";
import LicensedRiders from "./licensedRiders";

const Rider = db.define(
  "rider",
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
    birth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    place_of_birth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_flag: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Flag,
        key: "id",
      },
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tiktok: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "rider",
  }
);


export default Rider;
