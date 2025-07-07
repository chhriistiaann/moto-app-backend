import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticationToken";
import { verifyUserLicencePermission } from "../middlewares/licenceCheck";
import { getRanking } from "../controllers/rankController";

const router = Router();

router.get(
  "/getRanking/:id_licence/:id_seasson",
  authenticateToken,
  verifyUserLicencePermission,
  getRanking
);

export default router;
