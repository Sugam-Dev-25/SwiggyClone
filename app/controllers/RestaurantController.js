const Restaurant = require("../models/Restaurant");

class RestaurantController {
  
  async create(req, res) {
    const { name, description, address } = req.body;

    const restaurant = await Restaurant.create({
      name,
      description,
      address,
      owner: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      restaurant
    });
  }

  async getAll(req, res) {
    const filter = { isActive: true };

    if (req.query.search) {
      filter.name = {
        $regex: req.query.search,
        $options: "i"
      };
    }

    const restaurants = await Restaurant.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  }


  async getMyRestaurants(req, res) {
    const restaurants = await Restaurant.find({
      owner: req.user._id
    });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  }


  async getById(req, res) {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    return res.status(200).json({
      success: true,
      restaurant
    });
  }

  async update(req, res) {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const isOwner =
      restaurant.owner.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this restaurant"
      });
    }

    const allowedFields = ["name", "description", "address"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restaurant[field] = req.body[field];
      }
    });

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant
    });
  }


  async updateStatus(req, res) {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const isOwner =
      restaurant.owner.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this restaurant"
      });
    }

    restaurant.isActive = req.body.isActive;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant status updated",
      restaurant
    });
  }
}

module.exports = new RestaurantController();