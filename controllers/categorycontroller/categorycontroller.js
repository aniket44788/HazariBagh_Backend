import Category from "../../models/categories/categoryschema.js";

export const createCategory = async (req, res) => {
  console.log("createCategory controller hitting --- >");
  try {
    const { name } = req.body; // storeModel removed
    console.log(name);

    // ================= VALIDATION =================
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    // ================= DUPLICATE CHECK =================
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    // ================= CREATE CATEGORY =================
    const category = new Category({
      name: name.trim(),
      createdBy: req.admin._id,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      isActive: true,
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

export const updateCategory = async (req, res) => {
  console.log("Update category is hitting ");
  try {
    const { id } = req.params;
    console.log(id);
    const { name } = req.body;
    console.log(name);
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name) {
      const existing = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }

      category.name = name.trim();
    }

    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

export const deleteCategory = async (req, res) => {
  console.log("delete Category Is hitting ");
  try {
    const { id } = req.params;
    console.log(id);
    if (!id) {
      return res.status(400).json({
        message: "No category Found.",
      });
    }
    const deleteCategory = await Category.findOneAndDelete(id);
    return res.status(200).json({
      sucess: true,
      message: "Category Deleted Successfully",
      deleteCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category , Internal Server Error!",
      error,
    });
  }
};
