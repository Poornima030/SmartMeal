# 🥗 SmartMeal AI - Your Intelligent Kitchen Assistant 🌸

SmartMeal is a live, fully functional AI-powered recipe generator built with **React**, **TypeScript**, and **Tailwind CSS**, powered by the **Google Gemini API**. It features a modern, "crafted" UI with a focus on ease of use and a premium aesthetic.

🔗 **Live Application**  
Experience the AI kitchen yourself by visiting the deployed link:  
➡️ [Launch the SmartMeal App](https://smart-meal-cyan.vercel.app/)

---

## ✨ Features

- 🧠 **AI Vision & Text**: Snap a photo of your fridge or type in ingredients to get instant, creative recipe ideas.
- 🎨 **Premium UI/UX**: A beautifully crafted interface with smooth animations, custom gradients, and a focus on readability.
- 📊 **Nutrition Dashboard**: Real-time nutritional breakdown for every generated recipe.
- 🍳 **Interactive Cooking Mode**: Step-by-step instructions with built-in timers and voice control.
- ❤️ **Favorites & History**: Save your favorite AI-generated recipes for later.
- 📱 **Fully Responsive**: Optimized for everything from mobile phones to large desktop displays.

---

## 📸 Screenshots

<img width="1895" height="908" alt="image" src="https://github.com/user-attachments/assets/bc3a1ae4-ec6a-4a40-9268-25443a9fdeaa" />
<img width="1728" height="751" alt="image" src="https://github.com/user-attachments/assets/6681375f-cac5-4d96-91ac-b0af8d96da65" />
<img width="476" height="567" alt="image" src="https://github.com/user-attachments/assets/96235c47-1c58-4451-8c99-bc14defb8251" />
<img width="1054" height="363" alt="image" src="https://github.com/user-attachments/assets/355cf646-4fc1-4669-90f7-cda8b865c65d" />
<img width="1906" height="909" alt="image" src="https://github.com/user-attachments/assets/15e29919-6e62-4b56-b11a-17ffb6e99213" />


---

## 🚀 Getting Started (For Developers)

### Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**
- A **Google Gemini API Key**

### 1. Installation

Clone the repository and install the required packages:

```bash
git clone https://github.com/YOUR_USERNAME/smart-meal.git
cd smart-meal
npm install
```

### 2. API Key Setup

This application is configured to read the API key from an environment variable named `VITE_GEMINI_API_KEY`.

**For Local Use:**  
Create a `.env` file in the root directory and add your key:
```env
VITE_GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY_HERE"
```

**For Vercel Deployment:**  
Add the key manually to the **Environment Variables** section in your Vercel project settings.

### 3. Run Locally

Launch the development server:

```bash
npm run dev
```

---

## 📜 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Engine**: Google Gemini API (@google/genai)
- **Deployment**: Vercel

---

## 🌸 About the Project

SmartMeal was built to solve the "What's for dinner?" dilemma using cutting-edge AI. Every part of this application, from the logic to the styling, was meticulously crafted to provide a seamless and enjoyable cooking experience.

---
*Made with ❤️ by [Your Name]*
