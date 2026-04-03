import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import postsRoutes from "./posts.routes";
import commentsRoutes from "./comments.routes";
import likesRoutes from "./likes.routes";
import collectionRoutes from "./collections.routes";
import adminRoutes from "../routes/admin.routes";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/admin.middleware";
import languagesRoutes from "../routes/languages.routes"


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/posts", postsRoutes);
router.use("/languages", languagesRoutes);
router.use("/comments", commentsRoutes);
router.use("/likes", likesRoutes);
router.use("/collections", collectionRoutes);
router.use("/admin", authMiddleware, adminOnly, adminRoutes);

export default router;