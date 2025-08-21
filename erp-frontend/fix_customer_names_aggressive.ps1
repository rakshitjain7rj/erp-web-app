$dyeingOrdersPath = "src\pages\DyeingOrders.tsx"
$content = Get-Content -Path $dyeingOrdersPath -Raw

# 1. Replace the mapToSimplifiedDisplay function
$mapperPattern = "(?s)  // ================= MAPPING FUNCTION =================.*?// ================= COUNT PRODUCT MAPPING FUNCTION =================" 
$mapperReplacement = Get-Content -Path "src\pages\fixed_mapper_function.txt" -Raw

$content = [regex]::Replace($content, $mapperPattern, $mapperReplacement)

# 2. Replace the mapCountProductToSimplifiedDisplay function
$countProductMapperPattern = "(?s)  // ================= COUNT PRODUCT MAPPING FUNCTION =================.*?return mappedRecord;\s+\};\s+" 
$countProductMapperReplacement = Get-Content -Path "src\pages\fixed_count_product_mapper.txt" -Raw

$content = [regex]::Replace($content, $countProductMapperPattern, $countProductMapperReplacement)

# 3. Replace the processed products part in fetchCountProducts
$fetchProductsPattern = "(?s)      // Process and verify data integrity for each product\s+const processedProducts = products\.map\(product => \{.*?return product;\s+\}\);" 
$fetchProductsReplacement = Get-Content -Path "src\pages\fixed_fetch_products.txt" -Raw

$content = [regex]::Replace($content, $fetchProductsPattern, $fetchProductsReplacement)

# Save the changes
Set-Content -Path $dyeingOrdersPath -Value $content

Write-Host "✅ Aggressive fix applied successfully! All mapping functions updated to ensure unique customer names."
