$dyeingOrdersPath = "src\pages\DyeingOrders.tsx"
$content = Get-Content -Path $dyeingOrdersPath -Raw

# 1. Replace the mapToSimplifiedDisplay function
$mapperPattern = "(?s)// ================= MAPPING FUNCTION =================.*?// ================= COUNT PRODUCT MAPPING FUNCTION =================" 
$mapperReplacement = Get-Content -Path "src\pages\preserve_customer_name_mapper.txt" -Raw

$content = [regex]::Replace($content, $mapperPattern, $mapperReplacement)

# 2. Replace the mapCountProductToSimplifiedDisplay function
$countProductMapperPattern = "(?s)  // ================= COUNT PRODUCT MAPPING FUNCTION =================.*?return mappedRecord;\s+\};\s+" 
$countProductMapperReplacement = Get-Content -Path "src\pages\preserve_count_product_mapper.txt" -Raw

$content = [regex]::Replace($content, $countProductMapperPattern, $countProductMapperReplacement)

# 3. Replace the processed products part in fetchCountProducts
$fetchProductsPattern = "(?s)      // Process and verify data integrity for each product\s+const processedProducts = products\.map\(product => \{.*?return product;\s+\}\);" 
$fetchProductsReplacement = Get-Content -Path "src\pages\preserve_fetch_products.txt" -Raw

$content = [regex]::Replace($content, $fetchProductsPattern, $fetchProductsReplacement)

# Save the changes
Set-Content -Path $dyeingOrdersPath -Value $content

Write-Host "✅ PRESERVE USER INPUT fix applied successfully! Customer names will now display exactly what was entered in the form."
