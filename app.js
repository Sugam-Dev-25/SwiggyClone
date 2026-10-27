require("dotenv").config();

const express = require("express");
const cors = require("cors");

const Database = require("./app/config/db");

const authRoutes = require("./app/routes/authRoutes");
const restaurantRoutes = require("./app/routes/restaurantRoutes");
const foodRoutes = require("./app/routes/foodRoutes");
const categoryRoutes = require("./app/routes/categoryRoutes");
const cartRoutes = require("./app/routes/cartRoutes");
const orderRoutes = require("./app/routes/orderRoutes");
const adminRoutes = require("./app/routes/adminRoutes");

const {
  notFound,
  errorHandler
} = require("./app/middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Swiggy Clone Backend API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

Database.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });