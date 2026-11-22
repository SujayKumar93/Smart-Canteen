
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import { QRCodeSVG } from "qrcode.react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
import { Html5QrcodeScanner } from "html5-qrcode";

const initialFoods = [
  { id: "1", name: "Veg Burger", price: 60, emoji: "🍔" },
  { id: "2", name: "Samosa", price: 15, emoji: "🥟" },
  { id: "3", name: "Masala Dosa", price: 50, emoji: "🥞" },
  { id: "4", name: "Cold Drink", price: 30, emoji: "🥤" },
];

function getCategory(name = "") {
  const food = name.toLowerCase();

  if (/burger|samosa|sandwich|fries|snack|roll|momo/.test(food)) {
    return "Snacks";
  }

  if (/dosa|rice|thali|meal|roti|paneer|biryani/.test(food)) {
    return "Meals";
  }

  if (/drink|juice|tea|coffee|shake|water|lassi/.test(food)) {
    return "Beverages";
  }

  return "Other";
}

function getFoodId(food) {
  return food._id || food.id;
}
// REAL-TIME THEME DETECTION
function getTimeTheme() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) {
    return "morning";
  }

  if (hour >= 11 && hour < 16) {
    return "afternoon";
  }

  if (hour >= 16 && hour < 19) {
    return "evening";
  }

  return "night";
}
export default function App() {
  const [user, setUser] = useState(null);
  // AUTOMATIC TIME-BASED THEME
const [timeTheme, setTimeTheme] = useState(getTimeTheme);
const [themeMode, setThemeMode] = useState("auto");

const activeTheme =
  themeMode === "auto" ? timeTheme : themeMode;
useEffect(() => {
  const updateTheme = () => {
    setTimeTheme(getTimeTheme());
  };

  updateTheme();

  const themeInterval = setInterval(updateTheme, 60000);

  return () => clearInterval(themeInterval);
}, []);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activePage, setActivePage] = useState("menu");
  const [foods, setFoods] = useState(initialFoods);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodCategory, setFoodCategory] = useState("All");

  const [cart, setCart] = useState([]);
  
const [favoriteFoods, setFavoriteFoods] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("smartCanteenFavorites") || "[]"
    );
  } catch {
    return [];
  }
});


const toggleFavorite = (food) => {
  const foodId = String(getFoodId(food));
  const isAlreadyFavorite = favoriteFoods.includes(foodId);

  const updated = isAlreadyFavorite
    ? favoriteFoods.filter((id) => id !== foodId)
    : [...favoriteFoods, foodId];

  localStorage.setItem(
    "smartCanteenFavorites",
    JSON.stringify(updated)
  );

  setFavoriteFoods(updated);

  setNotice(
    isAlreadyFavorite
      ? `💔 ${food.name} removed from Favorites`
      : `❤️ ${food.name} added to Favorites`
  );
};


  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
const [scannerResult, setScannerResult] = useState("");
const [scannerResultType, setScannerResultType] = useState("info");
const [scannerRunning, setScannerRunning] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({
  name: "",
  price: "",
  emoji: "🍽️",
  stock: "",
});
  const [notice, setNotice] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
const [feedbackRating, setFeedbackRating] = useState(5);
const [feedbackText, setFeedbackText] = useState("");
const [feedbackLoading, setFeedbackLoading] = useState(false);

  // PROFILE STATES
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("success");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
// WALLET STATES
const [paymentMethod, setPaymentMethod] = useState("CASH");
const [walletBalance, setWalletBalance] = useState(0);
const [walletTransactions, setWalletTransactions] = useState([]);
const [walletLoading, setWalletLoading] = useState(false);
const [rechargeAmount, setRechargeAmount] = useState(100);
const [rechargeLoading, setRechargeLoading] = useState(false);
  const isAdmin = user?.role === "admin";
  // LOAD WALLET DATA
const loadWallet = async () => {
  if (!user?._id) return;

  try {
    setWalletLoading(true);

    const response = await fetch(
      `${API}/wallet/${user._id}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Wallet loading failed");
    }

    setWalletBalance(data.balance || 0);
    setWalletTransactions(data.transactions || []);

  } catch (error) {
    console.error("Wallet Loading Error:", error);
  } finally {
    setWalletLoading(false);
  }
};
// RECHARGE WALLET
const handleWalletRecharge = async () => {
  const amount = Number(rechargeAmount);

  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    alert("Enter an amount between ₹1 and ₹10,000");
    return;
  }

  try {
    setRechargeLoading(true);

    const response = await fetch(`${API}/wallet/recharge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user._id,
        amount: amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Recharge failed");
    }

    setWalletBalance(data.balance);
    await loadWallet();

    setNotice(`💰 ₹${amount} added successfully to your wallet!`);
setTimeout(() => setNotice(""), 4500);

  } catch (error) {
    console.error("Wallet Recharge Error:", error);
    setNotice(`❌ ${error.message || "Recharge failed"}`);
setTimeout(() => setNotice(""), 4500);
  } finally {
    setRechargeLoading(false);
  }
};
  useEffect(() => {
  if (!user?._id) return;

  const socket = io(
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
    : "http://localhost:5000"
);

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    if (user.role === "admin") {
      socket.emit("join-admin");
    } else {
      socket.emit("join-user", user._id);
    }
  });

  socket.on("order-placed", (order) => {
    setOrders((prev) =>
      prev.some((x) => x._id === order._id) ? prev : [order, ...prev]
    );
    setNotice(`🎉 Order #${order.tokenNumber} placed successfully!`);
  });

  socket.on("new-order", (order) => {
    setAllOrders((prev) =>
      prev.some((x) => x._id === order._id) ? prev : [order, ...prev]
    );
    setNotice(`🔔 New Order Received! Token #${order.tokenNumber}`);
  });

  socket.on("order-status-updated", (updatedOrder) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );

    setSelectedOrder((prev) =>
      prev?._id === updatedOrder._id ? updatedOrder : prev
    );

    setNotice(
      `🔔 Order #${updatedOrder.tokenNumber} status: ${updatedOrder.status}`
    );
  });

  return () => socket.disconnect();
}, [user]);

