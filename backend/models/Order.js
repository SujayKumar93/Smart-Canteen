
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
  type: String,
  enum: ["CASH", "WALLET"],
  default: "CASH",
},

paymentStatus: {
  type: String,
  enum: ["PENDING", "PAID", "REFUNDED"],
  default: "PENDING",
},

    tokenNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed"],
      default: "Pending",
    },

    // QR pickup verification
    pickupCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    pickedUp: {
      type: Boolean,
      default: false,
    },

    pickedUpAt: {
      type: Date,
      default: null,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
