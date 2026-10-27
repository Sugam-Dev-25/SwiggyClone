const router = require("express").Router();
const Joi = require("joi");

const CartController = require("../controllers/CartController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/authMiddleware");


router.use(
  authenticate,
  authorizeRoles("user")
);


router.get(
  "/",
  asyncHandler(CartController.getCart.bind(CartController))
);


router.post(
  "/items",
  validate(
    Joi.object({
      foodId: Joi.string().hex().length(24).required(),
      quantity: Joi.number().integer().min(1).default(1)
    })
  ),
  asyncHandler(CartController.addItem.bind(CartController))
);


router.patch(
  "/items/:foodId",
  validate(
    Joi.object({
      quantity: Joi.number().integer().min(1).required()
    })
  ),
  asyncHandler(
    CartController.updateQuantity.bind(CartController)
  )
);


router.delete(
  "/items/:foodId",
  asyncHandler(CartController.removeItem.bind(CartController))
);


router.delete(
  "/",
  asyncHandler(CartController.clearCart.bind(CartController))
);

module.exports = router;