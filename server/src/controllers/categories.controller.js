const Category = require("../models/Category");

// GET /api/categories
exports.getCategories = async (_req, res) => {
  try {
    const cats = await Category.find({});
    res.json(cats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/categories
// body: { hostname, category }
exports.saveCategory = async (req, res) => {
  try {
    const { hostname, category } = req.body;
    if (!hostname || !category) {
      return res.status(400).json({ message: "hostname and category required" });
    }

    const cat = await Category.findOneAndUpdate(
      { hostname },
      { category },
      { upsert: true, new: true }
    );
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
