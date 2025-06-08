// Global variables
let editor;
let pyodideInstance = null;
let pyodideLoading = null;
let isExecuting = false;
let isStepMode = false;
let currentExecutionStep = 0;
let executionSteps = [];
let memoryState = {};
let highlightedLine = null;
let inputResolve = null;
let inputReject = null;

// DOM elements
const languageSelector = document.getElementById('language-selector');
const runButton = document.getElementById('run-button');
const resetButton = document.getElementById('reset-button');
const outputElement = document.getElementById('output');
const stepModeToggle = document.getElementById('step-mode-toggle');
const memoryView = document.getElementById('memory-view');
const memoryContent = document.getElementById('memory-content');
const executionControls = document.getElementById('execution-controls');
const stepButton = document.getElementById('step-button');
const runAllButton = document.getElementById('run-all-button');
const resetExecutionButton = document.getElementById('reset-execution-button');

// Input popup elements
const inputPopup = document.getElementById('input-popup');
const inputPrompt = document.getElementById('input-prompt');
const inputValue = document.getElementById('input-value');
const inputSubmit = document.getElementById('input-submit');
const inputCancel = document.getElementById('input-cancel');

// Initialize CodeMirror
document.addEventListener('DOMContentLoaded', () => {
  editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    lineNumbers: true,
    theme: 'dracula',
    mode: 'javascript',
    indentUnit: 2,
    smartIndent: true,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    extraKeys: { 'Ctrl-Space': 'autocomplete' }
  });

  // Set default code
  setDefaultCode('javascript');

  // Event listeners
  languageSelector.addEventListener('change', handleLanguageChange);
  runButton.addEventListener('click', handleRunCode);
  resetButton.addEventListener('click', handleResetCode);
  stepModeToggle.addEventListener('change', handleStepModeToggle);
  stepButton.addEventListener('click', handleStepExecution);
  runAllButton.addEventListener('click', handleRunAllSteps);
  resetExecutionButton.addEventListener('click', handleResetExecution);

  // Input popup event listeners
  inputSubmit.addEventListener('click', () => {
    const value = inputValue.value;
    inputPopup.style.display = 'none';
    if (inputResolve) {
      inputResolve(value);
      inputResolve = null;
      inputReject = null;
    }
  });
  inputCancel.addEventListener('click', () => {
    inputPopup.style.display = 'none';
    if (inputReject) {
      inputReject(new Error('Input cancelled'));
      inputResolve = null;
      inputReject = null;
    }
  });

  // Handle Enter key in input field
  inputValue.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputSubmit.click();
    }
  });
});

// Custom prompt function that uses the popup
function customPrompt(message) {
  return new Promise((resolve, reject) => {
    // Display the input popup
    inputPrompt.textContent = message || 'Enter input:';
    inputValue.value = '';
    inputPopup.style.display = 'block';
    inputValue.focus();
    // Store the resolve/reject functions
    inputResolve = resolve;
    inputReject = reject;
  });
}

// Handle language change
function handleLanguageChange() {
  const language = languageSelector.value;

  // Update editor mode
  switch (language) {
    case 'javascript':
      editor.setOption('mode', 'javascript');
      break;
    case 'python':
      editor.setOption('mode', 'python');
      break;
    case 'java':
    case 'csharp':
      editor.setOption('mode', 'text/x-java');
      break;
    case 'cpp':
      editor.setOption('mode', 'text/x-c++src');
      break;
  }

  // Set default code for the selected language
  setDefaultCode(language);

  // Clear output
  outputElement.textContent = 'Run your code to see the output here...';
  outputElement.className = 'output-text';
}

// Set default code based on language
function setDefaultCode(language) {
  let code = '';
  switch (language) {
    case 'javascript':
      code = `// JavaScript Hello World Example
function greet(name) {
  return "Hello, " + name + "!";
}

// Display greeting
console.log(greet("World"));
console.log("Welcome to Code Pilot!");`;
      break;
    case 'python':
      code = `# Python Hello World Example
def greet(name):
    return f"Hello, {name}!"

# Display greeting
print(greet("World"))
print("Welcome to Code Pilot!")`;
      break;
    case 'java':
      code = `// Java Hello World Example
public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
        System.out.println("Welcome to Code Pilot!");
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`;
      break;
    case 'csharp':
      code = `// C# Hello World Example
using System;

class Program {
    static void Main() {
        Console.WriteLine(Greet("World"));
        Console.WriteLine("Welcome to Code Pilot!");
    }
    
    static string Greet(string name) {
        return $"Hello, {name}!";
    }
}`;
      break;
    case 'cpp':
      code = `// C++ Hello World Example
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << greet("World") << std::endl;
    std::cout << "Welcome to Code Pilot!" << std::endl;
    return 0;
}`;
      break;
  }
  editor.setValue(code);
}

