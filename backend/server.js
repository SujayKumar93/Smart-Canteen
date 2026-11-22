const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const Order = require("./models/Order");
const User = require("./models/User");
const Food = require("./models/Food");
const app = express();
const server = http.createServer(app);
const WalletTransaction = require("./models/WalletTransaction");

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Student apne personal room mein join karega
  socket.on("join-user", (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log("User joined room:", userId);
    }
  });

  // Admin ke liye room
  socket.on("join-admin", () => {
    socket.join("admin-room");
    console.log("Admin joined room");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
app.use(cors());
app.use(express.json());


// ================= HOME =================

app.get("/", (req, res) => {
  res.send("Smart Canteen Backend is Running!");
});

app.get("/test-foods", (req, res) => {
  res.send("Food routes are reachable!");
});
app.get("/test-api-foods", (req, res) => {
  res.json({ message: "API food test working" });
});
// ================= REGISTER =================paymentMethod

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Create new user
    const user = new User({
  name,
  email,
  password,
  role: role || "student",
});

    await user.save();

    res.status(201).json({
      message: "Registration successful!",
      user: user,
    });

  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});


// ================= LOGIN =================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // Check password
    if (user.password !== password) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    res.json({
      message: "Login successful!",
      user: user,
    });

  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});
// ================= UPDATE USER PROFILE =================

app.put("/api/users/:id/profile", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether another user already uses this email
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.params.id },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.name = name.trim();
    user.email = normalizedEmail;

    // Password is optional; blank means keep the current password
    if (typeof password === "string" && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters.",
        });
      }

      user.password = password.trim();
    }

    await user.save();

    // Never send the password back to the frontend
    res.json({
      message: "Profile updated successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: "Failed to update profile.",
    });
  }
});
// ================= GET FOODS =================

app.get("/api/foods", async (req, res) => {
  try {
    console.log("GET /api/foods route reached");
    const foods = await Food.find().sort({
      name: 1,
    });

    res.json(foods);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch foods",
      error: error.message,
    });
  }
});

 // ================= ADD FOOD WITH STOCK =================

app.post("/api/foods", async (req, res) => {
  try {
    const { name, price, emoji, stock } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: "Food name, price, and stock are required",
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 1 ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return res.status(400).json({
        message: "Enter a valid price and stock (0 or more)",
      });
    }

    const food = new Food({
      name: name.trim(),
      price: parsedPrice,
      emoji: emoji || "🍽️",
      stock: parsedStock,
    });

    await food.save();

    res.status(201).json({
      message: "Food added successfully!",
      food,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add food",
      error: error.message,
    });
  }
});
// ================= DELETE FOOD =================

app.delete("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: "Food not found",
      });
    }

    res.json({
      message: "Food removed successfully!",
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to remove food",
      error: error.message,
    });
  }
});


// ================= UPDATE FOOD PRICE =================


 // ================= UPDATE FOOD PRICE AND STOCK =================

app.put("/api/foods/:id", async (req, res) => {
  try {
    const { price, stock } = req.body;

    const updates = {};

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 1) {
        return res.status(400).json({
          message: "Please enter a valid price",
        });
      }

      updates.price = parsedPrice;
    }

    if (stock !== undefined) {
      const parsedStock = Number(stock);

      if (
        !Number.isInteger(parsedStock) ||
        parsedStock < 0
      ) {
        return res.status(400).json({
          message: "Stock must be a whole number (0 or more)",
        });
      }

      updates.stock = parsedStock;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide price or stock to update",
      });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        message: "Food not found",
      });
    }

    res.json({
      message: "Food price and stock updated successfully!",
      food,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update food",
      error: error.message,
    });
  }
});


 // ================= CREATE ORDER WITH STOCK CHECK =================

