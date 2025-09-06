/**
 * Checks if text has multiple root nodes (lines without indentation)
 */
export function hasMultipleRoots(text: string): boolean {
  if (!text.trim()) return false
  
  const lines = text.split('\n')
  let rootCount = 0
  
  for (const line of lines) {
    const trimmedLine = line.trimStart()
    // Count non-empty lines with no indentation
    if (trimmedLine && line.search(/\S/) === 0) {
      rootCount++
      if (rootCount > 1) return true
    }
  }
  
  return false
}

/**
 * Formats text to ensure single root by indenting all existing content
 * and adding a default root node
 */
export function formatToSingleRoot(text: string): string {
  if (!text.trim()) return text
  if (!hasMultipleRoots(text)) return text
  
  const lines = text.split('\n')
  const processedLines: string[] = []
  
  // Add default root
  processedLines.push('Mindmap')
  
  // Indent all existing lines
  lines.forEach((line) => {
    if (line.trim()) {
      // Add 2 spaces of indentation
      processedLines.push('  ' + line)
    } else {
      // Keep empty lines but also indent them to maintain structure
      const leadingSpaces = line.length
      processedLines.push(' '.repeat(leadingSpaces + 2))
    }
  })
  
  return processedLines.join('\n')
}