// Handle run code button click
async function handleRunCode() {
  if (isExecuting) return;
  isExecuting = true;
  runButton.disabled = true;
  runButton.textContent = 'Running...';
  const language = languageSelector.value;
  const code = editor.getValue();
  outputElement.textContent = '';
  outputElement.className = 'output-text';

  // Reset execution state
  resetExecutionState();

  // If step mode is enabled, prepare execution steps
  if (isStepMode) {
    prepareExecution();

    // Show initial state
    if (executionSteps.length > 0) {
      highlightLine(executionSteps[0].line);
      if (executionSteps[0].memory) {
        updateMemoryView(executionSteps[0].memory);
      }
    }
    isExecuting = false;
    runButton.disabled = false;
    runButton.textContent = 'Run Code';
    return;
  }

  try {
    let result;
    switch (language) {
      case 'javascript':
        result = await executeJavaScript(code);
        break;
      case 'python':
        outputElement.textContent = 'Loading Python environment... This may take a few seconds for the first run.';
        result = await executePython(code);
        break;
      case 'cpp':
        result = await simulateCppExecution(code);
        break;
      case 'java':
        result = await simulateJavaExecution(code);
        break;
      case 'csharp':
        result = await simulateCSharpExecution(code);
        break;
      default:
        result = {
          output: `Code execution for ${language} is not supported.\nYour ${language} code:\n${code}`,
          error: null
        };
    }
    if (result.error) {
      outputElement.textContent = result.error;
      outputElement.className = 'error-text';
    } else {
      outputElement.textContent = result.output || 'No output';
      outputElement.className = 'output-text';
    }
  } catch (error) {
    outputElement.textContent = error.toString();
    outputElement.className = 'error-text';
  } finally {
    isExecuting = false;
    runButton.disabled = false;
    runButton.textContent = 'Run Code';
  }
}

// Handle reset code button click
function handleResetCode() {
  const language = languageSelector.value;
  setDefaultCode(language);
  outputElement.textContent = 'Run your code to see the output here...';
  outputElement.className = 'output-text';

  // Reset execution state
  resetExecutionState();
}

// Handle step mode toggle
function handleStepModeToggle(event) {
  isStepMode = event.target.checked;
  if (isStepMode) {
    executionControls.style.display = 'flex';
    memoryView.style.display = 'block';
  } else {
    executionControls.style.display = 'none';
    memoryView.style.display = 'none';
    resetExecutionState();
  }
}

// Handle step execution
function handleStepExecution() {
  if (currentExecutionStep < executionSteps.length) {
    const step = executionSteps[currentExecutionStep];

    // Update output
    if (step.output) {
      outputElement.textContent += step.output;
    }

    // Update memory state
    if (step.memory) {
      updateMemoryView(step.memory);
    }

    // Highlight current line
    highlightLine(step.line);
    currentExecutionStep++;
  }
}

// Handle run all steps
function handleRunAllSteps() {
  while (currentExecutionStep < executionSteps.length) {
    handleStepExecution();
  }
}

// Handle reset execution
function handleResetExecution() {
  resetExecutionState();
  prepareExecution();
}

// Reset execution state
function resetExecutionState() {
  currentExecutionStep = 0;
  executionSteps = [];
  memoryState = {};

  // Clear memory view
  memoryContent.innerHTML = '';

  // Remove line highlighting
  if (highlightedLine !== null) {
    editor.removeLineClass(highlightedLine, 'background', 'highlight-line');
    highlightedLine = null;
  }
}

// Highlight a line in the editor
function highlightLine(lineNumber) {
  // Remove previous highlight
  if (highlightedLine !== null) {
    editor.removeLineClass(highlightedLine, 'background', 'highlight-line');
  }

  // Add new highlight
  editor.addLineClass(lineNumber, 'background', 'highlight-line');
  highlightedLine = lineNumber;

  // Scroll to the line
  editor.scrollIntoView({ line: lineNumber, ch: 0 }, 100);
}

// Update memory view
function updateMemoryView(memory) {
  memoryContent.innerHTML = '';
  for (const [name, value] of Object.entries(memory)) {
    const item = document.createElement('div');
    item.className = 'memory-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'memory-name';
    nameSpan.textContent = name;
    const valueSpan = document.createElement('span');
    valueSpan.className = 'memory-value';
    valueSpan.textContent = value;
    item.appendChild(nameSpan);
    item.appendChild(valueSpan);
    memoryContent.appendChild(item);
  }
}

