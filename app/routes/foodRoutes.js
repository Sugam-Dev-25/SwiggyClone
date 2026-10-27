const router = require("express").Router();

const FoodController = require("../controllers/FoodController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/authMiddleware");

const {
  foodSchema
} = require("../validators/schemas");


router.get(
  "/",
  asyncHandler(FoodController.getAll.bind(FoodController))
);


router.get(
  "/:id",
  asyncHandler(FoodController.getById.bind(FoodController))
);


router.post(
  "/",
  authenticate,
  authorizeRoles("restaurant_owner", "admin"),
  validate(foodSchema),
  asyncHandler(FoodController.create.bind(FoodController))
);


router.put(
  "/:id",
  authenticate,
  authorizeRoles("restaurant_owner", "admin"),
  asyncHandler(FoodController.update.bind(FoodController))
);


router.delete(
  "/:id",
  authenticate,
  authorizeRoles("restaurant_owner", "admin"),
  asyncHandler(FoodController.delete.bind(FoodController))
);

module.exports = router;