const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'erp-frontend', 'src', 'pages', 'ASUUnit1Page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');

// Function to find JSX tag issues
function analyzeJSXTags() {
  const stack = [];
  const issues = [];
  const openingTagRegex = /<([A-Z][A-Za-z0-9]*)(?=[\s>])/g;
  const closingTagRegex = /<\/([A-Z][A-Za-z0-9]*)>/g;
  
  lines.forEach((line, lineNumber) => {
    // Check for opening tags
    let match;
    while ((match = openingTagRegex.exec(line)) !== null) {
      // Skip self-closing tags
      const tagPos = match.index;
      const nextChar = line.substr(tagPos + match[0].length).trim()[0];
      const isSelfClosing = nextChar === '/' || line.substr(tagPos).includes('/>');
      
      if (!isSelfClosing) {
        stack.push({
          tag: match[1],
          line: lineNumber + 1
        });
      }
    }
    
    // Check for closing tags
    while ((match = closingTagRegex.exec(line)) !== null) {
      const closingTag = match[1];
      if (stack.length === 0) {
        issues.push({
          type: 'extra-closing',
          tag: closingTag,
          line: lineNumber + 1
        });
      } else {
        const lastOpening = stack.pop();
        if (lastOpening.tag !== closingTag) {
          issues.push({
            type: 'mismatch',
            expected: lastOpening.tag,
            found: closingTag,
            openLine: lastOpening.line,
            closeLine: lineNumber + 1
          });
          // Push back the opening tag since it wasn't properly closed
          stack.push(lastOpening);
        }
      }
    }
  });
  
  // Check for unclosed tags
  if (stack.length > 0) {
    stack.forEach(item => {
      issues.push({
        type: 'unclosed',
        tag: item.tag,
        line: item.line
      });
    });
  }
  
  return issues;
}

const issues = analyzeJSXTags();

console.log('Tag Analysis Results:');
if (issues.length === 0) {
  console.log('No JSX tag issues found.');
} else {
  console.log(`Found ${issues.length} issues:`);
  issues.forEach((issue, index) => {
    console.log(`Issue #${index + 1}:`);
    if (issue.type === 'mismatch') {
      console.log(`  Line ${issue.closeLine}: Expected closing tag </>${issue.expected}></> but found </>${issue.found}</>`);
      console.log(`  Opened on line ${issue.openLine}`);
    } else if (issue.type === 'unclosed') {
      console.log(`  Line ${issue.line}: Unclosed tag </>${issue.tag}</>`);
    } else if (issue.type === 'extra-closing') {
      console.log(`  Line ${issue.line}: Extra closing tag </>${issue.tag}</>`);
    }
  });
}