// Prepare execution for step mode
function prepareExecution() {
  const language = languageSelector.value;
  const code = editor.getValue();
  switch (language) {
    case 'cpp':
      executionSteps = prepareCppExecution(code);
      break;
    case 'java':
      executionSteps = prepareJavaExecution(code);
      break;
    case 'csharp':
      executionSteps = prepareCSharpExecution(code);
      break;
    case 'javascript':
      executionSteps = prepareJavaScriptExecution(code);
      break;
    case 'python':
      // Python step execution is more complex due to Pyodide
      // For now, we'll use a simplified approach
      executionSteps = preparePythonExecution(code);
      break;
  }
}

// Execute JavaScript code
async function executeJavaScript(code) {
  try {
    // Create a safe console.log replacement to capture output
    let output = '';
    const originalConsoleLog = console.log;
    const originalPrompt = window.prompt;

    // Override console.log to capture output
    console.log = (...args) => {
      output += args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsoleLog(...args);
    };

    // Override prompt to handle user input using our custom popup
    window.prompt = async (message) => {
      try {
        // Show the input popup and wait for user input
        const userInput = await customPrompt(message || 'Enter input:');
        output += `> ${message || 'Enter input:'}\n${userInput}\n`;
        return userInput;
      } catch (error) {
        // If the user cancels, return an empty string
        return '';
      }
    };

    // Create a function from the code and execute it
    // We need to use an async function to handle the async prompt
    const executeCodeAsync = new Function('return (async function() {' + code + '})()');
    await executeCodeAsync();

    // Restore original functions
    console.log = originalConsoleLog;
    window.prompt = originalPrompt;

    return { output, error: null };
  } catch (error) {
    return { output: null, error: error.toString() };
  }
}

// Load Pyodide instance (only once)
async function loadPyodideInstance() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) {
    // If already loading, wait for it to complete
    return await pyodideLoading;
  }

  // Start loading
  pyodideLoading = (async () => {
    console.log('Loading Pyodide...');
    // Initialize Pyodide
    const pyodide = await window.loadPyodide();
    console.log('Pyodide loaded!');

    // Setup input handling with our custom prompt
    // We need to make the custom prompt available to Python
    window.customPromptAsync = customPrompt;
    await pyodide.runPythonAsync(`
      import sys
      import io
      from js import customPromptAsync
      import asyncio
      class WebInput:
          def __init__(self):
              pass
          def readline(self):
              # Use asyncio to handle the async prompt
              try:
                  loop = asyncio.get_event_loop()
                  result = loop.run_until_complete(customPromptAsync("Python input:"))
                  if result is None:
                      return ""
                  return result + "\\n"
              except Exception as e:
                  print(f"Input error: {e}")
                  return "\\n"
      sys.stdin = WebInput()
    `);
    return pyodide;
  })();

  pyodideInstance = await pyodideLoading;
  pyodideLoading = null;
  return pyodideInstance;
}

// Execute Python code
async function executePython(code) {
  try {
    // Load Pyodide if not already loaded
    const pyodide = await loadPyodideInstance();

    // Create a custom stdout to capture print statements
    pyodide.runPython(`
      import sys
      import io
      sys.stdout = io.StringIO()
      sys.stderr = io.StringIO()
    `);

    // Run the user's code
    await pyodide.runPythonAsync(code);

    // Get the captured output and errors
    const stdout = pyodide.runPython("sys.stdout.getvalue()");
    const stderr = pyodide.runPython("sys.stderr.getvalue()");

    return {
      output: stdout || '',
      error: stderr || null
    };
  } catch (error) {
    console.error('Python execution error:', error);
    return {
      output: null,
      error: error.toString()
    };
  }
}

