import Category from "./dbModels/category";
import CategoryHistory from "./dbModels/categoryHistory";
import Circuit from "./dbModels/circuit";
import CircuitNote from "./dbModels/circuitNote";
import Flag from "./dbModels/flag";
import Lap from "./dbModels/lap";
import License from "./dbModels/license";
import LicensedRiders from "./dbModels/licensedRiders";
import ManufacturerHistory from "./dbModels/manufacturerHistory";
import NumberHistory from "./dbModels/numberHistory";
import Race from "./dbModels/race";
import RaceHighlights from "./dbModels/raceHighlights";
import RaceNote from "./dbModels/raceNote";
import Rider from "./dbModels/rider";
import Round from "./dbModels/round";
import RoundType from "./dbModels/roundType";
import Seasson from "./dbModels/seasson";
import Team from "./dbModels/team";
import TeamHistory from "./dbModels/teamHistory";
import User from "./dbModels/user";
import UserLicenses from "./dbModels/userLicenses";
import UserToken from "./dbModels/userTokens";
// Relaciones Rider
Rider.belongsTo(Flag, { foreignKey: "id_flag" });
Flag.hasMany(Rider, { foreignKey: "id_flag" });

Rider.hasMany(LicensedRiders, { foreignKey: "id_rider" });
LicensedRiders.belongsTo(Rider, { foreignKey: "id_rider" });

Rider.hasMany(TeamHistory, { foreignKey: "id_rider" });
TeamHistory.belongsTo(Rider, { foreignKey: "id_rider" });

Rider.hasMany(ManufacturerHistory, { foreignKey: "id_rider" });
ManufacturerHistory.belongsTo(Rider, { foreignKey: "id_rider" });

Rider.hasMany(NumberHistory, { foreignKey: "id_rider" });
NumberHistory.belongsTo(Rider, { foreignKey: "id_rider" });

Rider.hasMany(Lap, { foreignKey: "id_rider" });
Lap.belongsTo(Rider, { foreignKey: "id_rider" });

Rider.hasMany(CategoryHistory, { foreignKey: "id_rider" });
CategoryHistory.belongsTo(Rider, { foreignKey: "id_rider" });

// Relaciones LicensedRiders
LicensedRiders.belongsTo(License, { foreignKey: "id_license" });
License.hasMany(LicensedRiders, { foreignKey: "id_license" });

// Relaciones UserLicenses
UserLicenses.belongsTo(User, { foreignKey: "id_user" });
User.hasMany(UserLicenses, { foreignKey: "id_user" });

UserLicenses.belongsTo(License, { foreignKey: "id_licence" });
License.hasMany(UserLicenses, { foreignKey: "id_licence" });

// Relaciones User
User.belongsTo(UserToken, { foreignKey: "id_auth_token" });
UserToken.hasOne(User, { foreignKey: "id_auth_token" });

User.hasMany(RaceNote, { foreignKey: "id_user" });
RaceNote.belongsTo(User, { foreignKey: "id_user" });

User.hasMany(CircuitNote, { foreignKey: "id_user" });
CircuitNote.belongsTo(User, { foreignKey: "id_user" });

// Relaciones TeamHistory
TeamHistory.belongsTo(Team, { foreignKey: "id_team" });
Team.hasMany(TeamHistory, { foreignKey: "id_team" });

// Relaciones Seasson
Seasson.belongsTo(Category, { foreignKey: "id_category" });
Category.hasMany(Seasson, { foreignKey: "id_category" });

// Relaciones Round
Round.belongsTo(RoundType, { foreignKey: "id_type" });
RoundType.hasMany(Round, { foreignKey: "id_type" });

Round.belongsTo(Race, { foreignKey: "id_race" });
Race.hasMany(Round, { foreignKey: "id_race" });

// Relaciones RaceNote
RaceNote.belongsTo(Race, { foreignKey: "id_race" });
Race.hasMany(RaceNote, { foreignKey: "id_race" });

// Relaciones RaceHighlights
RaceHighlights.belongsTo(Race, { foreignKey: "id_race" });
Race.hasMany(RaceHighlights, { foreignKey: "id_race" });

// Relaciones Race
Race.belongsTo(Circuit, { foreignKey: "id_circuit" });
Circuit.hasMany(Race, { foreignKey: "id_circuit" });

Race.belongsTo(Seasson, { foreignKey: "id_seasson" });
Seasson.hasMany(Race, { foreignKey: "id_seasson" });

// Relaciones License
License.belongsTo(Team, { foreignKey: "id_team" });
Team.hasMany(License, { foreignKey: "id_team" });

License.belongsTo(Category, { foreignKey: "id_category" });
Category.hasMany(License, { foreignKey: "id_category" });

// Relaciones Lap
Lap.belongsTo(Round, { foreignKey: "id_round" });
Round.hasMany(Lap, { foreignKey: "id_round" });

// Relaciones CircuitNote
CircuitNote.belongsTo(Circuit, { foreignKey: "id_circuit" });
Circuit.hasMany(CircuitNote, { foreignKey: "id_circuit" });

// Relaciones Circuit
Circuit.belongsTo(Flag, { foreignKey: "id_flag" });
Flag.hasMany(Circuit, { foreignKey: "id_flag" });

// Relaciones CategoryHistory
CategoryHistory.belongsTo(Category, { foreignKey: "id_category" });
Category.hasMany(CategoryHistory, { foreignKey: "id_category" });

// CircuitNote -> Rider
CircuitNote.belongsTo(Rider, { foreignKey: "id_rider", as: "rider" });

// CircuitNote -> License
CircuitNote.belongsTo(License, { foreignKey: "id_licence", as: "license" });

// Rider -> CircuitNote
Rider.hasMany(CircuitNote, { foreignKey: "id_rider", as: "circuit_notes" });

// License -> CircuitNote
License.hasMany(CircuitNote, { foreignKey: "id_licence", as: "circuit_notes" });

// RaceNote -> Rider
RaceNote.belongsTo(Rider, { foreignKey: "id_rider", as: "rider" });

// RaceNote -> License
RaceNote.belongsTo(License, { foreignKey: "id_licence", as: "license" });

// Rider -> RaceNote
Rider.hasMany(RaceNote, { foreignKey: "id_rider", as: "race_notes" });

// License -> RaceNote
License.hasMany(RaceNote, { foreignKey: "id_licence", as: "race_notes" });
