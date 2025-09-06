// Test auto-indent on Enter key
console.log('=== Testing auto-indent on Enter ===');

const textarea = document.querySelector('textarea');
if (textarea) {
  // Test 1: Set indented text
  console.log('\n--- Test 1: Setting indented text ---');
  textarea.value = '  Indented line';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Position cursor at end
  textarea.focus();
  textarea.setSelectionRange(15, 15); // End of "  Indented line"
  
  console.log('Text:', JSON.stringify(textarea.value));
  console.log('Cursor position:', textarea.selectionStart);
  
  // Simulate Enter key
  console.log('\n--- Test 2: Simulating Enter key ---');
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  });
  
  const prevented = !textarea.dispatchEvent(enterEvent);
  console.log('Enter event prevented:', prevented);
  
  // Check if indent was maintained
  setTimeout(() => {
    console.log('\n--- Test 3: Checking result ---');
    console.log('Text after Enter:', JSON.stringify(textarea.value));
    console.log('Expected: "  Indented line\\n  "');
    console.log('Cursor position:', textarea.selectionStart);
    
    // Test with different indent levels
    console.log('\n--- Test 4: Testing different indent levels ---');
    const testCases = [
      'No indent',
      '  Two spaces',
      '    Four spaces',
      '      Six spaces'
    ];
    
    testCases.forEach((testText, i) => {
      setTimeout(() => {
        console.log(`\nTest ${i + 1}: "${testText}"`);
        textarea.value = testText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.setSelectionRange(testText.length, testText.length);
        
        // Try Enter
        const enter = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true
        });
        textarea.dispatchEvent(enter);
        
        setTimeout(() => {
          console.log('Result:', JSON.stringify(textarea.value));
        }, 100);
      }, i * 500);
    });
  }, 500);
  
  // Check if api functions are available
  console.log('\n--- Debugging: Check if API is available ---');
  console.log('textarea exists:', !!textarea);
  console.log('isComposing check needed');
  
} else {
  console.error('Textarea not found');
}

console.log('\nManual test: Type "  Test" (with 2 spaces), press Enter at the end');
console.log('Expected: New line should start with 2 spaces');