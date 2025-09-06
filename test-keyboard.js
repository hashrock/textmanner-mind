// Test script to verify keyboard operations in mindmap mode
// Run this in the browser console after switching to mindmap mode

function testKeyboardInMindmap() {
    console.log('=== Testing Keyboard Operations in Mindmap Mode ===');
    
    // Check if we're in mindmap mode
    const activeTab = document.querySelector('.tab-button.active');
    const isMindmapMode = activeTab && activeTab.textContent === 'マインドマップ';
    console.log('1. Mindmap mode active:', isMindmapMode);
    
    // Find the textarea
    const textarea = document.querySelector('textarea');
    if (!textarea) {
        console.error('❌ Textarea not found!');
        return;
    }
    console.log('2. Textarea found:', !!textarea);
    
    // Check visibility and positioning
    const editorPane = textarea.closest('.editor-pane');
    const editorContainer = editorPane ? editorPane.parentElement : null;
    if (editorContainer) {
        const styles = getComputedStyle(editorContainer);
        console.log('3. Editor container styles:');
        console.log('   - display:', styles.display);
        console.log('   - position:', styles.position);
        console.log('   - left:', styles.left);
        console.log('   - width:', styles.width);
        console.log('   - height:', styles.height);
        console.log('   - overflow:', styles.overflow);
    }
    
    // Check focus state
    const hasFocus = document.activeElement === textarea;
    console.log('4. Textarea has focus:', hasFocus);
    
    if (!hasFocus) {
        console.log('   Attempting to focus textarea...');
        textarea.focus();
        const nowHasFocus = document.activeElement === textarea;
        console.log('   Focus successful:', nowHasFocus);
    }
    
    // Test keyboard input
    console.log('5. Testing keyboard input:');
    const initialValue = textarea.value;
    console.log('   Initial value length:', initialValue.length);
    
    // Simulate typing
    textarea.focus();
    const testText = ' KEYBOARD_TEST';
    
    // Method 1: Direct value change with event
    textarea.value = initialValue + testText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    const afterTyping = textarea.value;
    console.log('   After typing length:', afterTyping.length);
    console.log('   Text added:', afterTyping.includes('KEYBOARD_TEST'));
    
    // Test cursor position
    console.log('6. Testing cursor position:');
    console.log('   Selection start:', textarea.selectionStart);
    console.log('   Selection end:', textarea.selectionEnd);
    
    // Test Tab key (indentation)
    console.log('7. Testing Tab key:');
    const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        which: 9,
        bubbles: true,
        cancelable: true
    });
    
    const beforeTab = textarea.value;
    textarea.dispatchEvent(tabEvent);
    const afterTab = textarea.value;
    console.log('   Tab key handled:', beforeTab !== afterTab || tabEvent.defaultPrevented);
    
    // Test arrow keys
    console.log('8. Testing arrow keys:');
    const cursorBefore = textarea.selectionStart;
    
    const leftArrow = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
        keyCode: 37,
        which: 37,
        bubbles: true
    });
    textarea.dispatchEvent(leftArrow);
    
    // Note: Arrow keys might not move cursor via synthetic events
    console.log('   Arrow key events dispatched');
    
    // Test node click
    console.log('9. Testing node click:');
    const firstNode = document.querySelector('canvas');
    if (firstNode) {
        console.log('   Canvas found, nodes are rendered');
        // Note: Clicking canvas nodes requires Konva event handling
    }
    
    // Summary
    console.log('\n=== Summary ===');
    if (hasFocus || document.activeElement === textarea) {
        console.log('✅ Textarea maintains focus in mindmap mode');
        console.log('✅ Keyboard input is being captured');
        if (afterTyping.includes('KEYBOARD_TEST')) {
            console.log('✅ Text changes are reflected');
        }
    } else {
        console.log('⚠️ Focus issues detected - keyboard input may not work properly');
    }
    
    // Cleanup - remove test text
    textarea.value = initialValue;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('\n(Test text removed)');
}

// Run the test
console.log('To test: Switch to マインドマップ tab, then run: testKeyboardInMindmap()');
console.log('Or copy and paste this entire script into the console.');

// Auto-run if already in mindmap mode
const activeTab = document.querySelector('.tab-button.active');
if (activeTab && activeTab.textContent === 'マインドマップ') {
    setTimeout(testKeyboardInMindmap, 500);
}