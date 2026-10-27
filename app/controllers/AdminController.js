const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Food = require("../models/Food");

class AdminController {

  async getAllUsers(req, res) {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  }

 
  async blockUser(req, res) {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin account cannot be blocked",
      });
    }

    user.isBlocked = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  }


  async unblockUser(req, res) {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBlocked = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  }


  async getAllRestaurants(req, res) {
    const restaurants = await Restaurant.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  }


  async getStatistics(req, res) {
    const [
      totalUsers,
      totalRestaurants,
      totalFoods,
      totalOrders,
      deliveredOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Food.countDocuments(),
      Order.countDocuments(),
      Order.find({ status: "Delivered" }).select("totalAmount"),
    ]);

    const totalRevenue = deliveredOrders.reduce(
      (total, order) => total + order.totalAmount,
      0,
    );

    return res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        totalRestaurants,
        totalFoods,
        totalOrders,
        deliveredOrders: deliveredOrders.length,
        totalRevenue,
      },
    });
  }
}

module.exports = new AdminController();
