# Fruit Match Master 🍎 [Link](https://omshigupta.github.io/FruitMatch/)

This is a personal project I developed to practice building a polished, interactive experience using nothing but **Vanilla JavaScript**. 

Most matching games feel a bit static, so my goal here was to focus on the "Game Feel", specifically how audio and visual cues work together to make a match feel rewarding. I integrated a dynamic audio system that fetches high-quality samples from external servers to keep the project lightweight and fast.

## 🧠 The Technical Side
The core of this game isn't just swapping icons; it's the connection logic. I implemented a **Breadth-First Search (BFS)** algorithm to handle the "three-turn" rule common in these types of puzzles. It ensures that the path drawn between fruits is always the most efficient one.

## 🔧 Key Features
- **Custom Audio Engine: Managed via JavaScript to handle multiple simultaneous sound effects (Match, Error, Win, Lose).
- **Persistent Profiles:** Uses `localStorage` to save your player name and custom avatar across sessions.
- **Dynamic Grid:** A 6x6 responsive layout that scales for both mobile and desktop play.
- **Path Visualization:** A real-time canvas overlay that draws the connection path and turn-counts when you make a match.

## 🚀 Deployment
I used GitHub for version control to track the evolution of the game's logic and sound integration.

## 📂 Project Structure
- `index.html` - The structure of the game board and UI.
- `style.css` - Custom styling with a focus on smooth transitions and "shake" animations for errors.
- `script.js` - The brain of the game, containing the BFS logic and audio management.
- `assets` - The directory where I've organized the fruit icons and default profile images used throughout the game.

## Desktop Preview
![Desktop View](https://github.com/omshigupta/FruitMatch/blob/main/Desktop-View-Fruit-Match.png)


