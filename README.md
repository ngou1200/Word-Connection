# Word Connection Game

## 📖 About The Project

This project is a web-based word connection game. The core gameplay revolves around players taking turns to come up with a word that starts with the last letter of the word provided by the previous player. The game is built with vanilla JavaScript, HTML, and CSS, and it leverages a comprehensive word list for validation. The interface is designed to be intuitive and user-friendly, providing a seamless gaming experience.

---

## ✨ Features

**Multiple Game Modes**:
    **Player vs. Player (PvP)**: Two players can compete against each other. 
    **Player vs. AI**: A single player can challenge an AI opponent. 
    **AI vs. AI**: Watch two AI opponents battle it out. 
**Difficulty Levels**: The AI opponent can be set to different difficulty levels, including easy, medium, and hard. 
**Timer**: A time limit for each turn adds a layer of challenge and excitement to the game. 
**Score Tracking**: The game keeps track of each player's score. 
**Word Validation**: A robust word validation system ensures that players use valid English words and prevents the repetition of words. 

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a local web server to run this project. You can use any local server of your choice, such as `http-server` for Node.js or Python's built-in HTTP server.

### Installation & Launch

1.  **Clone the repository or download the files.**
2.  **Navigate to the project directory in your terminal.**
3.  **Start your local web server.**

    For example, using Python's HTTP server:
    ```sh
    python -m http.server
    ```
    Or using `http-server` for Node.js:
    ```sh
    npx http-server
    ```
4.  **Open your web browser and go to the provided localhost address (e.g., `http://localhost:8000`).**

---

## 룰 How to Play

1.  **Select a Game Mode**: Choose from PvP, Player vs. AI, or AI vs. AI. 
2.  **Start the Game**: The first player starts by entering a word.
3.  **Take Turns**: The next player must enter a word that begins with the last letter of the previous word.
4.  **Follow the Rules**:
    * The word must be a valid English word from the provided word list. 
    * The word must not have been used before in the current game. 
5.  **Winning the Game**: A player loses if they cannot come up with a valid word within the time limit or if they enter an invalid word.

---

## 🛠️ Built With

* **HTML** 
* **CSS** 
* **JavaScript**