// Simulate C++ code execution
async function simulateCppExecution(code) {
  try {
    let output = '';
    // Check if the code contains the expected greet function
    if (code.includes('std::string greet') && code.includes('return "Hello, " + name + "!"')) {
      // Simulate the output for the default example
      output += 'Hello, World!\n';

      // Check if there's user input code
      if (code.includes('std::getline(std::cin, name)')) {
        // Simulate user input using our custom popup
        const userInput = await customPrompt('Enter your name:');
        if (userInput) {
          output += `Enter your name: ${userInput}\nHello, ${userInput}!\n`;
        }
      }
    } else {
      // For custom code, provide a simulated response
      output += 'C++ Simulation:\n';
      output += 'Code analyzed and executed in simulated environment.\n';

      // Extract cout statements to simulate output
      const coutRegex = /std::cout\s*<<\s*(.+?)(?:\s*<<\s*std::endl|;)/g;
      let match;
      while ((match = coutRegex.exec(code)) !== null) {
        let coutContent = match[1].trim();

        // Handle string literals
        if (coutContent.startsWith('"') && coutContent.endsWith('"')) {
          output += coutContent.substring(1, coutContent.length - 1) + '\n';
        } else if (coutContent.includes('greet(')) {
          // Handle function calls like greet("World")
          const argMatch = /greet\(\s*"([^"]+)"\s*\)/.exec(coutContent);
          if (argMatch) {
            output += `Hello, ${argMatch[1]}!\n`;
          }
        }
      }

      // Check for user input
      if (code.includes('std::getline(std::cin, ')) {
        const varMatch = /std::getline\(std::cin,\s*([a-zA-Z0-9_]+)\)/.exec(code);
        if (varMatch) {
          const varName = varMatch[1];
          const userInput = await customPrompt(`Enter value for ${varName}:`);
          if (userInput) {
            output += `Enter value for ${varName}: ${userInput}\n`;

            // Check if the input is used in a greet function
            if (code.includes(`greet(${varName})`) || code.includes(`greet(${varName}.c_str())`)) {
              output += `Hello, ${userInput}!\n`;
            }
          }
        }
      }
    }
    return { output, error: null };
  } catch (error) {
    return { output: null, error: error.toString() };
  }
}

// Simulate Java code execution
async function simulateJavaExecution(code) {
  try {
    let output = '';
    // Check if the code contains the expected greet function
    if (code.includes('public static String greet') && code.includes('return "Hello, " + name + "!"')) {
      // Simulate the output for the default example
      output += 'Hello, World!\n';

      // Check if there's user input code
      if (code.includes('Scanner scanner = new Scanner(System.in)')) {
        // Simulate user input using our custom popup
        const userInput = await customPrompt('Enter your name:');
        if (userInput) {
          output += `Enter your name: ${userInput}\nHello, ${userInput}!\n`;
        }
      }
    } else {
      // For custom code, provide a simulated response
      output += 'Java Simulation:\n';
      output += 'Code analyzed and executed in simulated environment.\n';

      // Extract System.out.println statements to simulate output
      const printlnRegex = /System\.out\.println\((.+?)\);/g;
      let match;
      while ((match = printlnRegex.exec(code)) !== null) {
        let printContent = match[1].trim();

        // Handle string literals
        if (printContent.startsWith('"') && printContent.endsWith('"')) {
          output += printContent.substring(1, printContent.length - 1) + '\n';
        } else if (printContent.includes('greet(')) {
          // Handle function calls like greet("World")
          const argMatch = /greet\(\s*"([^"]+)"\s*\)/.exec(printContent);
          if (argMatch) {
            output += `Hello, ${argMatch[1]}!\n`;
          }
        }
      }

      // Check for user input
      if (code.includes('scanner.nextLine()')) {
        const varMatch = /String\s+([a-zA-Z0-9_]+)\s*=\s*scanner\.nextLine\(\);/.exec(code);
        if (varMatch) {
          const varName = varMatch[1];
          const userInput = await customPrompt(`Enter value for ${varName}:`);
          if (userInput) {
            output += `Enter value for ${varName}: ${userInput}\n`;

            // Check if the input is used in a greet function
            if (code.includes(`greet(${varName})`)) {
              output += `Hello, ${userInput}!\n`;
            }
          }
        }
      }
    }
    return { output, error: null };
  } catch (error) {
    return { output: null, error: error.toString() };
  }
}

