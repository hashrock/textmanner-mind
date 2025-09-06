// Test that trailing spaces are preserved
console.log('=== Testing trailing space preservation ===');

const textarea = document.querySelector('textarea');
if (textarea) {
  // Test various texts with trailing spaces
  const tests = [
    'Hello ',
    'Hello  ',
    '  Hello ',
    '  Hello  ',
    'Test    '
  ];
  
  let index = 0;
  
  function runTest() {
    if (index >= tests.length) {
      console.log('\n✅ All tests completed. Check the mindmap display.');
      return;
    }
    
    const testText = tests[index];
    console.log(`\n--- Test ${index + 1}: "${testText}" ---`);
    console.log(`Text length: ${testText.length}`);
    console.log(`Trailing spaces: ${testText.length - testText.trimEnd().length}`);
    
    textarea.value = testText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    setTimeout(() => {
      // Position cursor at the end
      textarea.focus();
      textarea.setSelectionRange(testText.length, testText.length);
      document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
      
      console.log('Cursor at end position:', testText.length);
      console.log('Check mindmap: Text should show trailing spaces, cursor at end');
      
      index++;
      setTimeout(runTest, 1000);
    }, 500);
  }
  
  runTest();
} else {
  console.error('Textarea not found');
}