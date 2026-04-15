// 🔍 QUICK DIAGNOSTIC SCRIPT
// Copy and paste this into your browser DevTools Console while on the quiz page
// This will show you exactly what data the API is returning

// Step 1: Get the full quiz data from the page
console.group('📊 QUIZ DATA DIAGNOSTIC');

// Try to capture the quiz data from the component
const script = `
(function() {
  // Look for quiz data in window or global scope
  if (window.ng) {
    console.log('✅ Angular detected');
    // Try to find component data through various Angular methods
    const button = document.querySelector('button:contains("Start")');
    if (button) console.log('Quiz Start button found');
  }
  
  // Listen for quiz initialization
  const originalLog = console.log;
  let capturedQcmData = null;
  
  console.log = function(...args) {
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('INITIALIZING QUIZ') || args[0].includes('Question')) {
        console.log.call(console, '🎯', ...args);
        if (args[1]) capturedQcmData = args[1];
      }
    }
    return originalLog.call(console, ...args);
  };
  
  // Instructions
  console.group('📋 NEXT STEPS:');
  console.log('1. Click "Start" on any quiz');
  console.log('2. Watch the Console for logs starting with "🎯" and "✍️"');
  console.log('3. Look for "choicesCount:" - if it shows 0, that\'s the problem');
  console.log('4. Look for "choixIsNull:" - if true, the API isn\'t returning choices');
  console.groupEnd();
})();
`;

eval(script);

console.log('✅ Diagnostic script loaded');
console.log('ℹ️ Now go back to your quiz page and click "Start Quiz"');
console.log('✅ Watch the console output for data');
console.groupEnd();

// When you see the question logged, check:
// choicesCount: should be > 0 (e.g., 4 for a 4-choice question)
// choicesData: should be an array with choice objects
// choixIsNull: should be false