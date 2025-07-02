import { DataTypes } from "sequelize";
import db from "../../database/connection";
import Rider from "./rider";
import Team from "./team";

const TeamHistory = db.define(
  "team_history",
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
    id_team:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Team,
            key: "id",
        },
    },
    start_date:{
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
    tableName: "team_history",
  }
);

export default TeamHistory;