// Simulate C# code execution
async function simulateCSharpExecution(code) {
  try {
    let output = '';
    // Check if the code contains the expected Greet function
    if (code.includes('static string Greet') && code.includes('return $"Hello, {name}!"')) {
      // Simulate the output for the default example
      output += 'Hello, World!\n';

      // Check if there's user input code
      if (code.includes('Console.ReadLine()')) {
        // Simulate user input using our custom popup
        const userInput = await customPrompt('Enter your name:');
        if (userInput) {
          output += `Enter your name: ${userInput}\nHello, ${userInput}!\n`;
        }
      }
    } else {
      // For custom code, provide a simulated response
      output += 'C# Simulation:\n';
      output += 'Code analyzed and executed in simulated environment.\n';

      // Extract Console.WriteLine statements to simulate output
      const writeLineRegex = /Console\.WriteLine\((.+?)\);/g;
      let match;
      while ((match = writeLineRegex.exec(code)) !== null) {
        let printContent = match[1].trim();

        // Handle string literals
        if (printContent.startsWith('"') && printContent.endsWith('"')) {
          output += printContent.substring(1, printContent.length - 1) + '\n';
        } else if (printContent.includes('Greet(')) {
          // Handle function calls like Greet("World")
          const argMatch = /Greet\(\s*"([^"]+)"\s*\)/.exec(printContent);
          if (argMatch) {
            output += `Hello, ${argMatch[1]}!\n`;
          }
        }
      }

      // Check for user input
      if (code.includes('Console.ReadLine()')) {
        const varMatch = /string\s+([a-zA-Z0-9_]+)\s*=\s*Console\.ReadLine\(\);/.exec(code);
        if (varMatch) {
          const varName = varMatch[1];
          const userInput = await customPrompt(`Enter value for ${varName}:`);
          if (userInput) {
            output += `Enter value for ${varName}: ${userInput}\n`;

            // Check if the input is used in a Greet function
            if (code.includes(`Greet(${varName})`)) {
              output += `Hello, ${userInput}!\n`;
            }
          }
        }
      }
    }
    return { output, error: null };
  } catch (error) {
    return { output: null, error: error.toString() };
  }
}

// Prepare C++ execution steps
function prepareCppExecution(code) {
  const steps = [];
  const lines = code.split('\n');
  const memory = {};
  // Find the main function
  let mainStart = -1;
  let mainEnd = -1;
  let braceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('int main()') || lines[i].includes('int main(')) {
      mainStart = i;
      braceCount = 0;
    }
    if (mainStart >= 0) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      if (braceCount === 0 && mainStart >= 0) {
        mainEnd = i;
        break;
      }
    }
  }
  if (mainStart >= 0) {
    // Add step for the main function declaration
    steps.push({
      line: mainStart,
      output: 'Starting main function...\n',
      memory: {...memory}
    });
    // Process the main function body
    for (let i = mainStart + 1; i < mainEnd; i++) {
      const line = lines[i].trim();
      // Skip empty lines and braces
      if (line === '' || line === '{' || line === '}') continue;
      // Variable declaration
      if (line.includes('std::string') || line.includes('int ') || line.includes('float ') || line.includes('double ')) {
        const varMatch = /\s*(\w+)\s+(\w+)\s*=?\s*([^;]*);/.exec(line);
        if (varMatch) {
          const varType = varMatch[1];
          const varName = varMatch[2];
          const varValue = varMatch[3].trim();
          memory[varName] = varValue || (varType === 'std::string' ? '""' : '0');
          steps.push({
            line: i,
            output: `Declared ${varType} ${varName}${varValue ? ` = ${varValue}` : ''}
`,
            memory: {...memory}
          });
        }
      }
      // Output statement
      else if (line.includes('std::cout')) {
        const coutMatch = /std::cout\s*<<\s*(.+?)(?:\s*<<\s*std::endl|;)/.exec(line);
        if (coutMatch) {
          let output = '';
          let coutContent = coutMatch[1].trim();
          // Handle string literals
          if (coutContent.startsWith('"') && coutContent.endsWith('"')) {
            output = coutContent.substring(1, coutContent.length - 1) + '\n';
          }
          // Handle variable output
          else if (memory[coutContent]) {
            output = memory[coutContent] + '\n';
          }
          // Handle function calls
          else if (coutContent.includes('greet(')) {
            const argMatch = /greet\(\s*"([^"]+)"\s*\)/.exec(coutContent);
            if (argMatch) {
              output = `Hello, ${argMatch[1]}!\n`;
            } else {
              const varMatch = /greet\(\s*(\w+)\s*\)/.exec(coutContent);
              if (varMatch && memory[varMatch[1]]) {
                // Remove quotes if it's a string
                const varValue = memory[varMatch[1]].replace(/^"|"$/g, '');
                output = `Hello, ${varValue}!\n`;
              }
            }
          }
          steps.push({
            line: i,
            output: output,
            memory: {...memory}
          });
        }
      }
      // Input statement
      else if (line.includes('std::getline(std::cin,')) {
        const inputMatch = /std::getline\(std::cin,\s*(\w+)\)/.exec(line);
        if (inputMatch) {
          const varName = inputMatch[1];
          steps.push({
            line: i,
            output: 'Enter your name: ',
            memory: {...memory}
          });
          // Simulate user input
          memory[varName] = '"User Input"';
          steps.push({
            line: i,
            output: 'User Input\n',
            memory: {...memory}
          });
        }
      }
    }
    // Add final step for return statement
    steps.push({
      line: mainEnd,
      output: 'Program finished with return code 0\n',
      memory: {...memory}
    });
  }
  return steps;
}

