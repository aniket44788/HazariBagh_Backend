import Unit from "../../models/units/unitschema.js";
import Category from "../../models/categories/categoryschema.js";

export const createUnit = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { unit } = req.body;

    // ===== Validate unit =====
    if (!unit || unit.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Unit name is required",
      });
    }

    // ===== Validate category =====
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required in params",
      });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ===== Check duplicate =====
    const existingUnit = await Unit.findOne({
      unit: unit.trim().toLowerCase(),
      category: categoryId,
    });

    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: "Unit already exists for this category",
      });
    }

    // ===== Create new unit =====
    const newUnit = await Unit.create({
      unit: unit.trim().toLowerCase(),
      category: categoryId,
    });

    // ===== Push unit inside category =====
    await Category.findByIdAndUpdate(categoryId, {
      $push: { units: newUnit._id },
    });

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      unit: newUnit,
    });
  } catch (error) {
    console.error("CREATE UNIT ERROR =>", error);
    res.status(500).json({
      success: false,
      message: "Failed to create unit",
      error: error.message,
    });
  }
};

export const getUnitsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const query = { category: categoryId };

    const units = await Unit.find(query);

    if (!units.length) {
      return res.status(404).json({
        success: false,
        message: "No units found for this category",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Units fetched successfully",
      units,
    });
  } catch (error) {
    console.error("FETCH UNITS ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch units",
      error: error.message,
    });
  }
};
