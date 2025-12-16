import SubCategory from "../../models/categories/subcategoryschema.js";
import Category from "../../models/categories/categoryschema.js";

export const subCategoryCreate = async (req, res) => {
  console.log("subcategory controller hitting");
  try {
    const { name } = req.body;
    const { categoryId } = req.params;

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name and Category ID are required",
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newSubCategory = await SubCategory.create({
      name,
      category: categoryId,
      subcategoryImage: image,
    });

    category.subcategories.push(newSubCategory._id);
    await category.save();

    return res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      subCategory: newSubCategory,
    });
  } catch (error) {
    console.error("SUBCATEGORY CREATE ERROR =>", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create subcategory",
      error: error.message,
    });
  }
};

export const getAllSubCategories = async (req, res) => {
  try {
    const subcategories = await SubCategory.find().populate(
      "category",
      "name image"
    );

    if (subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subcategories found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",
      subcategories,
    });
  } catch (error) {
    console.error("GET ALL SUBCATEGORIES ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
};

export const getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await SubCategory.findById(id).populate(
      "category",
      "name image"
    );

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subcategory fetched successfully",
      subcategory,
    });
  } catch (error) {
    console.error("GET SUBCATEGORY BY ID ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subcategory",
      error: error.message,
    });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const { name } = req.body;
    console.log(name);

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    if (name) subcategory.name = name;
    if(!name) {
        return res.status(404).json({
            message : "No image found "
        })
    }
    if (req.file) {
      subcategory.subcategoryImage = `/uploads/${req.file.filename}`;
    }

    await subcategory.save();

    return res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      subcategory,
    });
  } catch (error) {
    console.error("UPDATE SUBCATEGORY ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subcategory",
      error: error.message,
    });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // Remove reference from Category
    await Category.findByIdAndUpdate(subcategory.category, {
      $pull: { subcategories: subcategory._id },
    });

    // Delete subcategory
    await subcategory.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SUBCATEGORY ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subcategory",
      error: error.message,
    });
  }
};
