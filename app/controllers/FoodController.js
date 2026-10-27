const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");
const Category = require("../models/Category");

class FoodController {

  async create(req, res) {
    const {
      name,
      description,
      price,
      isVeg,
      isAvailable,
      restaurant,
      category
    } = req.body;

    const restaurantData = await Restaurant.findById(restaurant);

    if (!restaurantData) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    if (!restaurantData.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot add food to an inactive restaurant"
      });
    }

    const isOwner =
      restaurantData.owner.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot add food to this restaurant"
      });
    }

    const categoryData = await Category.findById(category);

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const food = await Food.create({
      name,
      description,
      price,
      isVeg,
      isAvailable:
        isAvailable === undefined ? true : isAvailable,
      restaurant,
      category
    });

    return res.status(201).json({
      success: true,
      message: "Food added successfully",
      food
    });
  }


  async getAll(req, res) {
    const filter = { isAvailable: true };

    if (req.query.search) {
      filter.name = {
        $regex: req.query.search,
        $options: "i"
      };
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.restaurant) {
      filter.restaurant = req.query.restaurant;
    }

    if (req.query.isVeg !== undefined) {
      filter.isVeg = req.query.isVeg === "true";
    }

    if (
      req.query.minPrice !== undefined ||
      req.query.maxPrice !== undefined
    ) {
      filter.price = {};

      if (req.query.minPrice !== undefined) {
        filter.price.$gte = Number(req.query.minPrice);
      }

      if (req.query.maxPrice !== undefined) {
        filter.price.$lte = Number(req.query.maxPrice);
      }
    }

    const foods = await Food.find(filter)
      .populate("restaurant", "name address isActive")
      .populate("category", "name");

    const visibleFoods = foods.filter(
      (food) =>
        food.restaurant &&
        food.restaurant.isActive
    );

    return res.status(200).json({
      success: true,
      count: visibleFoods.length,
      foods: visibleFoods
    });
  }


  async getById(req, res) {
    const food = await Food.findById(req.params.id)
      .populate("restaurant", "name address isActive")
      .populate("category", "name");

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      });
    }

    if (!food.restaurant || !food.restaurant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Food is not available"
      });
    }

    return res.status(200).json({
      success: true,
      food
    });
  }


  async update(req, res) {
    const food = await Food.findById(req.params.id)
      .populate("restaurant");

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      });
    }

    const isOwner =
      food.restaurant.owner.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot update this food"
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "isVeg",
      "isAvailable",
      "category"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        food[field] = req.body[field];
      }
    }

    if (req.body.category) {
      const category = await Category.findById(req.body.category);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }
    }

    await food.save();

    return res.status(200).json({
      success: true,
      message: "Food updated successfully",
      food
    });
  }


  async delete(req, res) {
    const food = await Food.findById(req.params.id)
      .populate("restaurant");

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      });
    }

    const isOwner =
      food.restaurant.owner.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this food"
      });
    }

    await food.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Food deleted successfully"
    });
  }
}

module.exports = new FoodController();