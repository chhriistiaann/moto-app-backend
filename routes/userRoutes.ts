import { Router } from "express";
import { createUser, loginUser, logoutUser, updateUser } from "../controllers/userController";
import { authenticateToken } from "../middlewares/authenticationToken";

const router = Router();

router.post("/login", loginUser);
router.post("/create", createUser);
router.post("/update", authenticateToken, updateUser);
router.post("/logout", authenticateToken, logoutUser);

export default router;
