const Category = require("../models/Category");
const Food = require("../models/Food");

class CategoryController {

  async create(req, res) {
    const category = await Category.create({
      name: req.body.name,
      description: req.body.description || ""
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });
  }


  async getAll(req, res) {
    const categories = await Category.find()
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  }

  // Get category by ID
  async getById(req, res) {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    return res.status(200).json({
      success: true,
      category
    });
  }

  // Update category
  async update(req, res) {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    if (req.body.name !== undefined) {
      category.name = req.body.name;
    }

    if (req.body.description !== undefined) {
      category.description = req.body.description;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category
    });
  }

  async delete(req, res) {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const linkedFood = await Food.exists({
      category: category._id
    });

    if (linkedFood) {
      return res.status(409).json({
        success: false,
        message: "Category is being used by food items"
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  }
}

module.exports = new CategoryController();