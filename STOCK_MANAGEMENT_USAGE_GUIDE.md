# Stock Management Modal - Complete Usage Guide

## 📦 Overview

The Stock Management Modal is a powerful tool for tracking inventory movements for each item in your ERP system. It provides real-time stock tracking, historical logs, and easy-to-use forms for managing stock in, out, and spoilage.

---

## 🎯 Purpose

The Stock Management Modal helps you:
- ✅ Track all stock movements (additions, usage, spoilage)
- ✅ Maintain accurate inventory balance
- ✅ Record reasons for stock changes
- ✅ View complete history of stock transactions
- ✅ Prevent over-usage (validates against available stock)
- ✅ Generate audit trails for inventory

---

## 🚀 How to Access

1. Navigate to **Inventory** page (`/inventory`)
2. Find the item you want to manage
3. Click the **green 📈 "Manage Stock"** icon in the Actions column
4. The Stock Management Modal will open

---

## 📊 Modal Layout

### **Header Section**
- **Title**: "Stock Management"
- **Item Name**: Shows which product you're managing
- **Close Button**: X icon to close the modal

### **Stock Overview (Top Stats)**
Displays 4 key metrics in a grid:

| Metric | Color | Description |
|--------|-------|-------------|
| **Total In** | Green | Total quantity ever added to stock |
| **Used** | Blue | Total quantity removed for production/testing |
| **Spoiled** | Red | Total quantity marked as damaged/expired |
| **Balance** | Indigo | Current available stock (Total In - Used - Spoiled) |

### **Tabs**
Four tabs for different operations:
1. **Stock In** - Add new stock
2. **Stock Out** - Record stock usage
3. **Spoilage** - Log damaged/expired stock
4. **Logs** - View transaction history

---

## 📝 Tab 1: Stock In

### **Purpose**
Record new stock being added to inventory (e.g., from suppliers, transfers, production)

### **Form Fields**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| **Quantity (kg)** | ✅ Yes | Number | Amount of stock being added (e.g., 5.5) |
| **Date** | ✅ Yes | Date | When the stock was received |
| **Source** | ❌ No | Text | Where the stock came from (e.g., "ABC Supplier", "Transfer from Warehouse B") |
| **Remarks** | ❌ No | Text | Additional notes (e.g., "Batch #12345", "Quality checked") |

### **How to Use**

1. Click the **"Stock In"** tab
2. Enter the **quantity** (e.g., 10.5 kg)
3. Select the **date** (defaults to today)
4. Optionally enter **source** (supplier name, transfer location, etc.)
5. Optionally add **remarks** (batch number, quality notes, etc.)
6. Click **"Add Stock"** button
7. Success message appears: "Added X kg to stock"
8. Stock stats update automatically
9. Form resets for next entry

### **Example Use Cases**

**Scenario 1: Receiving from Supplier**
- Quantity: 50.0 kg
- Date: 2025-11-24
- Source: "XYZ Textiles Ltd"
- Remarks: "Batch #A1234, Quality Grade A"

**Scenario 2: Internal Transfer**
- Quantity: 25.5 kg
- Date: 2025-11-24
- Source: "Transfer from Warehouse B"
- Remarks: "For urgent production order"

**Scenario 3: Production Output**
- Quantity: 15.0 kg
- Date: 2025-11-24
- Source: "Internal Production"
- Remarks: "Finished goods from Line 3"

---

## 📤 Tab 2: Stock Out

### **Purpose**
Record stock being removed or used from inventory (e.g., for production, testing, transfers)

### **Form Fields**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| **Quantity (kg)** | ✅ Yes | Number | Amount of stock being removed |
| **Date** | ✅ Yes | Date | When the stock was used |
| **Purpose** | ❌ No | Dropdown | Why stock is being removed |
| **Remarks** | ❌ No | Text | Additional details |

### **Purpose Options**
- **Production** - Used in manufacturing
- **Testing** - Quality testing samples
- **Sampling** - Customer samples
- **Transfer** - Moving to another location
- **Other** - Other purposes

