const routes = require("./routes/machinePerformanceRoutes"); console.log("Routes:", Object.keys(routes)); console.log("Stack:", routes.stack && routes.stack.map(r => r.route?.path || "middleware"));
