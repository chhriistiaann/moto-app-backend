import { Router } from "express";
import {
  addUser,
  deleteUser,
  selectLicence,
  updateUserLicence,
  getUsers,
} from "../controllers/licenceController";
import { authenticateToken } from "../middlewares/authenticationToken";
import {
  verifyPermissionsAdmin,
  verifyUserLicencePermission,
} from "../middlewares/licenceCheck";

const router = Router();

router.get(
  "/selectLicence/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  verifyUserLicencePermission,
  selectLicence
);

router.get(
  "/getUsers/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsAdmin,
  getUsers
);

router.post(
  "/addUser/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsAdmin,
  addUser
);
router.post(
  "/updateUser/:id_licence/:user_licence",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsAdmin,
  updateUserLicence
);

router.post(
  "/deleteUser/:id_licence/:user_licence",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsAdmin,
  deleteUser
);

export default router;