// Prepare Java execution steps
function prepareJavaExecution(code) {
  const steps = [];
  const lines = code.split('\n');
  const memory = {};
  // Find the main method
  let mainStart = -1;
  let mainEnd = -1;
  let braceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('public static void main')) {
      mainStart = i;
      braceCount = 0;
    }
    if (mainStart >= 0) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      if (braceCount === 0 && mainStart >= 0 && i > mainStart) {
        mainEnd = i;
        break;
      }
    }
  }
  if (mainStart >= 0) {
    // Add step for the main method declaration
    steps.push({
      line: mainStart,
      output: 'Starting main method...\n',
      memory: {...memory}
    });
    // Process the main method body
    for (let i = mainStart + 1; i < mainEnd; i++) {
      const line = lines[i].trim();
      // Skip empty lines and braces
      if (line === '' || line === '{' || line === '}') continue;
      // Variable declaration
      if (line.includes('String ') || line.includes('int ') || line.includes('float ') || line.includes('double ')) {
        const varMatch = /\s*(\w+)\s+(\w+)\s*=?\s*([^;]*);/.exec(line);
        if (varMatch) {
          const varType = varMatch[1];
          const varName = varMatch[2];
          const varValue = varMatch[3].trim();
          memory[varName] = varValue || (varType === 'String' ? '""' : '0');
          steps.push({
            line: i,
            output: `Declared ${varType} ${varName}${varValue ? ` = ${varValue}` : ''}
`,
            memory: {...memory}
          });
        }
      }
      // Output statement
      else if (line.includes('System.out.println')) {
        const printMatch = /System\.out\.println\((.+?)\);/.exec(line);
        if (printMatch) {
          let output = '';
          let printContent = printMatch[1].trim();
          // Handle string literals
          if (printContent.startsWith('"') && printContent.endsWith('"')) {
            output = printContent.substring(1, printContent.length - 1) + '\n';
          }
          // Handle variable output
          else if (memory[printContent]) {
            output = memory[printContent] + '\n';
          }
          // Handle function calls
          else if (printContent.includes('greet(')) {
            const argMatch = /greet\(\s*"([^"]+)"\s*\)/.exec(printContent);
            if (argMatch) {
              output = `Hello, ${argMatch[1]}!\n`;
            } else {
              const varMatch = /greet\(\s*(\w+)\s*\)/.exec(printContent);
              if (varMatch && memory[varMatch[1]]) {
                // Remove quotes if it's a string
                const varValue = memory[varMatch[1]].replace(/^"|"$/g, '');
                output = `Hello, ${varValue}!\n`;
              }
            }
          }
          steps.push({
            line: i,
            output: output,
            memory: {...memory}
          });
        }
      }
      // Input statement
      else if (line.includes('scanner.nextLine()')) {
        const inputMatch = /String\s+(\w+)\s*=\s*scanner\.nextLine\(\);/.exec(line);
        if (inputMatch) {
          const varName = inputMatch[1];
          steps.push({
            line: i,
            output: 'Enter your name: ',
            memory: {...memory}
          });
          // Simulate user input
          memory[varName] = '"User Input"';
          steps.push({
            line: i,
            output: 'User Input\n',
            memory: {...memory}
          });
        }
      }
    }
    // Add final step for end of main method
    steps.push({
      line: mainEnd,
      output: 'Program finished execution\n',
      memory: {...memory}
    });
  }
  return steps;
}

