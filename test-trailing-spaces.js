// Test cursor position with trailing spaces
console.log('=== Testing cursor position with trailing spaces ===');

const textarea = document.querySelector('textarea');
if (textarea) {
  // Test 1: Text with leading spaces
  console.log('\n--- Test 1: Leading spaces "  Hello" ---');
  textarea.value = '  Hello';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    textarea.focus();
    const pos = textarea.value.length;
    textarea.setSelectionRange(pos, pos);
    document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
    console.log('Text:', JSON.stringify(textarea.value));
    console.log('Length:', textarea.value.length);
    console.log('Cursor at end position:', pos);
    
    // Test 2: Text with trailing spaces
    setTimeout(() => {
      console.log('\n--- Test 2: Trailing spaces "Hello  " ---');
      textarea.value = 'Hello  ';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        const pos2 = textarea.value.length;
        textarea.setSelectionRange(pos2, pos2);
        document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
        console.log('Text:', JSON.stringify(textarea.value));
        console.log('Length:', textarea.value.length);
        console.log('Cursor at end position:', pos2);
        
        // Test 3: Both leading and trailing
        setTimeout(() => {
          console.log('\n--- Test 3: Both "  Hello  " ---');
          textarea.value = '  Hello  ';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          
          setTimeout(() => {
            const pos3 = textarea.value.length;
            textarea.setSelectionRange(pos3, pos3);
            document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
            console.log('Text:', JSON.stringify(textarea.value));
            console.log('Length:', textarea.value.length);
            console.log('Cursor at end position:', pos3);
            
            // Test at different positions
            console.log('\n--- Testing different cursor positions ---');
            for (let i = 0; i <= textarea.value.length; i++) {
              textarea.setSelectionRange(i, i);
              document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
              console.log(`Position ${i}: char = "${textarea.value[i] || 'END'}"`);
            }
            
            // Check what the parser does
            console.log('\n--- Check parsed node ---');
            console.log('Look at the mindmap to see:');
            console.log('1. What text is displayed in the node');
            console.log('2. Where the cursor appears');
            console.log('3. If it matches the actual cursor position');
            
          }, 500);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 500);
} else {
  console.error('Textarea not found');
}

console.log('\nAlso manually test by typing "  Hello, " and moving cursor to the end');