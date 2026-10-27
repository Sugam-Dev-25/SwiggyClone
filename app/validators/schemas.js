const Joi = require("joi");

exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.restaurantSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  address: Joi.string().required()
});

exports.foodSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  price: Joi.number().min(0).required(),
  isVeg: Joi.boolean().required(),
  restaurant: Joi.string().hex().length(24).required(),
  category: Joi.string().hex().length(24).required()
});

exports.categorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("")
});

exports.quantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

exports.statusSchema = Joi.object({
  status: Joi.string()
    .valid("Accepted", "Preparing", "Out for Delivery", "Delivered")
    .required()
});