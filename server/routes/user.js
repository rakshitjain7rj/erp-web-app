const express = require("express");
const router = express.Router();
const {
getAllUsers,
addUser,
updateUser,
deleteUser,
resetPassword,
sendInvite,
getLoginHistory,
approveUser,
} = require("../controllers/userController");

// GET /api/users → Fetch all users (with optional filters/search)
router.get("/", getAllUsers);

// POST /api/users → Add a new user
router.post("/", addUser);

// PATCH /api/users/:id → Update role/status
router.patch("/:id", updateUser);

// DELETE /api/users/:id → Delete user
router.delete("/:id", deleteUser);

// POST /api/users/:id/reset-password → Trigger password reset
router.post("/:id/reset-password", resetPassword);

// POST /api/users/:id/approve → Approve or reject a pending user
router.post('/:id/approve', approveUser);

// POST /api/users/invite → Send invitation email
router.post("/invite", sendInvite);

// GET /api/users/:id/logs → Get login history
router.get("/:id/logs", getLoginHistory);

module.exports = router;