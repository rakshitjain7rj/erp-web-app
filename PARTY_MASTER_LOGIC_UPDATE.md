# Party Master Logic Update

## Changes Implemented
1.  **Received Quantity Parsing**:
    - Ported `parseTrackingInfo` logic from `DyeingOrders.tsx` to `PartyDashboard.tsx`.
    - Uses regex `/Received: ([\d.]+)kg/g` to extract received quantities from remarks.
    - Takes the *last* match if multiple exist (consistent with Dyeing Orders).
    - Added fallback for simpler formats.

2.  **Status Calculation**:
    - **Pending**: Sum of `(Sent - Received)` for records that are NOT marked as `Arrived` (Completed) and NOT `Reprocessing`.
    - **Reprocess**: Sum of `(Sent - Received)` for records marked as `isReprocessing`.
    - **Completed**: Sum of `Received` quantity (parsed from remarks) across ALL records.

## Logic Details
- `Sent` = `record.quantity`
- `Received` = Parsed from `record.remarks`
- `Remaining` = `Max(0, Sent - Received)`

| Condition | Pending | Reprocess | Completed |
| :--- | :--- | :--- | :--- |
| `isReprocessing = true` | 0 | `Remaining` | `Received` |
| `arrivalDate` exists (Arrived) | 0 | 0 | `Received` |
| Default (Pending) | `Remaining` | 0 | `Received` |

This ensures that the "Pending" column accurately reflects the "Sent - Received" quantity for active orders, matching the user's request to wire it up like the Dyeing Orders page.
