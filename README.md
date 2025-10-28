# Image to Video Generator

Transform your images into stunning AI-generated videos using the A2E.ai API.

## Features

✅ Upload images from your computer or Google Drive  
✅ Create 5-second or 8-second videos  
✅ Automatic Google Drive URL converter  
✅ Write custom prompts for video generation  
✅ View and download completed videos  
✅ Check status of all your videos  

---

## Prerequisites (Things You Need First)

Before you start, you need to install these programs on your computer:

1. **Node.js** - This runs JavaScript on your computer
   - Download from: https://nodejs.org/
   - Choose the "LTS" version (recommended)
   - Run the installer and follow the instructions

2. **Git** - This manages your code
   - Download from: https://git-scm.com/downloads
   - Run the installer and follow the instructions

3. **A Code Editor** (optional but helpful)
   - Visual Studio Code: https://code.visualstudio.com/
   - This helps you edit code files easily

4. **A2E.ai API Token**
   - Sign up at https://a2e.ai/
   - Get your API token from the dashboard

---

## Step-by-Step Setup Guide

### Step 1: Download This Project

**Option A: Using Git (Recommended)**

1. Open your **Terminal** (Mac) or **Command Prompt** (Windows)
   - Mac: Press `Cmd + Space`, type "Terminal", press Enter
   - Windows: Press `Win + R`, type "cmd", press Enter

2. Navigate to where you want to save the project:
   ```bash
   cd Desktop
   ```
   (This puts it on your Desktop)

3. Clone this repository:
   ```bash
   git clone https://github.com/ndwiebe/image-to-video-generator.git
   cd image-to-video-generator
   ```

**Option B: Download ZIP**

1. Click the green "Code" button on GitHub
2. Click "Download ZIP"
3. Extract the ZIP file to your Desktop
4. Open Terminal/Command Prompt and navigate to the folder:
   ```bash
   cd Desktop/image-to-video-generator
   ```

---

### Step 2: Install Dependencies

In your Terminal/Command Prompt (make sure you're in the project folder):

```bash
npm install
```

**What this does:** Downloads all the necessary code libraries the project needs.

**Wait for it to finish** - you'll see a lot of text scrolling. This is normal!

---

### Step 3: Run the Application

```bash
npm run dev
```

**What happens:**
- The app starts running on your computer
- Your web browser should automatically open to http://localhost:3000
- If it doesn't open automatically, manually go to http://localhost:3000 in your browser

**You should see the Image to Video Generator app!**

---

### Step 4: Using the Application

1. **Enter your API token** at the top
2. **Upload your image** or paste a Google Drive link
3. **Write your prompt** (what you want to happen in the video)
4. **Choose video length** (5 or 8 seconds)
5. **Click "Generate Video"**
6. **Wait about 10 minutes**, then click "Check Status"
7. **Download your video** when it's ready!

---

## Stopping the Application

When you're done:
1. Go back to your Terminal/Command Prompt
2. Press `Ctrl + C` (on both Mac and Windows)
3. This stops the application

---

## Troubleshooting

### "Command not found" errors
- Make sure you installed Node.js and Git
- Close and reopen your Terminal/Command Prompt

### Port 3000 is already in use
- Another app is using port 3000
- Stop that app, or change the port in `vite.config.js` to 3001

### npm install fails
- Make sure you have an internet connection
- Try running `npm install` again

### App won't open in browser
- Manually go to http://localhost:3000
- Check if Terminal shows any error messages

---

## Project Structure

```
image-video-generator/
├── src/
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── package.json         # Project dependencies
├── vite.config.js       # Build configuration
└── README.md           # This file
```

---

## Tech Stack

- **React 18.2.0** - UI framework
- **Vite 4.3.9** - Build tool and dev server
- **Lucide React** - Icon library
- **A2E.ai API** - Video generation service

---

## Need Help?

- Check the Terminal/Command Prompt for error messages
- Make sure all prerequisites are installed
- Try closing and reopening the Terminal
- Delete `node_modules` folder and run `npm install` again

---

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

---

## License

MIT License - Feel free to use and modify!
