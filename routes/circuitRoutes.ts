import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticationToken";
import { verifyPermissionsManageNotes, verifyUserLicencePermission } from "../middlewares/licenceCheck";
import { deleteNote, getCircuitDetails, getCircuits, newNote, updateNote } from "../controllers/circuitController";

const router = Router();

router.get(
  "/getCircuits/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  getCircuits
);
router.post(
  "/circuitDetails/:id_licence/:id_circuit",
  authenticateToken,
  verifyUserLicencePermission,
  getCircuitDetails
);
router.post(
  "/newNote/:id_licence/:id_circuit/:id_rider",
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

export default router;
