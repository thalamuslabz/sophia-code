# Getting Started with Sophia Code on Windows

## Complete Guide: From Zero to Coding with AI Governance

**Prerequisites:** Windows 10 or 11, internet connection
**Estimated Time:** 30-45 minutes

---

## Part 1: Install VS Code

### Step 1: Download VS Code
1. Open your web browser
2. Go to: https://code.visualstudio.com/
3. Click the blue **"Download for Windows"** button
4. The installer will download (usually to your Downloads folder)

### Step 2: Install VS Code
1. Open File Explorer and go to Downloads
2. Double-click the file named `VSCodeSetup-x64-xxx.exe` (where xxx is the version number)
3. If Windows asks "Do you want to allow this app to make changes?" click **Yes**

### Step 3: Installation Wizard
1. Accept the license agreement
2. Click **"Next"** through the setup screens
3. On the "Select Additional Tasks" screen, check these boxes:
   - ☑ Add "Open with Code" action to Windows Explorer file context menu
   - ☑ Add "Open with Code" action to Windows Explorer directory context menu
   - ☑ Register Code as an editor for supported file types
4. Click **Install**
5. Wait for installation to complete
6. Click **Finish** (you can leave "Launch Visual Studio Code" checked)

### Step 4: Verify Installation
- VS Code should open automatically
- You should see a welcome screen with a dark interface
- If it didn't open, press Windows key, type "code" and Press Enter

---

## Part 2: Install Required Tools

### Step 1: Install Node.js (Required for Sophia Code)
1. Visit: https://nodejs.org/
2. Click the green **"LTS"** button (Long Term Support version)
3. Run the downloaded file (accept all defaults)
4. When done, RESTART VS Code if you have it open

**To verify Node.js is installed:**
1. In VS Code, press `Ctrl + ~`` (that's backtick, usually above Tab)
2. A terminal panel opens at the bottom
3. Type: `node --version`
4. You should see something like: `v20.x.x`
5. Type: `npm --version`
6. You should see something like: `10.x.x`

### Step 2: Install Git (Version Control)
1. Visit: https://git-scm.com/download/win
2. Click **"Click here to download"** (64-bit Git for Windows)
3. Run the installer (accept most defaults, but make sure to):
   - Select **"Git from the command line and also from 3rd-party software"** for PATH
   - Select **"Use bundled OpenSSH"**
4. Click through all screens and click Install

### Step 3: Install Docker Desktop (For Running the Full Stack)
1. Visit: https://www.docker.com/products/docker-desktop/
2. Click **"Download for Windows - AMD64"**
3. Run the installer
4. If Windows prompts, allow it to make changes
5. Follow the setup wizard (accept defaults)
6. **Restart your computer** when prompted
7. After restart, Docker Desktop will start automatically
8. Click through the tutorial or skip it
9. Docker is ready when you see a whale icon in your system tray (bottom right)

---

## Part 3: Get the Code

### Step 1: Create a Project Folder
1. In VS Code, press `Ctrl + Shift + P` (this opens Command Palette)
2. Type: `Terminal: Create New Terminal` and click it
3. In the terminal, type:
   ```bash
   cd Documents
   mkdir my-sophia-test
   cd my-sophia-test
   ```

### Step 2: Download Sophia Code
1. In the VS Code terminal, type:
   ```bash
   git clone https://github.com/TheMethodArq/sophia.code.git
   cd sophia.code
   ```
   
2. If you don't have git access, you can download the ZIP:
   - Visit: https://github.com/TheMethodArq/sophia.code
   - Click green **"<> Code"** button
   - Click **"Download ZIP"**
   - Extract the ZIP to `Documents\my-sophia-test\sophia.code`

---

## Part 4: Install Dependencies

### Step 1: Install Frontend Dependencies
1. Make sure you're in the terminal and in the `sophia.code` folder
2. Type:
   ```bash
   npm install
   ```
3. Wait for it to complete (you'll see a progress bar)
4. This installs all the frontend packages (takes 1-2 minutes)

### Step 2: Install Backend Dependencies
1. In the same terminal, type:
   ```bash
   cd backend
   npm install
   ```
2. Wait for it to complete
3. Type:
   ```bash
   cd ..
   ```
   (to go back to main folder)

---

## Part 5: Configure for Local Development

### Step 1: Create Environment Files
1. In VS Code, make sure you're in the file explorer (left sidebar)
2. In the project root folder, create a new file called `.env`:
   - Right-click in empty space → New File → name it `.env`
3. Paste this configuration:
   ```
   # Frontend environment
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_API_KEY=test_key_for_development_only
   VITE_AI_PROVIDER=opencode
   
   # Set to your preferred AI provider (optional for now)
   # VITE_ANTHROPIC_API_KEY=your_key_here
   ```

### Step 2: Create Backend Environment
1. Navigate to the `backend` folder
2. Create a file called `.env`
3. Paste this:
   ```
   # Backend environment
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   
   # Database (will use default for local testing)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=sophia
   
   # Simple auth for development
   API_KEY=test_key_for_development_only
   ```

---

## Part 6: Start Everything Up

### Step 1: Start the Database with Docker
1. Open Docker Desktop (if not already running)
2. In VS Code terminal, type:
   ```bash
   docker-compose up database -d
   ```
3. This starts PostgreSQL in the background
4. Wait 10 seconds for it to initialize

### Step 2: Start the Backend Server
1. Open a **new terminal** in VS Code (`Ctrl + Shift + '`)
2. Type:
   ```bash
   cd Documents\my-sophia-test\sophia.code\backend
   npm run start:dev
   ```