// Prepare C# execution steps
function prepareCSharpExecution(code) {
  const steps = [];
  const lines = code.split('\n');
  const memory = {};
  // Find the Main method
  let mainStart = -1;
  let mainEnd = -1;
  let braceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('static void Main')) {
      mainStart = i;
      braceCount = 0;
    }
    if (mainStart >= 0) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      if (braceCount === 0 && mainStart >= 0 && i > mainStart) {
        mainEnd = i;
        break;
      }
    }
  }
  if (mainStart >= 0) {
    // Add step for the Main method declaration
    steps.push({
      line: mainStart,
      output: 'Starting Main method...\n',
      memory: {...memory}
    });
    // Process the Main method body
    for (let i = mainStart + 1; i < mainEnd; i++) {
      const line = lines[i].trim();
      // Skip empty lines and braces
      if (line === '' || line === '{' || line === '}') continue;
      // Variable declaration
      if (line.includes('string ') || line.includes('int ') || line.includes('float ') || line.includes('double ')) {
        const varMatch = /\s*(\w+)\s+(\w+)\s*=?\s*([^;]*);/.exec(line);
        if (varMatch) {
          const varType = varMatch[1];
          const varName = varMatch[2];
          const varValue = varMatch[3].trim();
          memory[varName] = varValue || (varType === 'string' ? '""' : '0');
          steps.push({
            line: i,
            output: `Declared ${varType} ${varName}${varValue ? ` = ${varValue}` : ''}
`,
            memory: {...memory}
          });
        }
      }
      // Output statement
      else if (line.includes('Console.WriteLine')) {
        const printMatch = /Console\.WriteLine\((.+?)\);/.exec(line);
        if (printMatch) {
          let output = '';
          let printContent = printMatch[1].trim();
          // Handle string literals
          if (printContent.startsWith('"') && printContent.endsWith('"')) {
            output = printContent.substring(1, printContent.length - 1) + '\n';
          }
          // Handle variable output
          else if (memory[printContent]) {
            output = memory[printContent] + '\n';
          }
          // Handle function calls
          else if (printContent.includes('Greet(')) {
            const argMatch = /Greet\(\s*"([^"]+)"\s*\)/.exec(printContent);
            if (argMatch) {
              output = `Hello, ${argMatch[1]}!\n`;
            } else {
              const varMatch = /Greet\(\s*(\w+)\s*\)/.exec(printContent);
              if (varMatch && memory[varMatch[1]]) {
                // Remove quotes if it's a string
                const varValue = memory[varMatch[1]].replace(/^"|"$/g, '');
                output = `Hello, ${varValue}!\n`;
              }
            }
          }
          steps.push({
            line: i,
            output: output,
            memory: {...memory}
          });
        }
      }
      // Input statement
      else if (line.includes('Console.ReadLine()')) {
        const inputMatch = /string\s+(\w+)\s*=\s*Console\.ReadLine\(\);/.exec(line);
        if (inputMatch) {
          const varName = inputMatch[1];
          steps.push({
            line: i,
            output: 'Enter your name: ',
            memory: {...memory}
          });
          // Simulate user input
          memory[varName] = '"User Input"';
          steps.push({
            line: i,
            output: 'User Input\n',
            memory: {...memory}
          });
        }
      }
    }
    // Add final step for end of Main method
    steps.push({
      line: mainEnd,
      output: 'Program finished execution\n',
      memory: {...memory}
    });
  }
  return steps;
}

// Prepare JavaScript execution steps
function prepareJavaScriptExecution(code) {
  const steps = [];
  const lines = code.split('\n');
  const memory = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip empty lines and braces
    if (line === '' || line === '{' || line === '}') continue;
    // Variable declaration
    if (line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
      const varMatch = /(const|let|var)\s+(\w+)\s*=\s*(.+?);/.exec(line);
      if (varMatch) {
        const varType = varMatch[1];
        const varName = varMatch[2];
        const varValue = varMatch[3].trim();
        memory[varName] = varValue;
        steps.push({
          line: i,
          output: `Declared ${varType} ${varName} = ${varValue}\n`,
          memory: {...memory}
        });
      }
    }
    // Function declaration
    else if (line.startsWith('function ')) {
      const funcMatch = /function\s+(\w+)\s*\(([^)]*)\)/.exec(line);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const funcParams = funcMatch[2];
        steps.push({
          line: i,
          output: `Defined function ${funcName}(${funcParams})\n`,
          memory: {...memory}
        });
      }
    }
    // Console.log statement
    else if (line.includes('console.log')) {
      const logMatch = /console\.log\((.+?)\);/.exec(line);
      if (logMatch) {
        let output = '';
        let logContent = logMatch[1].trim();
        // Handle string literals
        if (logContent.startsWith('"') || logContent.startsWith('\'')) {
          output = logContent.substring(1, logContent.length - 1) + '\n';
        }
        // Handle variable output
        else if (memory[logContent]) {
          output = memory[logContent] + '\n';
        }
        // Handle function calls
        else if (logContent.includes('greet(')) {
          const argMatch = /greet\(\s*["']([^"']+)["']\s*\)/.exec(logContent);
          if (argMatch) {
            output = `Hello, ${argMatch[1]}!\n`;
          } else {
            const varMatch = /greet\(\s*(\w+)\s*\)/.exec(logContent);
            if (varMatch && memory[varMatch[1]]) {
              // Try to extract the value
              let varValue = memory[varMatch[1]];
              if (varValue.startsWith('"') || varValue.startsWith('\'')) {
                varValue = varValue.substring(1, varValue.length - 1);
              }
              output = `Hello, ${varValue}!\n`;
            }
          }
        }
        steps.push({
          line: i,
          output: output,
          memory: {...memory}
        });
      }
    }
    // Prompt statement
    else if (line.includes('prompt(')) {
      const promptMatch = /(const|let|var)\s+(\w+)\s*=\s*prompt\((.+?)\);/.exec(line);
      if (promptMatch) {
        const varType = promptMatch[1];
        const varName = promptMatch[2];
        const promptMsg = promptMatch[3].trim();
        let message = 'Enter input:';
        if (promptMsg.startsWith('"') || promptMsg.startsWith('\'')) {
          message = promptMsg.substring(1, promptMsg.length - 1);
        }
        steps.push({
          line: i,
          output: `${message} `,
          memory: {...memory}
        });
        // Simulate user input
        memory[varName] = '"User Input"';
        steps.push({
          line: i,
          output: 'User Input\n',
          memory: {...memory}
        });
      }
    }
  }
  // Add final step
  steps.push({
    line: lines.length - 1,
    output: 'Program execution completed\n',
    memory: {...memory}
  });
  return steps;
}