### **Validation**
- ⚠️ **Cannot exceed available balance**
- Shows "Available: X kg" below quantity field
- Error if quantity > balance: "Insufficient stock. Available: X kg"

### **How to Use**

1. Click the **"Stock Out"** tab
2. Enter the **quantity** to remove
3. Check the **"Available: X kg"** indicator
4. Select the **date**
5. Choose the **purpose** from dropdown
6. Optionally add **remarks**
7. Click **"Remove Stock"** button
8. Success message appears: "Removed X kg from stock"
9. Stock stats update automatically

### **Example Use Cases**

**Scenario 1: Production Usage**
- Quantity: 20.0 kg
- Date: 2025-11-24
- Purpose: Production
- Remarks: "Order #5678, Customer: ABC Corp"

**Scenario 2: Quality Testing**
- Quantity: 0.5 kg
- Date: 2025-11-24
- Purpose: Testing
- Remarks: "Lab test for new batch"

**Scenario 3: Customer Sample**
- Quantity: 2.0 kg
- Date: 2025-11-24
- Purpose: Sampling
- Remarks: "Sample for client XYZ"

---

## ⚠️ Tab 3: Spoilage

### **Purpose**
Log stock that is damaged, expired, contaminated, or otherwise unusable

### **Form Fields**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| **Quantity (kg)** | ✅ Yes | Number | Amount of stock spoiled |
| **Date** | ✅ Yes | Date | When spoilage was discovered |
| **Reason** | ❌ No | Dropdown | Why stock is spoiled |
| **Remarks** | ❌ No | Text | Detailed explanation |

### **Reason Options**
- **Damaged** - Physical damage
- **Expired** - Past expiration date
- **Contaminated** - Contamination detected
- **Quality Issue** - Failed quality checks
- **Other** - Other reasons

### **Validation**
- ⚠️ **Cannot exceed available balance**
- Shows "Available: X kg" below quantity field
- Error if quantity > balance: "Insufficient stock. Available: X kg"

### **How to Use**

1. Click the **"Spoilage"** tab
2. Enter the **quantity** spoiled
3. Check the **"Available: X kg"** indicator
4. Select the **date**
5. Choose the **reason** from dropdown
6. Add detailed **remarks** explaining the issue
7. Click **"Log Spoilage"** button
8. Success message appears: "Logged X kg spoilage"
9. Stock stats update automatically

### **Example Use Cases**

**Scenario 1: Water Damage**
- Quantity: 5.0 kg
- Date: 2025-11-24
- Reason: Damaged
- Remarks: "Water leak in storage area, material soaked"

**Scenario 2: Expired Material**
- Quantity: 3.5 kg
- Date: 2025-11-24
- Reason: Expired
- Remarks: "Batch #A123 expired on 2025-11-20"

**Scenario 3: Quality Failure**
- Quantity: 2.0 kg
- Date: 2025-11-24
- Reason: Quality Issue
- Remarks: "Failed tensile strength test, below spec"

---

## 📋 Tab 4: Logs

### **Purpose**
View complete history of all stock transactions for this item

### **What You See**

Each log entry shows:
- **Transaction Type**: Stock In / Stock Out / Spoilage
- **Quantity**: Amount (in kg)
- **Date**: When it happened
- **Details**: Source, Purpose, or Reason (depending on type)
- **Remarks**: Any additional notes

### **Color Coding**
- 🟢 **Green** - Stock In entries
- 🔵 **Blue** - Stock Out entries
- 🔴 **Red** - Spoilage entries

### **How to Use**

1. Click the **"Logs"** tab
2. Scroll through the list of transactions
3. Most recent entries appear at the top
4. Review any transaction details
5. Use this for:
   - Auditing stock movements
   - Investigating discrepancies
   - Tracking usage patterns
   - Compliance reporting

### **Example Log Entry**

```
🟢 Stock In: 50.0kg
   Date: Nov 24, 2025
   Source: XYZ Textiles Ltd
   Remarks: Batch #A1234, Quality Grade A
```

---

## 🔄 Workflow Examples

### **Example 1: Complete Stock Lifecycle**

