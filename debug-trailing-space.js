// Debug cursor with trailing space
console.log('=== Debugging cursor with trailing space ===');

const textarea = document.querySelector('textarea');
if (textarea) {
  // Test with trailing space
  console.log('Setting text to "Hello " (with trailing space)');
  textarea.value = 'Hello ';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    // Position at the very end (after space)
    const endPos = textarea.value.length; // Should be 6
    textarea.focus();
    textarea.setSelectionRange(endPos, endPos);
    document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
    
    console.log('Text:', JSON.stringify(textarea.value));
    console.log('Text length:', textarea.value.length);
    console.log('Cursor position:', endPos);
    console.log('Character at cursor-1:', JSON.stringify(textarea.value[endPos-1]));
    
    // Check what the node thinks
    setTimeout(() => {
      // Try position before the space
      const beforeSpace = endPos - 1;
      textarea.setSelectionRange(beforeSpace, beforeSpace);
      document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
      
      console.log('\nCursor at position', beforeSpace, '(before space)');
      console.log('Character at cursor:', JSON.stringify(textarea.value[beforeSpace]));
      
      // Back to end
      setTimeout(() => {
        textarea.setSelectionRange(endPos, endPos);
        document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
        console.log('\nCursor back at end position', endPos);
        console.log('Check if cursor is visible in mindmap');
      }, 500);
    }, 500);
  }, 500);
}