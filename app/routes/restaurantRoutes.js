const router = require("express").Router();

const RestaurantController = require("../controllers/RestaurantController");
const asyncHandler = require("../utils/asyncHandler");

const validate = require("../middlewares/validate");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/authMiddleware");

const {
  restaurantSchema
} = require("../validators/schemas");


router.get(
  "/",
  asyncHandler(RestaurantController.getAll.bind(RestaurantController))
);


router.get(
  "/mine",
  authenticate,
  authorizeRoles("restaurant_owner"),
  asyncHandler(
    RestaurantController.getMyRestaurants.bind(RestaurantController)
  )
);


router.get(
  "/:id",
  asyncHandler(RestaurantController.getById.bind(RestaurantController))
);


router.post(
  "/",
  authenticate,
  authorizeRoles("restaurant_owner"),
  validate(restaurantSchema),
  asyncHandler(RestaurantController.create.bind(RestaurantController))
);


router.put(
  "/:id",
  authenticate,
  authorizeRoles("restaurant_owner", "admin"),
  validate(restaurantSchema),
  asyncHandler(RestaurantController.update.bind(RestaurantController))
);


router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("restaurant_owner", "admin"),
  asyncHandler(
    RestaurantController.updateStatus.bind(RestaurantController)
  )
);

module.exports = router;