**Step 1: Receive Stock**
- Tab: Stock In
- Quantity: 100.0 kg
- Source: "Main Supplier"
- Result: Total In = 100.0 kg, Balance = 100.0 kg

**Step 2: Use for Production**
- Tab: Stock Out
- Quantity: 60.0 kg
- Purpose: Production
- Result: Used = 60.0 kg, Balance = 40.0 kg

**Step 3: Log Spoilage**
- Tab: Spoilage
- Quantity: 5.0 kg
- Reason: Damaged
- Result: Spoiled = 5.0 kg, Balance = 35.0 kg

**Step 4: Add More Stock**
- Tab: Stock In
- Quantity: 50.0 kg
- Source: "Backup Supplier"
- Result: Total In = 150.0 kg, Balance = 85.0 kg

**Final Stats:**
- Total In: 150.0 kg
- Used: 60.0 kg
- Spoiled: 5.0 kg
- Balance: 85.0 kg

---

## ✅ Best Practices

### **1. Always Fill Required Fields**
- Quantity and Date are mandatory
- System won't allow submission without them

### **2. Be Specific in Remarks**
- Include batch numbers, order numbers, customer names
- This helps with traceability and audits

### **3. Use Correct Purpose/Reason**
- Select the most accurate option from dropdowns
- Use "Other" only when necessary

### **4. Record Immediately**
- Log transactions as they happen
- Don't wait until end of day/week

### **5. Check Balance Before Stock Out/Spoilage**
- Always verify available quantity
- System prevents over-usage but check first

### **6. Review Logs Regularly**
- Use Logs tab to audit transactions
- Catch errors early
- Identify usage patterns

---

## 🎯 Key Features

### **1. Real-Time Balance Calculation**
- Automatically calculates: Total In - Used - Spoiled = Balance
- Updates instantly after each transaction
- No manual calculation needed

### **2. Validation**
- Prevents negative stock (can't remove more than available)
- Requires mandatory fields
- Shows clear error messages

### **3. Audit Trail**
- Every transaction is logged
- Includes date, quantity, and reason
- Cannot be deleted (immutable log)

### **4. User-Friendly**
- Simple, clean interface
- Clear labels and placeholders
- Helpful hints (e.g., "Available: X kg")

### **5. Dark Mode Support**
- Works in both light and dark themes
- Consistent with rest of ERP

---

## 🚨 Common Errors & Solutions

### **Error: "Please fill in required fields"**
- **Cause**: Quantity or Date is empty
- **Solution**: Fill in both Quantity and Date fields

### **Error: "Quantity must be greater than 0"**
- **Cause**: Entered 0 or negative number
- **Solution**: Enter a positive number (e.g., 5.5)

### **Error: "Insufficient stock. Available: X kg"**
- **Cause**: Trying to remove more than available
- **Solution**: Check balance and enter a smaller quantity

### **Error: "Failed to add/remove stock"**
- **Cause**: Server error or network issue
- **Solution**: Check internet connection, try again, or contact support

---

## 📈 Benefits

### **For Warehouse Managers**
- ✅ Real-time stock visibility
- ✅ Easy stock adjustments
- ✅ Spoilage tracking for loss prevention

### **For Production Teams**
- ✅ Quick stock usage recording
- ✅ Prevents over-usage
- ✅ Links usage to production orders

### **For Auditors**
- ✅ Complete transaction history
- ✅ Immutable audit trail
- ✅ Detailed reasons for all movements

### **For Management**
- ✅ Accurate inventory data
- ✅ Loss tracking (spoilage)
- ✅ Usage pattern analysis

---

## 🎓 Summary

The Stock Management Modal is a **simple, powerful tool** for managing inventory movements. It:

1. **Tracks** all stock in, out, and spoilage
2. **Calculates** balance automatically
3. **Validates** to prevent errors
4. **Logs** every transaction for audit
5. **Provides** clear, actionable data

**Use it daily** to maintain accurate inventory records and make informed decisions about stock levels, reordering, and production planning.

---

**Last Updated**: 2025-11-24
**Version**: 2.0 (Simplified)
**Status**: Production Ready ✅
