// Test cursor position with "  Hello, " text
console.log('=== Testing cursor position with spaces ===');

const textarea = document.querySelector('textarea');
if (textarea) {
  // Clear and set test text
  textarea.value = '  Hello, ';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  console.log('Text set to: "  Hello, "');
  console.log('Text length:', textarea.value.length);
  
  // Test cursor at different positions
  setTimeout(() => {
    // Position at end
    const endPos = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(endPos, endPos);
    document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
    console.log('Cursor at end (position', endPos, ')');
    
    // Check console for debug logs
    console.log('Check the console for Debug logs showing:');
    console.log('- Character offsets array');
    console.log('- Cursor position calculation');
    
    // Test different positions
    setTimeout(() => {
      textarea.setSelectionRange(0, 0);
      document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
      console.log('Cursor at position 0');
      
      setTimeout(() => {
        textarea.setSelectionRange(2, 2);
        document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
        console.log('Cursor at position 2 (after leading spaces)');
        
        setTimeout(() => {
          textarea.setSelectionRange(7, 7);
          document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
          console.log('Cursor at position 7 (after "Hello")');
        }, 500);
      }, 500);
    }, 500);
  }, 500);
} else {
  console.error('Textarea not found');
}