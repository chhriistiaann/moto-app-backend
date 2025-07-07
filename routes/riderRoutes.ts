import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticationToken";
import {
  verifyPermissionsManageRiders,
  verifyUserLicencePermission,
} from "../middlewares/licenceCheck";
import {
  getProfile,
  updateRider,
  searchRider,
} from "../controllers/riderController";

const router = Router();

router.get(
  "/getProfile/:id_licence/:id_rider/:id_seasson",
  authenticateToken,
  verifyUserLicencePermission,
  getProfile
);
router.post(
  "/updateRider/:id_licence/:id_rider",
  authenticateToken,
  verifyUserLicencePermission,
  verifyPermissionsManageRiders,
  updateRider
);

router.post(
  "/getRiderSearch/:id_licence",
  authenticateToken,
  verifyUserLicencePermission,
  searchRider
);
export default router;
