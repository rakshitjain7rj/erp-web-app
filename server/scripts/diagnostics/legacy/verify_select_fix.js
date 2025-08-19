const fs = require('fs');
const path = require('path');
const selectFilePath = path.join(__dirname, '../../../erp-frontend/src/components/ui/select.tsx');
const selectContent = fs.readFileSync(selectFilePath, 'utf8');
const hasProperHoverStyle = selectContent.includes('dark:hover:bg-gray-600');
const hasProperFocusStyle = selectContent.includes('dark:focus:bg-gray-600');
const hasProperDarkModeContent = selectContent.includes('dark:bg-gray-800');
console.log('Verification Results:');
console.log('-------------------');
console.log(`Has proper hover style: ${hasProperHoverStyle ? '✅ Yes' : '❌ No'}`);
console.log(`Has proper focus style: ${hasProperFocusStyle ? '✅ Yes' : '❌ No'}`);
console.log(`Has proper dark mode content bg: ${hasProperDarkModeContent ? '✅ Yes' : '❌ No'}`);
const pageFilePath = path.join(__dirname, '../../../erp-frontend/src/pages/ASUUnit1Page.tsx');
const pageContent = fs.readFileSync(pageFilePath, 'utf8');
const usesSimplifiedSelectTrigger = !pageContent.includes('dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200');
const hasSelectImport = pageContent.includes('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from');
console.log('\nASUUnit1Page Verification:');
console.log('-------------------------');
console.log(`Uses simplified select trigger: ${usesSimplifiedSelectTrigger ? '✅ Yes' : '❌ No'}`);
console.log(`Has select imports: ${hasSelectImport ? '✅ Yes' : '❌ No'}`);
console.log('\nSummary:');
if (hasProperHoverStyle && hasProperFocusStyle && hasProperDarkModeContent && usesSimplifiedSelectTrigger && hasSelectImport) {
  console.log('✅ All changes applied. The select dropdown should be visible in dark mode.');
} else {
  console.log('❌ Some changes may not have been applied correctly.');
}
