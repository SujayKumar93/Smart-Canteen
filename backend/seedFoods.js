// Smart Canteen: 100 Foods
require("dotenv").config();
const mongoose = require("mongoose");
const Food = require("./models/Food");

const foods = [
  // SNACKS
  { name: "Veg Burger", emoji: "🍔", price: 60, stock: 25 },
  { name: "Cheese Burger", emoji: "🍔", price: 80, stock: 20 },
  { name: "Paneer Burger", emoji: "🍔", price: 90, stock: 15 },
  { name: "Aloo Tikki Burger", emoji: "🍔", price: 50, stock: 25 },
  { name: "Veg Sandwich", emoji: "🥪", price: 45, stock: 25 },
  { name: "Cheese Sandwich", emoji: "🥪", price: 60, stock: 20 },
  { name: "Grilled Sandwich", emoji: "🥪", price: 70, stock: 20 },
  { name: "Paneer Sandwich", emoji: "🥪", price: 75, stock: 15 },
  { name: "Veg Pizza", emoji: "🍕", price: 120, stock: 15 },
  { name: "Margherita Pizza", emoji: "🍕", price: 100, stock: 15 },
  { name: "Paneer Pizza", emoji: "🍕", price: 150, stock: 12 },
  { name: "French Fries", emoji: "🍟", price: 50, stock: 30 },
  { name: "Peri Peri Fries", emoji: "🍟", price: 65, stock: 25 },
  { name: "Potato Wedges", emoji: "🥔", price: 60, stock: 20 },
  { name: "Veg Momos", emoji: "🥟", price: 60, stock: 25 },
  { name: "Paneer Momos", emoji: "🥟", price: 80, stock: 20 },
  { name: "Fried Momos", emoji: "🥟", price: 70, stock: 20 },
  { name: "Spring Rolls", emoji: "🥢", price: 60, stock: 20 },
  { name: "Samosa", emoji: "🥟", price: 15, stock: 40 },
  { name: "Bread Pakora", emoji: "🥪", price: 25, stock: 30 },
  { name: "Aloo Pakora", emoji: "🍘", price: 30, stock: 25 },
  { name: "Paneer Pakora", emoji: "🍘", price: 60, stock: 20 },
  { name: "Pani Puri", emoji: "🥙", price: 30, stock: 30 },
  { name: "Bhel Puri", emoji: "🥗", price: 35, stock: 25 },
  { name: "Dahi Puri", emoji: "🥙", price: 45, stock: 20 },

  // MEALS
  { name: "Pav Bhaji", emoji: "🍛", price: 80, stock: 20 },
  { name: "Chole Bhature", emoji: "🍽️", price: 90, stock: 20 },
  { name: "Aloo Paratha", emoji: "🫓", price: 40, stock: 25 },
  { name: "Paneer Paratha", emoji: "🫓", price: 60, stock: 20 },
  { name: "Plain Dosa", emoji: "🥞", price: 50, stock: 20 },
  { name: "Masala Dosa", emoji: "🥞", price: 70, stock: 20 },
  { name: "Paneer Dosa", emoji: "🥞", price: 90, stock: 15 },
  { name: "Idli Sambhar", emoji: "🍚", price: 45, stock: 25 },
  { name: "Medu Vada", emoji: "🍩", price: 40, stock: 20 },
  { name: "Veg Uttapam", emoji: "🥞", price: 60, stock: 20 },
  { name: "Veg Fried Rice", emoji: "🍚", price: 80, stock: 20 },
  { name: "Schezwan Fried Rice", emoji: "🍚", price: 95, stock: 15 },
  { name: "Veg Hakka Noodles", emoji: "🍜", price: 80, stock: 20 },
  { name: "Schezwan Noodles", emoji: "🍜", price: 95, stock: 15 },
  { name: "White Sauce Pasta", emoji: "🍝", price: 100, stock: 15 },
  { name: "Red Sauce Pasta", emoji: "🍝", price: 100, stock: 15 },
  { name: "Mac and Cheese", emoji: "🧀", price: 110, stock: 12 },
  { name: "Veg Biryani", emoji: "🍛", price: 100, stock: 20 },
  { name: "Paneer Biryani", emoji: "🍛", price: 130, stock: 15 },
  { name: "Rajma Rice", emoji: "🍚", price: 80, stock: 20 },
  { name: "Chole Rice", emoji: "🍚", price: 80, stock: 20 },
  { name: "Dal Rice", emoji: "🍛", price: 70, stock: 25 },
  { name: "Kadhi Rice", emoji: "🍛", price: 75, stock: 20 },
  { name: "Veg Thali", emoji: "🍱", price: 120, stock: 15 },
  { name: "Paneer Thali", emoji: "🍱", price: 150, stock: 12 },
  { name: "Butter Roti", emoji: "🫓", price: 10, stock: 50 },
  { name: "Tandoori Roti", emoji: "🫓", price: 12, stock: 50 },
  { name: "Butter Naan", emoji: "🫓", price: 30, stock: 30 },
  { name: "Paneer Butter Masala", emoji: "🍛", price: 140, stock: 12 },
  { name: "Shahi Paneer", emoji: "🍛", price: 150, stock: 12 },
  { name: "Dal Makhani", emoji: "🍲", price: 120, stock: 15 },
  { name: "Mix Veg", emoji: "🥘", price: 110, stock: 15 },
  { name: "Jeera Rice", emoji: "🍚", price: 70, stock: 20 },
  { name: "Curd Rice", emoji: "🍚", price: 70, stock: 15 },
  { name: "Veg Pulao", emoji: "🍚", price: 80, stock: 20 },

  // DESSERTS
  { name: "Chocolate Cake", emoji: "🍰", price: 60, stock: 15 },
  { name: "Brownie", emoji: "🍫", price: 50, stock: 20 },
  { name: "Chocolate Muffin", emoji: "🧁", price: 40, stock: 20 },
  { name: "Vanilla Ice Cream", emoji: "🍨", price: 40, stock: 25 },
  { name: "Chocolate Ice Cream", emoji: "🍨", price: 50, stock: 25 },
  { name: "Kulfi", emoji: "🍦", price: 30, stock: 20 },
  { name: "Gulab Jamun", emoji: "🍮", price: 25, stock: 30 },
  { name: "Rasgulla", emoji: "🍡", price: 25, stock: 25 },
  { name: "Jalebi", emoji: "🥨", price: 30, stock: 20 },
  { name: "Fruit Salad", emoji: "🍓", price: 60, stock: 15 },

  // BEVERAGES
  { name: "Cold Drink", emoji: "🥤", price: 30, stock: 40 },
  { name: "Lemon Soda", emoji: "🍋", price: 35, stock: 25 },
  { name: "Fresh Lime Water", emoji: "🍋", price: 25, stock: 30 },
  { name: "Mango Juice", emoji: "🧃", price: 40, stock: 25 },
  { name: "Orange Juice", emoji: "🍊", price: 45, stock: 20 },
  { name: "Apple Juice", emoji: "🧃", price: 50, stock: 15 },
  { name: "Water Bottle", emoji: "💧", price: 20, stock: 50 },
  { name: "Mineral Water", emoji: "💧", price: 25, stock: 40 },
  { name: "Iced Tea", emoji: "🧋", price: 45, stock: 20 },
  { name: "Cold Coffee", emoji: "🥤", price: 60, stock: 20 },
  { name: "Hot Coffee", emoji: "☕", price: 30, stock: 30 },
  { name: "Cappuccino", emoji: "☕", price: 60, stock: 15 },
  { name: "Hot Tea", emoji: "🍵", price: 15, stock: 40 },
  { name: "Masala Chai", emoji: "🍵", price: 20, stock: 35 },
  { name: "Hot Chocolate", emoji: "☕", price: 55, stock: 15 },
  { name: "Strawberry Milkshake", emoji: "🥤", price: 60, stock: 15 },
  { name: "Chocolate Milkshake", emoji: "🥤", price: 65, stock: 15 },
  { name: "Vanilla Milkshake", emoji: "🥤", price: 60, stock: 15 },
  { name: "Lassi", emoji: "🥛", price: 35, stock: 25 },
  { name: "Mango Lassi", emoji: "🥭", price: 45, stock: 20 },
  { name: "Buttermilk", emoji: "🥛", price: 25, stock: 25 },
  { name: "Energy Drink", emoji: "⚡", price: 80, stock: 12 },
  { name: "Green Tea", emoji: "🍵", price: 25, stock: 20 },
  { name: "Protein Smoothie", emoji: "🥤", price: 90, stock: 10 },
  { name: "Banana Shake", emoji: "🍌", price: 50, stock: 20 },

  // MORE SNACKS
  { name: "Corn Cheese Balls", emoji: "🌽", price: 60, stock: 20 },
  { name: "Garlic Bread", emoji: "🥖", price: 55, stock: 20 },
  { name: "Nachos", emoji: "🧀", price: 70, stock: 15 },
  { name: "Masala Maggi", emoji: "🍜", price: 35, stock: 30 },
  { name: "Cheese Maggi", emoji: "🍜", price: 50, stock: 25 },
];

async function seedFoods() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "smartcanteen",
    });

    console.log("MongoDB Connected Successfully!");

    let added = 0;
    let updated = 0;

    for (const food of foods) {
      const result = await Food.updateOne(
        { name: food.name },
        { $set: food },
        { upsert: true }
      );

      if (result.upsertedCount > 0) added++;
      else if (result.modifiedCount > 0) updated++;
    }

    console.log(`New foods added: ${added}`);
    console.log(`Existing foods updated: ${updated}`);
    console.log(`Total processed: ${foods.length}`);
  } catch (error) {
    console.error("Food seed error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedFoods();