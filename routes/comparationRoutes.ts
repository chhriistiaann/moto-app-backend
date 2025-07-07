import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticationToken";
import { verifyUserLicencePermission } from "../middlewares/licenceCheck";
import { getComparation } from "../controllers/comparationController";

const router = Router();

router.post("/getComparation/:id_licence", authenticateToken, verifyUserLicencePermission, getComparation);


export default router;
