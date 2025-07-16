import { Op } from "sequelize";
import AuditLog from "../models/audit_log";

/**
 * GET /api/audit-logs
 * Query params: productId, userId, yarnType, dateFrom, dateTo
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { productId, userId, yarnType, dateFrom, dateTo } = req.query;

    const whereClause = {};

    if (productId) {
      whereClause.productId = productId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (yarnType) {
      whereClause.yarnType = yarnType;
    }

    if (dateFrom || dateTo) {
      whereClause.timestamp = {};
      if (dateFrom) whereClause.timestamp[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.timestamp[Op.lte] = new Date(dateTo);
    }

    const logs = await AuditLog.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      limit: 200, // Optional: limit result
    });

    res.json({ success: true, logs });
  } catch (error) {
    console.error("❌ Failed to fetch audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching audit logs",
      error: error.message,
    });
  }
};