// Prepare Python execution steps (simplified)
function preparePythonExecution(code) {
  const steps = [];
  const lines = code.split('\n');
  const memory = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip empty lines and comments
    if (line === '' || line.startsWith('#')) continue;
    // Function definition
    if (line.startsWith('def ')) {
      const funcMatch = /def\s+(\w+)\s*\(([^)]*)\)/.exec(line);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const funcParams = funcMatch[2];
        steps.push({
          line: i,
          output: `Defined function ${funcName}(${funcParams})\n`,
          memory: {...memory}
        });
      }
    }
    // Variable assignment
    else if (line.includes('=') && !line.includes('==')) {
      const assignMatch = /(\w+)\s*=\s*(.+)/.exec(line);
      if (assignMatch) {
        const varName = assignMatch[1];
        const varValue = assignMatch[2].trim();
        memory[varName] = varValue;
        steps.push({
          line: i,
          output: `Assigned ${varName} = ${varValue}\n`,
          memory: {...memory}
        });
      }
    }
    // Print statement
    else if (line.startsWith('print(')) {
      const printMatch = /print\((.+?)\)/.exec(line);
      if (printMatch) {
        let output = '';
        let printContent = printMatch[1].trim();
        // Handle string literals
        if ((printContent.startsWith('"') && printContent.endsWith('"')) ||
            (printContent.startsWith('\'') && printContent.endsWith('\''))) {
          output = printContent.substring(1, printContent.length - 1) + '\n';
        }
        // Handle variable output
        else if (memory[printContent]) {
          output = memory[printContent] + '\n';
        }
        // Handle function calls
        else if (printContent.includes('greet(')) {
          const argMatch = /greet\(\s*["']([^"']+)["']\s*\)/.exec(printContent);
          if (argMatch) {
            output = `Hello, ${argMatch[1]}!\n`;
          } else {
            const varMatch = /greet\(\s*(\w+)\s*\)/.exec(printContent);
            if (varMatch && memory[varMatch[1]]) {
              // Try to extract the value
              let varValue = memory[varMatch[1]];
              if ((varValue.startsWith('"') && varValue.endsWith('"')) ||
                  (varValue.startsWith('\'') && varValue.endsWith('\''))) {
                varValue = varValue.substring(1, varValue.length - 1);
              }
              output = `Hello, ${varValue}!\n`;
            }
          }
        }
        steps.push({
          line: i,
          output: output,
          memory: {...memory}
        });
      }
    }
    // Input statement
    else if (line.includes('input(')) {
      const inputMatch = /(\w+)\s*=\s*input\((.+?)\)/.exec(line);
      if (inputMatch) {
        const varName = inputMatch[1];
        const promptMsg = inputMatch[2].trim();
        let message = '';
        if ((promptMsg.startsWith('"') && promptMsg.endsWith('"')) ||
            (promptMsg.startsWith('\'') && promptMsg.endsWith('\''))) {
          message = promptMsg.substring(1, promptMsg.length - 1);
        }
        steps.push({
          line: i,
          output: `${message} `,
          memory: {...memory}
        });
        // Simulate user input
        memory[varName] = '"User Input"';
        steps.push({
          line: i,
          output: 'User Input\n',
          memory: {...memory}
        });
      }
    }
  }
  // Add final step
  steps.push({
    line: lines.length - 1,
    output: 'Program execution completed\n',
    memory: {...memory}
  });
  return steps;
}