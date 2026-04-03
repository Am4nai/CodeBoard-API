import { Router } from "express";
import {
  getAllUsers,
  getUserByIdAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/admin.controller";

const router = Router();

router.get("/users", getAllUsers);
router.get("/users/:id", getUserByIdAdmin);
router.put("/users/:id", updateUserByAdmin);
router.delete("/users/:id", deleteUserByAdmin);

export default router;
