import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "smartmeal-secret-key";
const db = new Database("smartmeal.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pantry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ingredient TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_json TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    recipe_json TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS current_ingredients (
    user_id INTEGER PRIMARY KEY,
    ingredients_json TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
      const result = stmt.run(email, hashedPassword);
      const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ id: result.lastInsertRowid, email });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ id: user.id, email: user.email });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // --- Data Routes ---
  app.get("/api/user/data", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const pantry = db.prepare("SELECT ingredient FROM pantry WHERE user_id = ?").all(userId);
    const favorites = db.prepare("SELECT recipe_json FROM favorites WHERE user_id = ?").all(userId);
    const mealPlans = db.prepare("SELECT * FROM meal_plans WHERE user_id = ?").all(userId);
    const currentIngs = db.prepare("SELECT ingredients_json FROM current_ingredients WHERE user_id = ?").get(userId) as any;

    res.json({
      pantry: pantry.map((p: any) => p.ingredient),
      favorites: favorites.map((f: any) => JSON.parse(f.recipe_json)),
      mealPlans: mealPlans.map((m: any) => ({ ...m, recipe: JSON.parse(m.recipe_json) })),
      ingredients: currentIngs ? JSON.parse(currentIngs.ingredients_json) : []
    });
  });

  app.post("/api/user/ingredients", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const { ingredients } = req.body;
    db.prepare("INSERT OR REPLACE INTO current_ingredients (user_id, ingredients_json) VALUES (?, ?)")
      .run(userId, JSON.stringify(ingredients));
    res.json({ success: true });
  });

  app.post("/api/user/pantry", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const { ingredient, action } = req.body;
    if (action === "add") {
      db.prepare("INSERT INTO pantry (user_id, ingredient) VALUES (?, ?)").run(userId, ingredient);
    } else {
      db.prepare("DELETE FROM pantry WHERE user_id = ? AND ingredient = ?").run(userId, ingredient);
    }
    res.json({ success: true });
  });

  app.post("/api/user/favorites", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const { recipe, action } = req.body;
    if (action === "add") {
      db.prepare("INSERT INTO favorites (user_id, recipe_id, recipe_json) VALUES (?, ?, ?)")
        .run(userId, recipe.id, JSON.stringify(recipe));
    } else {
      db.prepare("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?").run(userId, recipe.id);
    }
    res.json({ success: true });
  });

  app.post("/api/user/mealplan", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const { day, mealType, recipe, action } = req.body;
    if (action === "add") {
      db.prepare("INSERT INTO meal_plans (user_id, day, meal_type, recipe_json) VALUES (?, ?, ?, ?)")
        .run(userId, day, mealType, JSON.stringify(recipe));
    } else {
      db.prepare("DELETE FROM meal_plans WHERE user_id = ? AND day = ? AND meal_type = ?").run(userId, day, mealType);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
