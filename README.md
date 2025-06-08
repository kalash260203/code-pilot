# Code Pilot 🚀

A modern, interactive multi-language code editor that runs directly in your browser. Code Pilot supports JavaScript, Python, Java, C#, and C++ with real-time execution, step-by-step debugging, and memory visualization.

![image](https://github.com/user-attachments/assets/bc0dcbe6-15f6-4482-a735-8c1b96a39ead)

## ✨ Features

### 🌐 Multi-Language Support
- **JavaScript** - Full execution with async/await support
- **Python** - Powered by Pyodide for real Python execution
- **Java** - Intelligent code simulation
- **C#** - Smart code analysis and simulation
- **C++** - Advanced code simulation with STL support

### 🔧 Advanced Editor
- **Syntax Highlighting** - Powered by CodeMirror with Dracula theme
- **Line Numbers** - Easy code navigation
- **Smart Indentation** - Automatic code formatting
- **Multi-language Mode Switching** - Seamless language transitions

### 🐛 Interactive Debugging
- **Step Mode** - Execute code line by line
- **Memory Visualization** - Real-time variable tracking
- **Line Highlighting** - Visual execution flow
- **Execution Controls** - Step, Run All, Reset functionality

### 💬 User Input Handling
- **Custom Input Popup** - Beautiful modal for user input
- **Async Input Support** - Non-blocking input handling
- **Cross-language Compatibility** - Works with all supported languages

### 🎨 Modern UI/UX
- **Dark Theme** - Easy on the eyes
- **Responsive Design** - Works on all screen sizes
- **Clean Interface** - Distraction-free coding environment
- **Real-time Output** - Instant feedback

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for CDN resources)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kalash260203/code-pilot.git
   cd code-pilot
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   # Or use a local server (recommended)
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Quick Start

1. **Select a Language** - Choose from JavaScript, Python, Java, C#, or C++
2. **Write Your Code** - Use the built-in editor with syntax highlighting
3. **Run Code** - Click "Run Code" button to execute
4. **Debug (Optional)** - Enable "Step Mode" for line-by-line debugging
5. **Reset** - Use "Reset" button to restore default code

## 📝 Usage Examples

### JavaScript Example
```javascript
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
console.log("Welcome to Code Pilot!");
```

### Python Example
```python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("Welcome to Code Pilot!")
```

### Java Example
```java
public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
        System.out.println("Welcome to Code Pilot!");
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}
```

## 🔍 Step Mode Debugging

1. **Enable Step Mode** - Check the "Step Mode" checkbox
2. **Run Code** - Click "Run Code" to prepare execution
3. **Step Through** - Use "Step" button to execute line by line
4. **Monitor Variables** - Watch the Memory State panel
5. **Run to End** - Use "Run to End" to complete execution
6. **Reset Execution** - Start debugging from the beginning

## 🏗️ Project Structure

```
code-pilot/
├── index.html          # Main HTML structure
├── styles.css          # Styling and theming
├── index.js           # Core JavaScript functionality
└── README.md          # Project documentation
```

## 🛠️ Technical Details

### Dependencies
- **CodeMirror 5.65.13** - Code editor component
- **Pyodide 0.24.1** - Python runtime in browser
- **Dracula Theme** - Syntax highlighting theme

### Architecture
- **Frontend Only** - No backend required
- **Modular Design** - Separated HTML, CSS, and JavaScript
- **Event-Driven** - Responsive user interactions
- **Async/Await** - Modern JavaScript patterns

### Language Execution
- **JavaScript** - Native browser execution
- **Python** - Pyodide WebAssembly runtime
- **Java/C#/C++** - Intelligent code simulation and analysis

## 🎯 Features in Detail

### Code Execution Engine
- Real-time JavaScript execution
- Full Python support via Pyodide
- Smart simulation for compiled languages
- Error handling and display
- Output capturing and formatting

### Memory Visualization
- Variable tracking during execution
- Real-time memory state display
- Type-aware variable representation
- Step-by-step memory changes

### User Interface
- Responsive layout design
- Dark theme for comfortable coding
- Intuitive control placement
- Real-time feedback and status updates

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📋 Roadmap

- [ ] Add more programming languages (Ruby, Go, Rust)
- [ ] Implement file upload/download functionality
- [ ] Add code sharing capabilities
- [ ] Implement collaborative editing
- [ ] Add mobile app support
- [ ] Include more debugging tools
- [ ] Add syntax error detection
- [ ] Implement code completion

## 🐛 Known Issues

- Python execution may take time on first load (Pyodide initialization)
- Compiled language simulation is simplified
- Large code files may impact performance
- Limited standard library support for simulated languages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CodeMirror** - For the excellent code editor component
- **Pyodide** - For bringing Python to the browser
- **Dracula Theme** - For the beautiful syntax highlighting
- **Web Technologies** - HTML5, CSS3, and modern JavaScript

---

**Made with ❤️ by [Kalash](https://github.com/kalash260203)**
