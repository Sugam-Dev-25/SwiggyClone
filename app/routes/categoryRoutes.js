const router = require("express").Router();

const CategoryController = require("../controllers/CategoryController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");

const {
  authenticate,
  authorizeRoles,
  requireAdminSecret
} = require("../middlewares/authMiddleware");

const {
  categorySchema
} = require("../validators/schemas");


router.get(
  "/",
  asyncHandler(CategoryController.getAll.bind(CategoryController))
);


router.get(
  "/:id",
  asyncHandler(CategoryController.getById.bind(CategoryController))
);


router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  requireAdminSecret,
  validate(categorySchema),
  asyncHandler(CategoryController.create.bind(CategoryController))
);


router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  requireAdminSecret,
  validate(categorySchema),
  asyncHandler(CategoryController.update.bind(CategoryController))
);


router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  requireAdminSecret,
  asyncHandler(CategoryController.delete.bind(CategoryController))
);

module.exports = router;