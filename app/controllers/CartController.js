const Cart = require("../models/Cart");
const Food = require("../models/Food");

class CartController {

  async getCart(req, res) {
    let cart = await Cart.findOne({
      user: req.user._id
    }).populate(
      "items.food",
      "name price isAvailable restaurant"
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    const validItems = cart.items.filter(
      (item) => item.food !== null
    );

    const totalAmount = validItems.reduce(
      (total, item) =>
        total + item.food.price * item.quantity,
      0
    );

    return res.status(200).json({
      success: true,
      cart,
      totalAmount
    });
  }

  async addItem(req, res) {
    const { foodId, quantity = 1 } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    const food = await Food.findById(foodId)
      .populate("restaurant", "isActive");

    if (!food || !food.isAvailable) {
      return res.status(404).json({
        success: false,
        message: "Food is not available"
      });
    }

    if (
      !food.restaurant ||
      !food.restaurant.isActive
    ) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is not available"
      });
    }

    let cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    const hasDifferentRestaurant = cart.items.some(
      (item) =>
        item.food.toString() !== foodId
    );

    if (hasDifferentRestaurant && cart.items.length > 0) {
      const existingFoods = await Food.find({
        _id: {
          $in: cart.items.map((item) => item.food)
        }
      }).select("restaurant");

      const restaurantIds = [
        ...new Set(
          existingFoods.map((item) =>
            item.restaurant.toString()
          )
        )
      ];

      if (
        restaurantIds.some(
          (id) => id !== food.restaurant._id.toString()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Your cart contains food from another restaurant. Clear your cart first."
        });
      }
    }

    const existingItem = cart.items.find(
      (item) => item.food.toString() === foodId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        food: food._id,
        quantity
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.food", "name price isAvailable");

    return res.status(200).json({
      success: true,
      message: "Food added to cart",
      cart: updatedCart
    });
  }


  async updateQuantity(req, res) {
    const { quantity } = req.body;
    const { foodId } = req.params;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      (entry) => entry.food.toString() === foodId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food not found in cart"
      });
    }

    item.quantity = quantity;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.food", "name price isAvailable");

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: updatedCart
    });
  }


  async removeItem(req, res) {
    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.food.toString() !== req.params.foodId
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Food removed from cart",
      cart
    });
  }


  async clearCart(req, res) {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart
    });
  }
}

module.exports = new CartController();