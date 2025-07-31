import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticationToken";
import {
  verifyPermissionsManageNotes,
  verifyUserLicencePermission,
} from "../middlewares/licenceCheck";
import {
  deleteNote,
  getRaceDetails,
  getRaces,
  getSeassons,
  newNote,
  searchRaces,
  updateNote,
} from "../controllers/raceController";

const router = Router();

router.get(
  "/getSeassons/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  getSeassons
);

router.get(
  "/getRaces/:id_licence/:id_seasson",
  authenticateToken,
  verifyUserLicencePermission,
  getRaces
);
router.get(
  "/raceDetails/:id_licence/:id_race",
  authenticateToken,
  verifyUserLicencePermission,
  getRaceDetails
);
router.post(
  "/newNote/:id_licence/:id_race/:id_rider",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsManageNotes,
  newNote
);
router.post(
  "/updateNote/:id_licence/:id_note",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsManageNotes,
  updateNote
);
router.delete(
  "/deleteNote/:id_licence/:id_note",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsManageNotes,
  deleteNote
);

router.post(
  "/getRaceSearch/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  searchRaces
);

export default router;
