# Direct fix - remove ALL customer name transformations

$filePath = "src\pages\DyeingOrders.tsx"
$content = Get-Content $filePath -Raw

# 1. Fix mapToSimplifiedDisplay - NO transformations at all
$pattern1 = 'customerName: record\.customerName \|\| "".*'
$replacement1 = 'customerName: record.customerName, // Direct value only'
$content = $content -replace $pattern1, $replacement1

# 2. Fix mapCountProductToSimplifiedDisplay - NO transformations at all  
$pattern2 = 'customerName: countProduct\.customerName \|\| "".*'
$replacement2 = 'customerName: countProduct.customerName, // Direct value only'
$content = $content -replace $pattern2, $replacement2

# 3. Fix handleEdit - NO transformations at all
$pattern3 = 'customerName: record\.customerName \|\| "".*PRESERVE USER INPUT.*'
$replacement3 = 'customerName: record.customerName, // Direct value only'
$content = $content -replace $pattern3, $replacement3

# 4. Fix handleCountProductEditSuccess - completely remove transformation
$pattern4 = 'customerName: updatedProduct\.customerName.*PRESERVE USER INPUT.*'
$replacement4 = 'customerName: updatedProduct.customerName,'
$content = $content -replace $pattern4, $replacement4

# 5. Remove any remaining fallback logic in fetchCountProducts
$pattern5 = 'return product;'
$replacement5 = 'return { ...product, customerName: product.customerName };'
$content = $content -replace $pattern5, $replacement5

Set-Content $filePath $content

Write-Host "FINAL FIX APPLIED - All customer name transformations removed!"