3. You should see output showing the server starting
4. Wait for: `Application is running on: http://localhost:3000`
5. **Leave this terminal running** (don't close it)

### Step 3: Start the Frontend
1. Open another **new terminal** (`Ctrl + Shift + '`)
2. Type:
   ```bash
   cd Documents\my-sophia-test\sophia.code
   npm run dev
   ```
3. Wait for: `Local: http://localhost:5173/`
4. **Hold Ctrl and click** the link to open in browser
5. You should see the Sophia Code interface!

**Now you have:**
- ✅ Database running in Docker
- ✅ Backend API on port 3000
- ✅ Frontend dashboard on port 5173

---

## Part 7: Create Your First Test Application

Let's create a simple application to test Sophia's governance features.

### Step 1: Create a Test Project
1. In VS Code, press `Ctrl + N` to create a new file
2. Save it (`Ctrl + S`) as: `Documents\my-sophia-test\my-app\calculator.js`
3. VS Code will create the folder for you

### Step 2: Write Some Code
Paste this simple calculator code:

```javascript
// calculator.js

class Calculator {
  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return a - b;
  }

  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error("Cannot divide by zero");
    }
    return a / b;
  }

  calculate(operation, a, b) {
    switch(operation) {
      case 'add':
        return this.add(a, b);
      case 'subtract':
        return this.subtract(a, b);
      case 'multiply':
        return this.multiply(a, b);
      case 'divide':
        return this.divide(a, b);
      default:
        throw new Error("Unknown operation");
    }
  }
}

// Test the calculator
const calc = new Calculator();

console.log("Testing Addition:", calc.add(5, 3));
console.log("Testing Subtraction:", calc.subtract(10, 4));
console.log("Testing Multiplication:", calc.multiply(6, 7));
console.log("Testing Division:", calc.divide(20, 4));

module.exports = Calculator;
```

### Step 3: Run the Code
1. In VS Code terminal (the one in main project folder), type:
   ```bash
   cd Documents\my-sophia-test\my-app
   node calculator.js
   ```
2. You should see:
   ```
   Testing Addition: 8
   Testing Subtraction: 6
   Testing Multiplication: 42
   Testing Division: 5
   ```

### Step 4: Make an Intentional Error
Now let's add some code that might trigger governance concerns:

Create a new file: `Documents\my-sophia-test\my-app\user-manager.js`

Paste this (includes patterns Sophia should catch):

```javascript
// user-manager.js

// Simulating a user management system
class UserManager {
  constructor() {
    this.users = [];
    // WARNING: This is intentionally insecure for testing
    this.apiKey = "sk-1234567890abcdef1234567890abcdef";
  }

  addUser(name, email, ssn) {
    const user = {
      id: this.users.length + 1,
      name: name,
      email: email,
      ssn: ssn  // This contains PII - Sophia should flag this!
    };
    this.users.push(user);
    return user;
  }

  dropAllUsers() {
    // WARNING: This is a destructive operation
    this.users = [];
    console.log("All users deleted");
  }

  findUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }
}

// Test data
const manager = new UserManager();

// Adding a user with PII (SSN)
const user = manager.addUser(
  "John Doe",
  "john.doe@example.com",
  "123-45-6789"  // SSN pattern
);

console.log("Created user:", user);

module.exports = UserManager;
```

**Try to run it:**
```bash
node user-manager.js
```

It will run (we're just testing), but if you had the VS Code extension connected to Sophia, it would flag the PII and API key patterns!

---

## Part 8: Test Sophia Code Features

### Step 1: Open the Dashboard
1. In your browser, go to: http://localhost:5173
2. You should see the Sophia Code interface
3. Click around to explore:
   - **Mission Control** - Start coding missions
   - **Artifacts** - Browse governance templates
   - **Settings** - Configure providers (optional)

### Step 2: Start a Mission
1. In the dashboard, click the **"Initialize Neural Core"** button
2. Sophia will start showing terminal logs
3. Watch the governance checks happen
4. Try clicking through different states

### Step 3: Create an Artifact
1. Go to the **Artifacts** tab
2. Click the **+** button (bottom right)
3. Create a new intent:
   - **Title**: "Test Calculator Project"
   - **Description**: "Testing governance on calculator app"
   - **Content**: "Build a simple calculator with proper error handling"
4. Click **Submit**

### Step 4: View Governance in Action
1. Go back to **Mission** view
2. Start a new mission
3. Watch the trust score and governance gates
4. If you trigger a gate, you'll see the approval interface

---

## Part 9: Run the Tests

Let's verify everything is working correctly.

### Step 1: Run Frontend Tests
1. In VS Code, press `Ctrl + Shift + P`
2. Type: `Terminal: Create New Terminal`
3. Type:
   ```bash
   cd Documents\my-sophia-test\sophia.code
   npm test
   ```
4. You should see tests running and passing
5. Press `q` to exit when done

### Step 2: Run Backend Tests (Optional)
1. Open another terminal
2. Type:
   ```bash
   cd Documents\my-sophia-test\sophia.code\backend
   npm test
   ```
3. This runs the NestJS backend tests

### Step 3: Build for Production
1. In the main terminal:
   ```bash
   cd Documents\my-sophia-test\sophia.code
   npm run build
   ```
2. This creates a production-ready build in the `dist` folder

---

## Part 10: Clean Shutdown

When you're done testing:

### Step 1: Stop Everything
1. **Stop the frontend**: In the frontend terminal, press `Ctrl + C`
2. **Stop the backend**: In the backend terminal, press `Ctrl + C`
3. **Stop the database**: In any terminal:
   ```bash
   cd Documents\my-sophia-test\sophia.code
   docker-compose down
   ```

### Step 2: Keep Docker Running
- You can leave Docker Desktop running for next time
- Or right-click the whale icon → Quit Docker Desktop

---

## Quick Reference - Common Commands

**Start everything (after first setup):**
```bash
# Terminal 1 - Database
docker-compose up database -d

# Terminal 2 - Backend
cd backend
npm run start:dev

# Terminal 3 - Frontend (in root folder)
npm run dev
```

**Stop everything:**
```bash
# Terminal 1 - Frontend: Ctrl+C
# Terminal 2 - Backend: Ctrl+C
# Terminal 3:
docker-compose down
```

**Run tests:**
```bash
# Frontend (root folder)
npm test -- --run

# Backend
cd backend
npm test
```

**Create new code file:**
- Press `Ctrl + N` in VS Code
- Write code
- Press `Ctrl + S` to save

**Run JS file:**
```bash
node filename.js
```

---

## Next Steps

### What You Can Do Now:

1. **Explore the UI**: Click through all tabs in the Sophia dashboard
2. **Create Artifacts**: Make intents, gates, contracts
3. **Start Missions**: Watch the governance system in action
4. **Modify Calculator**: Add features and test governance
5. **Add AI Provider**: Get API keys for Anthropic/DeepSeek to test AI integration
6. **Read Documentation**: Check the `docs` folder for detailed guides

### Connect an IDE (Advanced):
When you're comfortable, you can:
1. Install the Sophia Code VS Code extension (when available)
2. Configure it to connect to localhost:3000
3. See governance alerts inline while coding
4. Get approval prompts before dangerous operations

### Troubleshooting:

**"Cannot find module" errors?**
- Make sure you ran `npm install` in both root and backend folders

**Database connection failed?**
- Make sure Docker Desktop is running
- Run: `docker-compose up database -d`

**Port already in use?**
- Close other applications or change ports in .env files

**VS Code terminal not responding?**
- Press `Ctrl + C` a few times
- Or close terminal with the trash icon, open new one

---

## Congratulations! 🎉

You now have:
- ✅ VS Code installed and configured
- ✅ Node.js, Git, and Docker installed
- ✅ Sophia Code running locally
- ✅ A test application that exercises the governance system
- ✅ The ability to start/stop the entire stack

**You're ready to use Sophia Code as your AI governance system!**