// LOAD WALLET WHEN WALLET PAGE OPENS
useEffect(() => {
  if (activePage === "wallet" && user?._id) {
    loadWallet();
  }
}, [activePage, user]);
  // QR scanner setup
  useEffect(() => {
    if (!isAdmin || activePage !== "admin-orders") return;

    let scanInProgress = false;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        if (scanInProgress) return;
        scanInProgress = true;

        setScannerResultType("info");
        setScannerResult("Verifying pickup...");

        try {
          const response = await fetch(
            `${API}/orders/verify-pickup`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                pickupCode: decodedText,
              }),
            }
          );

          const data = await response.json();
          console.log("PICKUP API RESPONSE:", data);

          const message = data.message || "";

          if (
            message.toLowerCase().includes("already been picked up")
          ) {
            setScannerResultType("duplicate");
            setScannerResult(
              "Already Collected — This order has already been picked up."
            );
          } else if (response.ok) {
            setScannerResultType("success");
            setScannerResult(
              "Pickup Verified Successfully!"
            );
          } else {
            setScannerResultType("error");
            setScannerResult(
              message || "Pickup verification failed."
            );
          }
        } catch (error) {
          console.error("Pickup verification error:", error);
          setScannerResultType("error");
          setScannerResult(
            "Server connection failed. Please try again."
          );
        } finally {
          scanInProgress = false;
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch((error) => {
        console.log("Scanner cleanup:", error);
      });
    };
  }, [isAdmin, activePage]);


  // Restore remembered login
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rememberedUser"));

      if (saved?.user && saved.expiresAt > Date.now()) {
        setUser(saved.user);
      } else {
        localStorage.removeItem("rememberedUser");
      }
    } catch {
      localStorage.removeItem("rememberedUser");
    }
  }, []);

  // Load foods from backend
  async function loadFoods() {
    try {
      const response = await fetch(`${API}/foods`);
      if (!response.ok) throw new Error("Food loading failed");

      const data = await response.json();
      if (Array.isArray(data)) {
        setFoods(
          data.map((food) => ({
  ...food,
  id: food._id || food.id,
  emoji: food.emoji || "🍽️",
}))
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  // Load student orders
  async function loadMyOrders(currentUser = user) {
    if (!currentUser?._id || currentUser.role === "admin") return;

    try {
      const response = await fetch(
        `${API}/orders/user/${currentUser._id}`
      );

      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (error) {
      console.error(error);
    }
  }

  // Load all orders for admin
  async function loadAllOrders() {
    try {
      const response = await fetch(`${API}/orders`);
      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) setAllOrders(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
  if (!user) return;

  loadMyOrders(user);

  if (user.role === "admin") {
    loadAllOrders();
  }
}, [user]);

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch = food.name
        .toLowerCase()
        .includes(foodSearch.toLowerCase());

      const matchesCategory =
        foodCategory === "All" ||
        getCategory(food.name) === foodCategory;

      return matchesSearch && matchesCategory;
    });
  }, [foods, foodSearch, foodCategory]);

  const visibleAdminFoods = useMemo(() => {
    return foods.filter((food) =>
      food.name.toLowerCase().includes(adminSearch.toLowerCase())
    );
  }, [foods, adminSearch]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Login / Register
  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login" ? "/login" : "/register";

      const payload =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : authForm;

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      const loggedUser = data.user || data;

      if (!loggedUser?._id) {
        throw new Error("User details were not returned by server");
      }

      setUser(loggedUser);
      setActivePage(
        loggedUser.role === "admin" ? "admin-foods" : "menu"
      );

      setAuthMessage("");

      // Remember for 10 days
      localStorage.setItem(
        "rememberedUser",
        JSON.stringify({
          user: loggedUser,
          expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
        })
      );
    } catch (error) {
      setAuthMessage(error.message || "Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("rememberedUser");
    setUser(null);
    setCart([]);
    setOrders([]);
    setAllOrders([]);
    setActivePage("menu");
    setAuthForm({
      name: "",
      email: "",
      password: "",
      role: "student",
    });
  }

async function handleSaveProfile(event) {
  event.preventDefault();

  if (!user?._id) {
    setProfileMessage("Please log in again.");
    setProfileMessageType("error");
    return;
  }

  if (!profileForm.name.trim() || !profileForm.email.trim()) {
    setProfileMessage("Name and email are required.");
    setProfileMessageType("error");
    return;
  }

  setIsSavingProfile(true);
  setProfileMessage("");

  try {
    const response = await fetch(
      `${API}/users/${user._id}/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          password: profileForm.password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Profile update failed.");
    }

    setUser(data.user);

    const savedLogin = localStorage.getItem("rememberedUser");

    if (savedLogin) {
      const loginData = JSON.parse(savedLogin);

      localStorage.setItem(
        "rememberedUser",
        JSON.stringify({
          ...loginData,
          user: { ...loginData.user, ...data.user },
        })
      );
    }

    setProfileForm({
      name: data.user.name,
      email: data.user.email,
      password: "",
    });

    setIsEditingProfile(false);
    setProfileMessage("Profile updated successfully!");
    setProfileMessageType("success");
  } catch (error) {
    setProfileMessage(
      error.message || "Could not update profile."
    );
    setProfileMessageType("error");
  } finally {
    setIsSavingProfile(false);
  }
}


// Cart
function addToCart(food) {
  const id = getFoodId(food);
  const stock = Number(food.stock ?? 0);

  if (stock <= 0) {
    setNotice(`${food.name} is out of stock`);
    return;
  }

  setCart((previous) => {
    const found = previous.find((item) => item.id === id);

    if (found) {
      if (found.quantity >= stock) {
        setNotice(`Only ${stock} ${food.name} available`);
        return previous;
      }

      return previous.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [
      ...previous,
      {
        id,
        name: food.name,
        price: Number(food.price),
        emoji: food.emoji || "🍽️",
        stock,
        quantity: 1,
      },
    ];
  });

  setNotice(`${food.name} added to cart`);
  setTimeout(() => setNotice(""), 2500);
}

function changeQuantity(id, amount) {
  setCart((previous) =>
    previous
      .map((item) => {
        if (item.id !== id) return item;

        const food = foods.find(
          (foodItem) => getFoodId(foodItem) === id
        );

        const stock = Number(food?.stock ?? item.stock ?? 0);
        const nextQuantity = item.quantity + amount;

        if (nextQuantity > stock) {
          setNotice(`Only ${stock} ${item.name} available`);
          return item;
        }

        return {
          ...item,
          quantity: nextQuantity,
        };
      })
      .filter((item) => item.quantity > 0)
  );
}

  // Place order
  async function placeOrder() {
    if (!user) return;

    if (cart.length === 0) {
      setNotice("Your cart is empty");
      return;
    }

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          customerName: user.name,
          items: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice: cartTotal,
          tokenNumber: 101 + orders.length,
status: "Pending",
paymentMethod: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order failed");
      }
if (paymentMethod === "WALLET") {
  await loadWallet();
}
      setCart([]);
      await loadFoods();
      setNotice(`🎉 Order #${data.order.tokenNumber} placed successfully!`);
      setActivePage("my-orders");
      loadMyOrders(user);
    } catch (error) {
      setNotice(error.message || "Could not place order");
    }
  }
async function submitFeedback() {
  if (!feedbackOrder) return;

  try {
    setFeedbackLoading(true);

    const response = await fetch(
      `${API}/orders/${feedbackOrder._id}/feedback`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: feedbackRating,
          feedback: feedbackText,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to submit feedback"
      );
    }

    setOrders((prev) =>
      prev.map((order) =>
        order._id === data.order._id
          ? data.order
          : order
      )
    );

    setFeedbackOrder(null);
    setFeedbackText("");
    setFeedbackRating(5);

    setNotice("⭐ Feedback submitted successfully!");
  } catch (error) {
    setNotice(error.message);
  } finally {
    setFeedbackLoading(false);
  }
}
  // Cancel order
  async function cancelOrder(orderId) {
    const confirmed = window.confirm("Cancel this order?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not cancel order");
      }

      setNotice("Order cancelled");
      loadMyOrders(user);
    } catch (error) {
      setNotice(error.message);
    }
  }

  // Admin: update order status
  async function updateOrderStatus(orderId, status) {
    try {
      const response = await fetch(
        `${API}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Status update failed");
      }

      setNotice("Order status updated");
      loadAllOrders();
    } catch (error) {
      setNotice(error.message);
    }
  }

  // Admin: add/edit food
  function openAddFood() {
    setEditingFood(null);
    setFoodForm({ name: "", price: "", emoji: "🍽️" });
    setFoodModalOpen(true);
  }

  
function openEditFood(food) {
  setEditingFood(food);
  setFoodForm({
    name: food.name,
    price: food.price,
    emoji: food.emoji || "🍽️",
    stock: food.stock ?? 0,
  });
  setFoodModalOpen(true);
}


async function saveFood(event) {
  event.preventDefault();

  const payload = {
    name: foodForm.name.trim(),
    price: Number(foodForm.price),
    emoji: foodForm.emoji || "🍽️",
    stock: Number(foodForm.stock),
  };

  if (
    !payload.name ||
    !Number.isFinite(payload.price) ||
    payload.price <= 0 ||
    !Number.isInteger(payload.stock) ||
    payload.stock < 0
  ) {
    setNotice("Enter a valid food name, price, and stock");
    return;
  }

  try {
    const url = editingFood
      ? `${API}/foods/${getFoodId(editingFood)}`
      : `${API}/foods`;

    const response = await fetch(url, {
      method: editingFood ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
  throw new Error(
    `${data.message || "Could not save food"}: ${data.error || "No details"}`
  );
}

    setFoodModalOpen(false);
    setNotice(editingFood ? "Food updated" : "Food added");
    loadFoods();
  } catch (error) {
    setNotice(error.message);
  }
}

  async function deleteFood(food) {
    if (!window.confirm(`Delete ${food.name}?`)) return;

    try {
      const response = await fetch(
        `${API}/foods/${getFoodId(food)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Could not delete food");
      }

      setNotice("Food deleted");
      loadFoods();
    } catch (error) {
      setNotice(error.message);
    }
  }

  // Login screen
  if (!user) {
    return (
     <div className={`auth-screen theme-${activeTheme}`}>
        <div className="auth-brand">
          <div className="brand-icon">🍴</div>
          <h1>Smart<span>Canteen</span></h1>
          <p>Your campus food, made easy.</p>
        </div>

        <form className="auth-card" onSubmit={handleAuth}>
          <h2>
            {authMode === "login" ? "Welcome back!" : "Create account"}
          </h2>
          <p className="muted">
            {authMode === "login"
              ? "Login to continue to your canteen"
              : "Register to start ordering"}
          </p>

          {authMode === "register" && (
            <label>
              Full name
              <input
                required
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, name: e.target.value })
                }
                placeholder="Enter your name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              required
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              placeholder="Enter password"
            />
          </label>

          {authMode === "register" && (
            <label>
              Account type
              <select
                value={authForm.role}
                onChange={(e) =>
                  setAuthForm({ ...authForm, role: e.target.value })
                }
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}

          {authMessage && (
            <div className="auth-message error">{authMessage}</div>
          )}

          <button className="primary-btn full-width" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : authMode === "login"
              ? "Login →"
              : "Create account →"}
          </button>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setAuthMessage("");
              }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </form>
      </div>
    );
  }



