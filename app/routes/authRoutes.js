const router = require("express").Router();

const AuthController = require("../controllers/AuthController");
const asyncHandler = require("../utils/asyncHandler");

const validate = require("../middlewares/validate");
const {
  authenticate
} = require("../middlewares/authMiddleware");

const {
  registerSchema,
  loginSchema
} = require("../validators/schemas");


router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(AuthController.register.bind(AuthController))
);


router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(AuthController.login.bind(AuthController))
);


router.post(
  "/refresh-token",
  asyncHandler(AuthController.refresh.bind(AuthController))
);


router.post(
  "/logout",
  authenticate,
  asyncHandler(AuthController.logout.bind(AuthController))
);

module.exports = router;