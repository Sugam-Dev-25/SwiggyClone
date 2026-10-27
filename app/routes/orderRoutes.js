const router = require("express").Router();

const OrderController = require("../controllers/OrderController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");

const {
  authenticate,
  authorizeRoles,
  requireAdminSecret
} = require("../middlewares/authMiddleware");

const {
  statusSchema
} = require("../validators/schemas");

const Joi = require("joi");


router.use(authenticate);


router.post(
  "/",
  authorizeRoles("user"),
  asyncHandler(OrderController.createOrder.bind(OrderController))
);


router.get(
  "/my-orders",
  authorizeRoles("user"),
  asyncHandler(OrderController.getMyOrders.bind(OrderController))
);


router.get(
  "/restaurant/:restaurantId",
  authorizeRoles("restaurant_owner", "admin"),
  asyncHandler(
    OrderController.getRestaurantOrders.bind(OrderController)
  )
);


router.patch(
  "/:id/respond",
  authorizeRoles("restaurant_owner"),
  validate(
    Joi.object({
      action: Joi.string()
        .valid("Accepted", "Rejected")
        .required()
    })
  ),
  asyncHandler(
    OrderController.respondToOrder.bind(OrderController)
  )
);


router.patch(
  "/:id/cancel",
  authorizeRoles("user"),
  asyncHandler(OrderController.cancelOrder.bind(OrderController))
);


router.patch(
  "/:id/status",
  authorizeRoles("restaurant_owner"),
  validate(statusSchema),
  asyncHandler(OrderController.updateStatus.bind(OrderController))
);


router.get(
  "/",
  authorizeRoles("admin"),
  requireAdminSecret,
  asyncHandler(OrderController.getAllOrders.bind(OrderController))
);


router.patch(
  "/:id/admin-status",
  authorizeRoles("admin"),
  requireAdminSecret,
  validate(
    Joi.object({
      status: Joi.string()
        .valid(
          "Accepted",
          "Rejected",
          "Preparing",
          "Out for Delivery",
          "Delivered",
          "Cancelled"
        )
        .required()
    })
  ),
  asyncHandler(
    OrderController.adminUpdateStatus.bind(OrderController)
  )
);


router.get(
  "/:id",
  asyncHandler(OrderController.getOrderById.bind(OrderController))
);

module.exports = router;