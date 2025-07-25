// src/api/routes/user.routes.ts
import express, { Router } from "express";
import * as userController from "../controllers/user.controller";
import { isAuthenticated } from "../../middleware/isAuthenticated";
// import { validateRequest } from '../../middleware/validateRequest';
// import { updateUserProfileSchema } from './schemas/user.schemas'; // Example

const router: Router = express.Router();

// All user routes are protected after this point
router.use(isAuthenticated);

// GET /api/v1/users/me (Get current logged-in user's profile)
router.get("/me", userController.getCurrentUserProfile);

// PUT /api/v1/users/me (Update current logged-in user's profile)
// router.put('/me', validateRequest(updateUserProfileSchema), userController.updateCurrentUserProfile);

// DELETE /api/v1/users/me (Delete current logged-in user's account - careful with this!)
router.delete("/me", userController.deleteCurrentUserAccount);

// POST /api/v1/users/preferences (Update user-specific application preferences)
// router.post('/preferences', userController.updateUserPreferences);

export default router;
