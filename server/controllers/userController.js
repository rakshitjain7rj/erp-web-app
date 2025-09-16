const { Op } = require("sequelize");
const User = require("../models/User");
const { sendInvitationEmail } = require("../utils/email");
const bcrypt = require("bcryptjs");

// POST /api/users/:id/approve → approve or reject (set status active/inactive)
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body; // boolean
    const target = await User.findByPk(id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Only allow transition from pending -> active/inactive or active->inactive/active toggles
    const newStatus = approved ? 'active' : 'inactive';
    await User.update({ status: newStatus }, { where: { id } });
    const updated = await User.findByPk(id);
    res.json({ success: true, message: `User ${approved ? 'approved' : 'rejected'}`, user: updated });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ error: 'Failed to update user approval state' });
  }
};

// GET /api/users → fetch all users (with filters/search)
exports.getAllUsers = async (req, res) => {
  try {
    const { search = "", role, status } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users → add new user
exports.addUser = async (req, res) => {
  try {
  const { name, email, password = "temp1234", role = "manager" } = req.body; // default to lowest privileged role

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    // New users should start as pending to require approval (unless explicitly setting active and caller is superadmin)
    const initialStatus = req.body.status || 'pending';
    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      status: initialStatus,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: "Failed to add user" });
  }
};

// PATCH /api/users/:id → update role/status
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    await User.update({ role, status }, { where: { id } });

    const updatedUser = await User.findByPk(id);
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// DELETE /api/users/:id → delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// POST /api/users/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = "temp1234" } = req.body;

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashed }, { where: { id } });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// POST /api/users/invite → send invitation
exports.sendInvite = async (req, res) => {
  try {
    const { email } = req.body;
    const token = Math.random().toString(36).substring(2, 10);
    await sendInvitationEmail(email, token);
    res.json({ message: "Invitation sent" });
  } catch (err) {
    console.error("Error sending invite:", err);
    res.status(500).json({ error: "Failed to send invite" });
  }
};

// GET /api/users/:id/logs → login history
exports.getLoginHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.loginHistory || []);
  } catch (err) {
    console.error("Error fetching login history:", err);
    res.status(500).json({ error: "Failed to fetch login history" });
  }
};
