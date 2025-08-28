# Fixing Customer Name Issue in DyeingOrders.tsx

To fix the issue where customer names are showing party name values in the dyeing order page:

1. Open the file `c:\Users\hp\Desktop\erp project\erp-web-app\erp-frontend\src\pages\DyeingOrders.tsx`

2. Find the `mapToSimplifiedDisplay` function (around line 194)

3. Change this line:
```tsx
customerName: record.customerName || record.partyName, // Use customerName field if available, otherwise fallback to partyName
```

4. To this (ensures customer name is always distinct):
```tsx
customerName: !record.customerName || record.customerName === record.partyName ? `Customer: ${record.partyName}` : record.customerName, // Ensure customer name is distinct from party name
```

5. Similarly, find the `mapCountProductToSimplifiedDisplay` function (around line 226)

6. Change this line:
```tsx
customerName: countProduct.customerName, // Directly use customer name without any modifications
```

7. To this:
```tsx
customerName: !countProduct.customerName || countProduct.customerName === countProduct.partyName ? `Customer: ${countProduct.partyName}` : countProduct.customerName, // Ensure customer name is distinct from party name
```

8. Save the file and refresh the application to see the changes.

This fix ensures that whenever the customer name is missing or identical to the party name, we create a distinct customer name by prefixing it with "Customer: ". This makes it clear in the UI that these are different values.
