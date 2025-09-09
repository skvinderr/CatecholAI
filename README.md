# Catechol AI Career Advisor

A simple web application that helps students discover their perfect career paths using AI recommendations.

## What it does

- Collects user information (name, interests, academics, skills)
- Provides personalized career recommendations using Google Gemini AI
- Shows detailed skills roadmaps for each career
- Stores user data in Firebase for future reference

## How to use

1. Open `index.html` in your web browser
2. Enter your name when prompted
3. Answer the 3 questions about your interests, academics, and skills
4. Get AI-powered career recommendations
5. View detailed skills roadmaps for any career

## Setup Requirements

### For AI Features:
- Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Replace the API key in the code (line ~280)

### For Data Storage:
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Authentication (Anonymous) and Firestore Database
- Replace the Firebase config in the code (line ~190)

## Files

- `index.html` - Main application file (complete, ready to use)
- `index-new.html` - Structured HTML (requires separate CSS/JS files)
- `styles.css` - Stylesheet for the structured version
- `script.js` - JavaScript for the structured version

## Demo Mode

The app works without API keys by showing sample recommendations. Configure APIs for full functionality.

## Made with ❤️ by Aditya
