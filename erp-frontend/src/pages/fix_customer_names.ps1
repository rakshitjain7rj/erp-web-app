$content = Get-Content ".\DyeingOrders.tsx" -Raw

# Fix the mapToSimplifiedDisplay function
$pattern1 = 'customerName: record.customerName \|\| record.partyName, // Use customerName field if available, otherwise fallback to partyName'
$replacement1 = 'customerName: (!record.customerName || record.customerName === record.partyName) ? `Customer: ${record.partyName}` : record.customerName, // Ensure customer name is distinct from party name'

$content = $content -replace $pattern1, $replacement1

# Fix the mapCountProductToSimplifiedDisplay function
$pattern2 = 'customerName: countProduct.customerName, // Directly use customer name without any modifications'
$replacement2 = 'customerName: (!countProduct.customerName || countProduct.customerName === countProduct.partyName) ? `Customer: ${countProduct.partyName}` : countProduct.customerName, // Ensure customer name is distinct from party name'

$content = $content -replace $pattern2, $replacement2

# Write the updated content back to the file
$content | Set-Content ".\DyeingOrders.tsx"

Write-Host "Customer name fixes applied successfully!"
