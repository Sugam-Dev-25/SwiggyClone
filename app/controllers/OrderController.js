const Cart = require("../models/Cart");
const Food = require("../models/Food");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

class OrderController {

  async createOrder(req, res) {
    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    const foodIds = cart.items.map((item) => item.food);

    const foods = await Food.find({
      _id: { $in: foodIds }
    }).populate("restaurant", "isActive");

    if (foods.length !== cart.items.length) {
      return res.status(400).json({
        success: false,
        message: "One or more food items no longer exist"
      });
    }

    const foodMap = new Map(
      foods.map((food) => [
        food._id.toString(),
        food
      ])
    );

    const firstFood = foods[0];
    const restaurantId =
      firstFood.restaurant._id.toString();

    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const food = foodMap.get(
        cartItem.food.toString()
      );

      if (
        !food ||
        !food.isAvailable ||
        !food.restaurant ||
        !food.restaurant.isActive
      ) {
        return res.status(400).json({
          success: false,
          message: "A food item or restaurant is unavailable"
        });
      }

      if (
        food.restaurant._id.toString() !== restaurantId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All food items must belong to the same restaurant"
        });
      }

      orderItems.push({
        food: food._id,
        name: food.name,
        price: food.price,
        quantity: cartItem.quantity
      });

      totalAmount += food.price * cartItem.quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount,
      status: "Pending"
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });
  }

  async getMyOrders(req, res) {
    const orders = await Order.find({
      user: req.user._id
    })
      .populate("restaurant", "name address")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  }


  async getOrderById(req, res) {
    const order = await Order.findById(req.params.id)
      .populate("restaurant", "name owner");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const isCustomer =
      order.user.toString() === req.user._id.toString();

    const isRestaurantOwner =
      order.restaurant &&
      order.restaurant.owner.toString() ===
        req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (
      !isCustomer &&
      !isRestaurantOwner &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this order"
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  }


  async cancelOrder(req, res) {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending orders can be cancelled"
      });
    }

    order.status = "Cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  }


  async getRestaurantOrders(req, res) {
    const restaurant = await Restaurant.findById(
      req.params.restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const isOwner =
      restaurant.owner.toString() ===
      req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot access these orders"
      });
    }

    const orders = await Order.find({
      restaurant: restaurant._id
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  }


  async respondToOrder(req, res) {
    const { action } = req.body;

    if (!["Accepted", "Rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be Accepted or Rejected"
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("restaurant", "owner");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (
      order.restaurant.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not own this restaurant"
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending orders can be accepted or rejected"
      });
    }

    order.status = action;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${action.toLowerCase()} successfully`,
      order
    });
  }


  async updateStatus(req, res) {
    const { status } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("restaurant", "owner");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const isOwner =
      order.restaurant.owner.toString() ===
      req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot update this order"
      });
    }

    const allowedTransitions = {
      Pending: ["Accepted", "Rejected"],
      Accepted: ["Preparing"],
      Preparing: ["Out for Delivery"],
      "Out for Delivery": ["Delivered"]
    };

    const allowedNext =
      allowedTransitions[order.status] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid transition from ${order.status} to ${status}`
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order
    });
  }


  async getAllOrders(req, res) {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  }


  async adminUpdateStatus(req, res) {
    const { status } = req.body;

    const allowedStatuses = [
      "Accepted",
      "Rejected",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order managed by admin",
      order
    });
  }
}

module.exports = new OrderController();