const studentNav = [
  { id: "menu", icon: "⌂", label: "Food Menu" },
  { id: "my-orders", icon: "▤", label: "My Orders" },
  { id: "wallet", icon: "💳", label: "My Wallet" },
  { id: "favorites", icon: "❤️", label: "My Favorites" },
  { id: "profile", icon: "👤", label: "My Profile" },
];


const adminNav = [
  { id: "admin-foods", icon: "▦", label: "Food Management" },
  { id: "admin-orders", icon: "▤", label: "Order Queue" },
  { id: "admin-feedback", icon: "⭐", label: "Customer Feedback" },
  { id: "profile", icon: "👤", label: "My Profile" },
];


  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <div className={`dashboard theme-${activeTheme}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🍴</div>
          <div>
            <h2>Smart<span>Canteen</span></h2>
            <small>Campus food made easy</small>
          </div>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={
                activePage === item.id ? "nav-item active" : "nav-item"
              }
             
onClick={() => {
  setActivePage(item.id);

  if (item.id === "profile") {
    setIsEditingProfile(false);
    setProfileMessage("");
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
    });
  }
}}

            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === "my-orders" && orders.length > 0 && (
                <span className="nav-count">{orders.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <strong>{user.name || "User"}</strong>
              <small>{isAdmin ? "Administrator" : "Student"}</small>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              Dashboard <span>/</span>{" "}
              {navItems.find((item) => item.id === activePage)?.label ||
                "Dashboard"}
            </div>
            <div className="theme-switcher">
  <span>🎨 Theme</span>
  <select
    value={themeMode}
    onChange={(e) => setThemeMode(e.target.value)}
  >
    <option value="auto">Auto</option>
    <option value="morning">Morning</option>
    <option value="afternoon">Afternoon</option>
    <option value="evening">Evening</option>
    <option value="night">Night</option>
  </select>
</div>
            <h1>
              {isAdmin
  ? activePage === "admin-foods"
    ? "Food Management"
    : activePage === "admin-feedback"
    ? "Customer Feedback"
    : "Order Queue"
  : activePage === "my-orders"
  ? "My Orders"
  : activePage === "wallet"
  ? "My Wallet"
  : activePage === "favorites"
  ? "My Favorites"
  : activePage === "profile"
  ? "My Profile"
  : "Food Menu"}
            </h1>
          </div>

          {!isAdmin && (
            <button
              className="cart-top-button"
              onClick={() => setActivePage("cart")}
            >
              🛒 Cart
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
          )}
        </header>

        {notice && (
          <div className="notice-bar">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {/* STUDENT: FOOD MENU */}
        {!isAdmin && activePage === "menu" && (
          <section className="food-menu-section">
            <div className="welcome-banner">
              <div>
                <span className="eyebrow">WELCOME TO SMART CANTEEN</span>
                <h2>Hungry, {user.name?.split(" ")[0] || "there"}?</h2>
                <p>Order your favourites and skip the queue.</p>
              </div>
              <div className="banner-emoji">🍔</div>
            </div>

            <div className="section-heading">
              <div>
                <h2>🍽️ Explore Menu</h2>
                <p>Freshly prepared, just for you.</p>
              </div>
              <span className="food-count">
                {filteredFoods.length} items
              </span>
            </div>

            <div className="menu-search-toolbar">
              <label className="menu-search-box">
                <span className="search-icon">⌕</span>
                <input
                  type="search"
                  placeholder="Search food by name..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                />
                {foodSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setFoodSearch("")}
                  >
                    ×
                  </button>
                )}
              </label>

              <select
                className="menu-category-select"
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Snacks">Snacks</option>
                <option value="Meals">Meals</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="category-chips">
              {["All", "Snacks", "Meals", "Beverages", "Other"].map(
                (category) => (
                  <button
                    key={category}
                    className={
                      foodCategory === category
                        ? "category-chip selected"
                        : "category-chip"
                    }
                    onClick={() => setFoodCategory(category)}
                  >
                    {category}
                  </button>
                )
              )}
            </div>

  
<div className="food-grid">
  {filteredFoods.map((food) => {
    const stock = Number(food.stock ?? 0);
    const outOfStock = stock <= 0;

    return (
      <article className="food-card" key={getFoodId(food)}>
        
<div className="food-card-image">
  <span>{food.emoji || "🍽️"}</span>

  <span className="food-category-badge">
    {getCategory(food.name)}
  </span>

  <button
    type="button"
    className={`favorite-btn ${
      favoriteFoods.includes(String(getFoodId(food)))
        ? "is-favorite"
        : ""
    }`}
    onClick={() => toggleFavorite(food)}
    aria-label={
      favoriteFoods.includes(String(getFoodId(food)))
        ? "Remove from favorites"
        : "Add to favorites"
    }
    title="Add to Favorites"
  >
    {favoriteFoods.includes(String(getFoodId(food))) ? "❤️" : "🤍"}
  </button>
</div>


        <div className="food-card-content">
          <h3>{food.name}</h3>

          <p className="food-description">
            Fresh and delicious
          </p>

          <p className="food-stock">
            {outOfStock
              ? "Out of Stock"
              : `Available: ${stock}`}
          </p>

          <div className="food-card-footer">
            <strong className="food-price">₹{food.price}</strong>

            <button
              className="add-cart-btn"
              disabled={outOfStock}
              onClick={() => addToCart(food)}
            >
              {outOfStock ? "Unavailable" : "+ Add"}
            </button>
          </div>
        </div>
      </article>
    );
  })}

  {filteredFoods.length === 0 && (
    <div className="empty-state">
      <span>🔎</span>
      <h3>No food found</h3>
      <p>Try another search or category.</p>
      <button
        className="secondary-btn"
        onClick={() => {
          setFoodSearch("");
          setFoodCategory("All");
        }}
      >
        Clear filters
      </button>
    </div>
  )}
</div>
          </section>
        )}

        {/* STUDENT: CART */}
        {!isAdmin && activePage === "cart" && (
          <section className="content-panel">
            <div className="section-heading">
              <div>
                <h2>🛒 Your Cart</h2>
                <p>Review your items before placing an order.</p>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state">
                <span>🛍️</span>
                <h3>Your cart is empty</h3>
                <p>Add some delicious food from the menu.</p>
                <button
                  className="primary-btn"
                  onClick={() => setActivePage("menu")}
                >
                  Browse menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {cart.map((item) => (
                    <div className="cart-row" key={item.id}>
                      <div className="cart-food-emoji">{item.emoji}</div>
                      <div className="cart-food-info">
                        <strong>{item.name}</strong>
                        <span>₹{item.price} each</span>
                      </div>

                      <div className="quantity-control">
                        <button
                          onClick={() => changeQuantity(item.id, -1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => changeQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        ₹{item.price * item.quantity}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Total amount</span>
                    <strong>₹{cartTotal}</strong>
                  </div>
                  <label>
  Payment Method
  <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
  >
    <option value="CASH">Cash at Canteen</option>
    <option value="WALLET">Pay Using Wallet (₹{walletBalance})</option>
  </select>
</label>
                  <button className="primary-btn" onClick={placeOrder}>
                    Place Order →
                  </button>
                </div>
              </>
            )}
          </section>
        )}

{/* STUDENT: MY FAVORITES */}
{!isAdmin && activePage === "favorites" && (
  <section className="content-panel">
    <div className="section-heading">
      <div>
        <h2>❤️ My Favorites</h2>
        <p>Your saved foods, all in one place.</p>
      </div>
      <span>{favoriteFoods.length} saved</span>
    </div>

    {favoriteFoods.filter((id) =>
      foods.some((food) => String(getFoodId(food)) === id)
    ).length === 0 ? (
      <div className="empty-state">
        <span>🤍</span>
        <h3>No favorites yet</h3>
        <p>Open Food Menu and tap the heart on a food you like.</p>
        <button
          className="primary-btn"
          onClick={() => setActivePage("menu")}
        >
          Explore menu
        </button>
      </div>
    ) : (
      <div className="food-grid">
        {foods
          .filter((food) =>
            favoriteFoods.includes(String(getFoodId(food)))
          )
          .map((food) => {
            const stock = Number(food.stock ?? 0);

            return (
              <article className="food-card" key={getFoodId(food)}>
                <div className="food-card-image">
                  <span>{food.emoji || "🍽️"}</span>
                  <button
                    type="button"
                    className="favorite-btn is-favorite"
                    onClick={() => toggleFavorite(food)}
                    title="Remove from Favorites"
                  >
                    ❤️
                  </button>
                </div>

                <div className="food-card-content">
                  <h3>{food.name}</h3>
                  <p className="food-description">
                    Fresh and delicious
                  </p>
                  <p className="food-stock">
                    {stock <= 0 ? "Out of Stock" : `Available: ${stock}`}
                  </p>
                  <div className="food-card-footer">
                    <strong className="food-price">
                      ₹{food.price}
                    </strong>
                    <button
                      className="add-cart-btn"
                      disabled={stock <= 0}
                      onClick={() => addToCart(food)}
                    >
                      {stock <= 0 ? "Unavailable" : "+ Add"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    )}
  </section>
)}

        {/* STUDENT: MY ORDERS */}
        {!isAdmin && activePage === "my-orders" && (
          <section className="content-panel">
            <div className="section-heading">
              <div>
                <h2>📋 My Orders</h2>
                <p>Track your orders and their current status.</p>
              </div>
              <button
                className="secondary-btn"
                onClick={() => loadMyOrders(user)}
              >
                ↻ Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                <span>🧾</span>
                <h3>No orders yet</h3>
                <p>Your placed orders will appear here.</p>
                <button
                  className="primary-btn"
                  onClick={() => setActivePage("menu")}
                >
                  Explore menu
                </button>
              </div>
            ) : (
              <div className="orders-grid">
                {orders.map((order) => (
                  <article
                    className="order-card"
                    key={order._id}
                  >
                    <div className="order-card-top">
                      <div>
                        <span className="muted">Token number</span>
                        <h3>#{order.tokenNumber}</h3>
                      </div>
                      <span
                        className={`status-badge ${(order.status || "Pending").toLowerCase()}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <div className="order-items">
                      {(order.items || []).map((item, index) => (
                        <div key={`${item.name}-${index}`}>
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <strong>
                            ₹{item.price * item.quantity}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-bottom">
                      <strong>Total: ₹{order.totalPrice}</strong>
                      <button
                        className="secondary-btn"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View details
                      </button>
                    </div>
{order.pickupCode && (
  <div className="pickup-qr-section">
    <h4>📱 Order Pickup QR</h4>
    <p>Show this QR code to the canteen admin when collecting your order.</p>
    <QRCodeSVG
      value={order.pickupCode}
      size={160}
      level="H"
    />
    <p className="muted">Token: #{order.tokenNumber}</p>
  </div>
)}
                    {order.status === "Pending" && (
                      <button
                        className="text-danger-btn"
                        onClick={() => cancelOrder(order._id)}
                      >
                        Cancel order
                      </button>
                    )}
{order.status === "Pending" && (
  <button
    className="text-danger-btn"
    onClick={() => cancelOrder(order._id)}
  >
    Cancel order
  </button>
)}

{order.status === "Completed" && (
  <button
    className="secondary-btn"
    onClick={() => {
      setFeedbackOrder(order);
      setFeedbackRating(order.rating || 5);
      setFeedbackText(order.feedback || "");
    }}
  >
    ⭐ Rate Order
  </button>
)}
</article>
))}
</div>
)}
</section>
)}

        {/* ADMIN: FOOD MANAGEMENT */}
        {isAdmin && activePage === "admin-foods" && (
          <section className="content-panel">
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-icon orange">🍽️</span>
                <div>
                  <p>Total food items</p>
                  <h3>{foods.length}</h3>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon green">📦</span>
                <div>
                  <p>Total orders</p>
                  <h3>{allOrders.length}</h3>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon blue">⏳</span>
                <div>
                  <p>Pending orders</p>
                  <h3>
                    {
                      allOrders.filter(
                        (order) => order.status === "Pending"
                      ).length
                    }
                  </h3>
                </div>
              </div>
            </div>

            <div className="section-heading admin-section-heading">
              <div>
                <h2>Food Items</h2>
                <p>Add, edit, or remove items from your canteen menu.</p>
              </div>
              <button className="primary-btn" onClick={openAddFood}>
                + Add New Food
              </button>
            </div>

            <div className="food-management-toolbar">
              <label className="food-search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search food items..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
                {adminSearch && (
                  <button
                    type="button"
                    onClick={() => setAdminSearch("")}
                  >
                    ×
                  </button>
                )}
              </label>
              <span className="food-count">
                {visibleAdminFoods.length} items
              </span>
            </div>

            <div className="table-container">
              <table className="food-management-table">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAdminFoods.map((food) => (
                    <tr key={getFoodId(food)}>
                      <td>
                        <div className="table-food-name">
                          <span className="table-food-emoji">
                            {food.emoji || "🍽️"}
                          </span>
                          <strong>{food.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="table-category">
                          {getCategory(food.name)}
                        </span>
                      </td>
                      <td>
                        <strong>₹{food.price}</strong>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="edit-btn"
                            onClick={() => openEditFood(food)}
                          >
                            ✎ Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteFood(food)}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleAdminFoods.length === 0 && (
                    <tr>
                      <td colSpan="4" className="table-empty">
                        No food items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ADMIN: ORDER QUEUE */}
        {isAdmin && activePage === "admin-orders" && (
          <section className="content-panel">
            <div className="section-heading">
              <div>
                <h2>📋 Order Queue</h2>
                <p>Manage incoming orders and update their status.</p>
              </div>
              <button
                className="secondary-btn"
                onClick={loadAllOrders}
              >
                ↻ Refresh
              </button>
            </div>

<div className="pickup-scanner-panel">
  <div className="pickup-scanner-heading">
    <div className="pickup-scanner-icon">⌗</div>

    <div className="pickup-scanner-title">
      <span className="pickup-eyebrow">
        SMART CANTEEN / ADMIN TOOLS
      </span>
      <h3>Pickup Verification</h3>
      <p>
        Scan the student's QR code to verify and confirm order collection.
      </p>
    </div>

    <span className="pickup-live-pill">
      <span className="pickup-live-dot" />
      LIVE SCANNER
    </span>
  </div>

  <div className="pickup-scanner-layout">
    <div className="pickup-camera-card">
      <div className="pickup-camera-heading">
        <span>CAMERA SCANNER</span>
        <span className="pickup-camera-tag">QR</span>
      </div>

      <div className="pickup-camera-frame">
        <div
          id="qr-reader"
          style={{ width: "100%", maxWidth: "400px" }}
        />
      </div>

      <p className="pickup-camera-hint">
        Position the student's QR code inside the scanning frame.
      </p>
    </div>

    <div className="pickup-verification-card">
      <span className="pickup-eyebrow">VERIFICATION STATUS</span>

      {scannerResult ? (
        <div
          className={`pickup-result ${scannerResultType}`}
          role="status"
        >
          <span className="pickup-result-icon">
            {scannerResultType === "success"
              ? "✓"
              : scannerResultType === "duplicate"
              ? "⚠"
              : scannerResultType === "error"
              ? "✕"
              : "⏳"}
          </span>

          <div>
            <strong>
              {scannerResultType === "success"
                ? "PICKUP VERIFIED"
                : scannerResultType === "duplicate"
                ? "ALREADY COLLECTED"
                : scannerResultType === "error"
                ? "VERIFICATION FAILED"
                : "VERIFYING ORDER"}
            </strong>
            <p>{scannerResult}</p>
          </div>
        </div>
      ) : (
        <div className="pickup-idle-state">
          <div className="pickup-idle-icon">⌗</div>
          <h4>Ready to scan</h4>
          <p>
            Waiting for an order QR code. Scan a student's code
            to see the pickup result here.
          </p>
        </div>
      )}

      <div className="pickup-security-note">
        <span>🛡️</span>
        <p>
          Each order can be picked up only once. Previously
          collected orders will be flagged automatically.
        </p>
      </div>
    </div>
  </div>
</div>

            {allOrders.length === 0 ? (
              <div className="empty-state">
                <span>📭</span>
                <h3>No orders yet</h3>
                <p>New student orders will appear here.</p>
              </div>
            ) : (
              <div className="orders-grid">
               
{[...allOrders]
  .sort(
    (a, b) =>
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
  )
  .map((order, index) => (

                  <article
                    
className={`order-card ${index === 0 ? "latest-order-card" : ""}`}

                    key={order._id}
                  >
                    <div className="order-card-top">
                      <div>
                        
<div className="order-token-heading">
  <span className="muted">Token number</span>
  {index === 0 && (
    <span className="latest-order-badge">
      ✦ LATEST ORDER
    </span>
  )}
</div>
<h3>#{order.tokenNumber}</h3>

                      </div>
                      <span
                        className={`status-badge ${(order.status || "Pending").toLowerCase()}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <p className="admin-customer">
                      Customer: <strong>{order.customerName}</strong>
                    </p>

                    <div className="order-items">
                      {(order.items || []).map((item, index) => (
                        <div key={`${item.name}-${index}`}>
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <strong>
                            ₹{item.price * item.quantity}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-bottom">
                      <strong>Total: ₹{order.totalPrice}</strong>
                      <select
                        className="status-select"
                        value={order.status || "Pending"}
                        onChange={(e) =>
                          updateOrderStatus(order._id, e.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        

{/* ADMIN: CUSTOMER FEEDBACK */}
{isAdmin && activePage === "admin-feedback" && (
  <section className="content-panel">
    <div className="section-heading">
      <div>
        <h2>⭐ Customer Feedback</h2>
        <p>Read ratings and reviews shared by students.</p>
      </div>

      <button
        className="secondary-btn"
        onClick={loadAllOrders}
      >
        ↻ Refresh
      </button>
    </div>

    {allOrders.filter(
      (order) => order.feedback || order.rating
    ).length === 0 ? (
      <div className="empty-state">
        <span>⭐</span>
        <h3>No feedback yet</h3>
        <p>
          Student reviews will appear here after they rate
          completed orders.
        </p>
      </div>
    ) : (
      <div className="orders-grid">
        {allOrders
          .filter((order) => order.feedback || order.rating)
          .map((order) => {
            const rating = Math.max(
              0,
              Math.min(5, Number(order.rating) || 0)
            );

            return (
              <article className="order-card" key={order._id}>
                <div className="order-card-top">
                  <div>
                    <span className="muted">Order Token</span>
                    <h3>#{order.tokenNumber}</h3>
                  </div>

                  <span className="status-badge completed">
                    Feedback Received
                  </span>
                </div>

                <p className="admin-customer">
                  Student:{" "}
                  <strong>{order.customerName || "Student"}</strong>
                </p>

                <div style={{ fontSize: "22px", color: "#f59e0b" }}>
                  {"★".repeat(rating)}
                  {"☆".repeat(5 - rating)}
                  <span style={{ fontSize: "14px", marginLeft: "8px" }}>
                    {rating}/5
                  </span>
                </div>

                <p style={{ marginTop: "12px" }}>
                  {order.feedback || "No written review provided."}
                </p>

                <small className="muted">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : ""}
                </small>
              </article>
            );
          })}
      </div>
    )}
  </section>
)}


{/* STUDENT: MY WALLET */}
{!isAdmin && activePage === "wallet" && (
  <section className="content-panel">
    <div className="section-heading">
      <div>
        <h2>💳 My Wallet</h2>
        <p>Manage your wallet balance and transactions.</p>
      </div>
      <button
        className="secondary-btn"
        onClick={loadWallet}
      >
        ↻ Refresh
      </button>
    </div>

    <div className="wallet-balance-card">
      <p>Available Balance</p>
      <h1>₹{Number(walletBalance).toFixed(2)}</h1>
      <span>Demo Wallet Balance</span>
    </div>

    <div className="wallet-recharge-section">
      <h3>＋ Add Money</h3>
      <p>Select an amount or enter a custom amount.</p>

      <div className="wallet-amount-options">
        {[100, 200, 500].map((amount) => (
          <button
            key={amount}
            type="button"
            className={
              Number(rechargeAmount) === amount
                ? "category-chip selected"
                : "category-chip"
            }
            onClick={() => setRechargeAmount(amount)}
          >
            ₹{amount}
          </button>
        ))}
      </div>

      <label htmlFor="wallet-amount">Custom Amount (₹)</label>
      <input
        id="wallet-amount"
        type="number"
        min="1"
        max="10000"
        value={rechargeAmount}
        onChange={(e) => setRechargeAmount(e.target.value)}
        placeholder="Enter amount"
      />

      <button
        className="primary-btn"
        onClick={handleWalletRecharge}
        disabled={rechargeLoading}
      >
        {rechargeLoading ? "Processing..." : "＋ Add Money"}
      </button>

      <p className="wallet-demo-note">
        Note: This is a demo wallet. No real money or payment is involved.
      </p>
    </div>

    <div className="wallet-history-section">
      <h3>📜 Transaction History</h3>

      {walletLoading ? (
        <p>Loading transactions...</p>
      ) : walletTransactions.length === 0 ? (
        <div className="empty-state">
          <span>💸</span>
          <h3>No transactions yet</h3>
          <p>Your wallet activity will appear here.</p>
        </div>
      ) : (
        <div className="wallet-transaction-list">
          {walletTransactions.map((transaction) => (
            <div
              className="wallet-transaction"
              key={transaction._id}
            >
              <div>
                <strong>{transaction.type}</strong>
                <p>{transaction.description}</p>
                <small>
                  {new Date(transaction.createdAt).toLocaleString()}
                </small>
              </div>

              <div>
                <strong>
                  {transaction.type === "PAYMENT" ? "−" : "+"}
                  ₹{Number(transaction.amount).toFixed(2)}
                </strong>
                <small>{transaction.status}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)}

{activePage === "profile" && user && (
  <section className="profile-page">
    <div className="profile-page-heading">
      <div>
        <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
        <h1>My Profile</h1>
        <p>Manage your personal information and account details.</p>
      </div>
      <div className="profile-heading-icon">✦</div>
    </div>

    <div className="profile-hero-card">
      <div className="profile-identity">
        <div className="profile-avatar">
          {(user.name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="profile-identity-text">
          <span className="profile-eyebrow">YOUR ACCOUNT</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="profile-role-badge">
            {user.role === "admin" ? "✦ Administrator" : "✦ Student Account"}
          </span>
        </div>
      </div>

      {!isEditingProfile && (
        <button
          type="button"
          className="profile-edit-button"
          onClick={() => {
            setProfileForm({
              name: user.name || "",
              email: user.email || "",
              password: "",
            });
            setProfileMessage("");
            setIsEditingProfile(true);
          }}
        >
          ✎ Edit Profile
        </button>
      )}
    </div>

    {profileMessage && (
      <div className={`auth-message ${profileMessageType}`}>
        {profileMessage}
      </div>
    )}

    {isEditingProfile ? (
      <form
        className="profile-edit-form"
        onSubmit={handleSaveProfile}
      >
        <div className="profile-section-heading">
          <div>
            <span className="profile-eyebrow">PERSONAL DETAILS</span>
            <h2>Edit Account Information</h2>
          </div>
          <span className="profile-heading-icon">✎</span>
        </div>

        <label htmlFor="profile-name">Full Name</label>
        <input
          id="profile-name"
          type="text"
          value={profileForm.name}
          onChange={(e) =>
            setProfileForm({
              ...profileForm,
              name: e.target.value,
            })
          }
          required
        />

        <label htmlFor="profile-email">Email Address</label>
        <input
          id="profile-email"
          type="email"
          value={profileForm.email}
          onChange={(e) =>
            setProfileForm({
              ...profileForm,
              email: e.target.value,
            })
          }
          required
        />

        <label htmlFor="profile-password">
          New Password <span>(Optional)</span>
        </label>
        <input
          id="profile-password"
          type="password"
          placeholder="Leave blank to keep your current password"
          value={profileForm.password}
          onChange={(e) =>
            setProfileForm({
              ...profileForm,
              password: e.target.value,
            })
          }
          minLength={6}
        />

        <p className="profile-password-hint">
          Leave the password field empty if you don't want to change it.
        </p>

        <div className="profile-form-actions">
          <button
            type="submit"
            className="profile-save-button"
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            className="profile-cancel-button"
            onClick={() => {
              setIsEditingProfile(false);
              setProfileMessage("");
              setProfileForm({
                name: user.name || "",
                email: user.email || "",
                password: "",
              });
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    ) : (
      <div className="profile-details-card">
        <div className="profile-section-heading">
          <div>
            <span className="profile-eyebrow">ACCOUNT OVERVIEW</span>
            <h2>Account Information</h2>
          </div>
          <span className="profile-heading-icon">◎</span>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <span className="profile-info-icon">♙</span>
            <div>
              <span className="profile-info-label">Full Name</span>
              <p>{user.name || "Not provided"}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <span className="profile-info-icon">@</span>
            <div>
              <span className="profile-info-label">Email Address</span>
              <p>{user.email || "Not provided"}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <span className="profile-info-icon">✦</span>
            <div>
              <span className="profile-info-label">Account Type</span>
              <p>
                {user.role === "admin" ? "Administrator" : "Student"}
              </p>
            </div>
          </div>

          <div className="profile-info-item">
            <span className="profile-info-icon">⌘</span>
            <div>
              <span className="profile-info-label">Account ID</span>
              <p className="profile-account-id">{user._id}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </section>
)}


      </main>

      {/* ADD / EDIT FOOD MODAL */}
      {foodModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setFoodModalOpen(false)}
        >
          <form
            className="food-modal"
            onSubmit={saveFood}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>{editingFood ? "Edit Food" : "Add New Food"}</h2>
                <p>Enter the food details below.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setFoodModalOpen(false)}
              >
                ×
              </button>
            </div>

            <label>
              Food name
              <input
                required
                value={foodForm.name}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, name: e.target.value })
                }
                placeholder="e.g. Veg Burger"
              />
            </label>

            <label>
              Price (₹)
              <input
                required
                type="number"
                min="1"
                value={foodForm.price}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, price: e.target.value })
                }
                placeholder="Enter price"
              />
            </label>

            <label>
              Food emoji
              <input
                value={foodForm.emoji}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, emoji: e.target.value })
                }
                placeholder="🍔"
              />
            </label>


          
            <label>
              Stock Quantity
              <input
                required
                type="number"
                min="0"
                step="1"
                value={foodForm.stock}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, stock: e.target.value })
                }
                placeholder="Enter available quantity"
              />
            </label> 
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setFoodModalOpen(false)}
              >
                Cancel
              </button>
              <button className="primary-btn" type="submit">
                {editingFood ? "Save Changes" : "Add Food"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="food-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Order #{selectedOrder.tokenNumber}</h2>
                <p>Order details and current status.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="order-items">
              {(selectedOrder.items || []).map((item, index) => (
                <div key={`${item.name}-${index}`}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <strong>₹{item.price * item.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="order-detail-total">
              <span>Total</span>
              <strong>₹{selectedOrder.totalPrice}</strong>
            </div>

            <p>
              Status:{" "}
              <strong>{selectedOrder.status || "Pending"}</strong>
            </p>

            <button
              className="primary-btn full-width"
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* FEEDBACK MODAL */}
{feedbackOrder && (
  <div
    className="modal-backdrop"
    onClick={() => setFeedbackOrder(null)}
  >
    <div
      className="food-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-heading">
        <div>
          <h2>⭐ Rate Order #{feedbackOrder.tokenNumber}</h2>
          <p>How was your canteen experience?</p>
        </div>

        <button
          className="modal-close"
          onClick={() => setFeedbackOrder(null)}
        >
          ×
        </button>
      </div>

      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <p><strong>Give your rating</strong></p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            fontSize: "32px",
            marginTop: "10px",
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFeedbackRating(star)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "32px",
                padding: "0",
              }}
            >
              {star <= feedbackRating ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        <p className="muted">
          {feedbackRating} out of 5
        </p>
      </div>

      <label>
        Feedback
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Tell us about your experience..."
          rows="4"
        />
      </label>

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setFeedbackOrder(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="primary-btn"
          onClick={submitFeedback}
          disabled={feedbackLoading}
        >
          {feedbackLoading ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}