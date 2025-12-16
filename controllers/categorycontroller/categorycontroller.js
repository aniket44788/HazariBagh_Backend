import Category from "../../models/categories/categoryschema.js";

export const createCategory = async (req, res) => {
  console.log("createCategory controller hitting --- >");
  try {
    const { name } = req.body;
    console.log(name);
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const category = new Category({
      name: name.trim(),
      createdBy: req.admin._id,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Category",
      error: error.message,
    });
  }
};

export const getallCategory = async (req, res) => {
  try {
    const allCategories = await Category.find({});

    if (allCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories: allCategories,
    });
  } catch (error) {
    console.error("GET ALL CATEGORY ERROR =>", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories. Internal server error.",
      error: error.message,
    });
  }
};