app.post("/api/orders", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
  userId,
  customerName,
  items,
  tokenNumber,
  paymentMethod = "CASH",
} = req.body;

    if (!userId || !customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Please provide valid order details",
      });
    }
    if (!["CASH", "WALLET"].includes(paymentMethod)) {
  return res.status(400).json({
    message: "Invalid payment method",
  });
}

    let savedOrder;

    await session.withTransaction(async () => {
      const orderItems = [];
      let totalPrice = 0;

      // Check and decrease stock for every item
      for (const item of items) {
        const quantity = Number(item.quantity);

        if (!item.name || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("Invalid food item or quantity");
        }

        const food = await Food.findOne({
          name: item.name,
        }).session(session);

        if (!food) {
          throw new Error(`${item.name} is not available`);
        }

        const availableStock = Number(food.stock ?? 0);

        if (availableStock < quantity) {
          throw new Error(
            `Not enough stock for ${food.name}. Available: ${availableStock}`
          );
        }

        // Decrease stock only if enough stock remains
        const updatedFood = await Food.findOneAndUpdate(
          {
            _id: food._id,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedFood) {
          throw new Error(`Stock changed for ${food.name}. Please try again.`);
        }

        const price = Number(food.price);

        orderItems.push({
          name: food.name,
          quantity,
          price,
        });

        totalPrice += price * quantity;
      }

      const order = new Order({
        userId,
        customerName,
        items: orderItems,
        totalPrice,
        paymentMethod,
paymentStatus: paymentMethod === "WALLET" ? "PAID" : "PENDING",
        tokenNumber,
        pickupCode: require("crypto").randomBytes(16).toString("hex"),
pickedUp: false,
pickedUpAt: null,
        status: "Pending",
      });

      const saved = await order.save({ session });
      // WALLET PAYMENT
if (paymentMethod === "WALLET") {
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      role: "student",
      walletBalance: { $gte: totalPrice },
    },
    {
      $inc: { walletBalance: -totalPrice },
    },
    {
      new: true,
      session,
    }
  );

  if (!updatedUser) {
    throw new Error("Insufficient wallet balance");
  }

  await WalletTransaction.create(
    [
      {
        userId,
        type: "PAYMENT",
        amount: totalPrice,
        transactionId: "WALLET-" + require("crypto").randomUUID(),
        description: "Order payment",
        orderId: saved._id,
        status: "SUCCESS",
      },
    ],
    { session }
  );
}
      savedOrder = saved;
    });

// Notify admin about new order
io.to("admin-room").emit("new-order", savedOrder);

// Send success notification to the student
io.to(`user-${savedOrder.userId}`).emit(
  "order-placed",
  savedOrder
);

res.status(201).json({
  message: "Order placed successfully!",
  order: savedOrder,
});
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to place order",
    });
  } finally {
    await session.endSession();
  }
});


// ================= UPDATE ORDER STATUS =================

app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

// Notify the student about the updated status
io.to(`user-${order.userId}`).emit(
  "order-status-updated",
  order
);

res.json({
  message: "Order status updated successfully!",
  order: order,
});

  } catch (error) {
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
});
// ================= VERIFY ORDER PICKUP =================

