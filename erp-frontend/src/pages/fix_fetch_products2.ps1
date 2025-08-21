$content = Get-Content ".\DyeingOrders.tsx" -Raw

# Fix the processedProducts mapping in fetchCountProducts
$pattern = 'customerName: product\.customerName \|\| `Customer for \$\{product\.id\}`'
$replacement = 'customerName: `Customer: ${product.partyName}`'

$content = $content -replace $pattern, $replacement

# Write the updated content back to the file
$content | Set-Content ".\DyeingOrders.tsx"

Write-Host "fetchCountProducts fix applied successfully!"
