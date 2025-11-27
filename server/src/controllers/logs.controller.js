const TimeLog = require("../models/TimeLog");

// POST /api/logs/bulk
exports.bulkUpsertLogs = async (req, res) => {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs)) {
      return res.status(400).json({ message: "logs must be an array" });
    }

    const ops = logs.map((log) => ({
      updateOne: {
        filter: {
          userId: log.userId,
          date: log.date,
          hostname: log.hostname
        },
        update: {
          $set: {
            category: log.category || "uncategorized"
          },
          $setOnInsert: {
            userId: log.userId,
            date: log.date,
            hostname: log.hostname
          },
          $inc: {
            duration: log.duration || 0
          }
        },
        upsert: true
      }
    }));

    if (ops.length) {
      await TimeLog.bulkWrite(ops);
    }

    res.json({ message: "Logs saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/logs/summary?userId=demo-user&from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getSummary = async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const from = req.query.from;
    const to = req.query.to;

    const match = { userId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = from;
      if (to) match.date.$lte = to;
    }

    const agg = await TimeLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$hostname",
          totalDuration: { $sum: "$duration" },
          category: { $first: "$category" }
        }
      }
    ]);

    let total = 0;
    let productive = 0;
    let unproductive = 0;

    agg.forEach((row) => {
      total += row.totalDuration;
      if (row.category === "productive") productive += row.totalDuration;
      else if (row.category === "unproductive")
        unproductive += row.totalDuration;
    });

    res.json({
      total,
      productive,
      unproductive,
      byDomain: agg.map((a) => ({
        hostname: a._id,
        totalDuration: a.totalDuration,
        category: a.category
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/logs/weekly-report?userId=demo-user
exports.getWeeklyReport = async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";

    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 6);

    const to = today.toISOString().slice(0, 10);
    const from = past.toISOString().slice(0, 10);

    const match = {
      userId,
      date: { $gte: from, $lte: to }
    };

    const agg = await TimeLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { date: "$date", category: "$category" },
          totalDuration: { $sum: "$duration" }
        }
      }
    ]);

    // structure: per day stats
    const days = {};
    agg.forEach((row) => {
      const date = row._id.date;
      const cat = row._id.category;
      const dur = row.totalDuration;
      if (!days[date]) days[date] = { productive: 0, unproductive: 0, total: 0 };
      if (cat === "productive") days[date].productive += dur;
      else if (cat === "unproductive") days[date].unproductive += dur;
      days[date].total += dur;
    });

    const result = Object.entries(days).map(([date, stat]) => ({
      date,
      productive: stat.productive,
      unproductive: stat.unproductive,
      total: stat.total,
      productivityScore: stat.total
        ? Math.round((stat.productive / stat.total) * 100)
        : 0
    }));

    res.json({ from, to, days: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