app.post("/api/orders/verify-pickup", async (req, res) => {
  console.log("VERIFY PICKUP ROUTE HIT");

  try {
    const { pickupCode } = req.body;

    if (!pickupCode) {
      return res.status(400).json({
        message: "Pickup code is required",
      });
    }

    const order = await Order.findOne({ pickupCode });
console.log("MATCHED ORDER:", order?._id, "PICKED UP:", order?.pickedUp);
    if (!order) {
      return res.status(404).json({
        message: "Invalid QR code. Order not found.",
      });
    }

    if (order.pickedUp) {
      return res.status(400).json({
        message: "This order has already been picked up.",
      });
    }

    if (order.status !== "Ready") {
      return res.status(400).json({
        message: "Order is not Ready for pickup yet.",
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        pickedUp: false,
        status: "Ready",
      },
      {
        $set: {
          pickedUp: true,
          pickedUpAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!updatedOrder) {
      return res.status(400).json({
        message: "Pickup already confirmed or order is not Ready.",
      });
    }

    io.to(`user-${updatedOrder.userId}`).emit(
      "order-status-updated",
      updatedOrder
    );

    return res.json({
      message: "Pickup verified successfully!",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Pickup verification error:", error);

    return res.status(500).json({
      message: "Failed to verify pickup",
    });
  }
});


// ================= SUBMIT ORDER FEEDBACK =================

app.put("/api/orders/:orderId/feedback", async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status !== "Completed") {
      return res.status(400).json({
        message: "Feedback can only be submitted for completed orders",
      });
    }

    order.rating = Number(rating);
    order.feedback = feedback?.trim() || "";

    await order.save();

    res.json({
      message: "Feedback submitted successfully",
      order,
    });
  } catch (error) {
    console.error("Feedback error:", error);

    res.status(500).json({
      message: "Failed to submit feedback",
    });
  }
});


// ================= CANCEL ORDER WITH AUTOMATIC REFUND =================

app.delete("/api/orders/:id", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let cancelledOrder;
    let refundedAmount = 0;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.id,
        status: "Pending",
      }).session(session);

      if (!order) {
        throw new Error("Order not found or cannot be cancelled");
      }

      // Automatic refund for WALLET payments
      if (order.paymentMethod === "WALLET") {

        if (order.paymentStatus !== "PAID") {
          throw new Error("Order payment is not eligible for refund");
        }

        const existingRefund = await WalletTransaction.findOne({
          orderId: order._id,
          type: "REFUND",
          status: "SUCCESS",
        }).session(session);

        if (existingRefund) {
          throw new Error("Refund already processed");
        }

        const user = await User.findOneAndUpdate(
          {
            _id: order.userId,
            role: "student",
          },
          {
            $inc: {
              walletBalance: order.totalPrice,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!user) {
          throw new Error("Student account not found");
        }

        await WalletTransaction.create(
          [
            {
              userId: order.userId,
              type: "REFUND",
              amount: order.totalPrice,
              transactionId: "REFUND-" + crypto.randomUUID(),
              description: "Automatic refund for cancelled order",
              orderId: order._id,
              status: "SUCCESS",
            },
          ],
          { session }
        );

        order.paymentStatus = "REFUNDED";
        refundedAmount = order.totalPrice;
      }

      // Delete cancelled order
      await Order.deleteOne(
        { _id: order._id },
        { session }
      );

      cancelledOrder = order;
    });

    // Notify student after successful transaction
    io.to(`user-${cancelledOrder.userId}`).emit(
      "order-cancelled",
      {
        orderId: cancelledOrder._id,
        refundedAmount,
        message: "Order cancelled successfully",
      }
    );

    res.json({
      message: "Order cancelled successfully!",
      refundedAmount,
    });

  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to cancel order",
    });

  } finally {
    await session.endSession();
  }
});




// ================= GET ALL ORDERS =================

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// ================= GET USER ORDERS =================

app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.params.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
});

// ================= MONGODB CONNECTION =================


 // ================= WALLET APIs =================

// GET WALLET BALANCE AND TRANSACTION HISTORY
app.get("/api/wallet/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "name walletBalance"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const transactions = await WalletTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      balance: user.walletBalance || 0,
      transactions,
    });
  } catch (error) {
    console.error("Wallet Fetch Error:", error);

    res.status(500).json({
      message: "Failed to fetch wallet",
    });
  }
});


// DEMO WALLET RECHARGE
app.post("/api/wallet/recharge", async (req, res) => {
  const { userId, amount } = req.body;

  // Validate User ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  // Validate Recharge Amount
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < 1 ||
    amount > 10000
  ) {
    return res.status(400).json({
      message: "Recharge amount must be between ₹1 and ₹10,000",
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedBalance = 0;

    const transactionId =
      "WALLET-" + crypto.randomUUID();

    await session.withTransaction(async () => {
      // Find student and update wallet balance
      const user = await User.findOneAndUpdate(
        {
          _id: userId,
          role: "student",
        },
        {
          $inc: {
            walletBalance: amount,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!user) {
        throw new Error("Student account not found");
      }

      // Save transaction history
      await WalletTransaction.create(
        [
          {
            userId: user._id,
            type: "RECHARGE",
            amount: amount,
            transactionId: transactionId,
            description: "Demo wallet recharge",
            status: "SUCCESS",
          },
        ],
        { session }
      );

      updatedBalance = user.walletBalance;
    });

    res.json({
      message: "Demo recharge successful",
      balance: updatedBalance,
      transactionId: transactionId,
    });

  } catch (error) {
    console.error("Wallet Recharge Error:", error);

    res.status(500).json({
      message: error.message || "Recharge failed",
    });

  } finally {
    await session.endSession();
  }
});

// ================= MONGODB CONNECTION =================

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "smartcanteen",
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    server.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on http://localhost:${process.env.PORT || 5000}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });
