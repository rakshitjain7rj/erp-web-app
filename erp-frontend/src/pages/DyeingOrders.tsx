import { useEffect, useState } from "react";
import { isOverdue } from "../lib/utils";
import { DyeingOrder, FollowUp } from "../types/dyeing";
import { v4 as uuidv4 } from "uuid";

import { Button } from "../components/ui/Button";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateOrderStatus } from "../api/dyeingApi";
import { useAuth } from "../context/AuthContext";

const DyeingOrders = () => {
  const [orders, setOrders] = useState<DyeingOrder[]>([]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [activeFollowUpOrder, setActiveFollowUpOrder] = useState<DyeingOrder | null>(null);
  const [newNote, setNewNote] = useState("");
  const { user } = useAuth();
  const role = user?.role || "storekeeper";

  useEffect(() => {
    const mockData: DyeingOrder[] = [
      {
        id: "1",
        name: "Cotton Yarn",
        quantity: 50,
        sentDate: "2025-06-14",
        expectedArrival: "2025-06-15",
        status: "Pending",
        followUps: [],
      },
      {
        id: "2",
        name: "Wool Yarn",
        quantity: 30,
        sentDate: "2025-06-01",
        expectedArrival: "2025-06-10",
        status: "Overdue",
        followUps: [],
      },
    ];
    setOrders(mockData);
  }, []);

  const handleMarkAsArrived = async (id: string) => {
    try {
      await updateOrderStatus(id, "Arrived");
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: "Arrived" } : order
        )
      );
      toast.success("Yarn marked as arrived.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleAddFollowUp = () => {
    if (!activeFollowUpOrder || !newNote.trim()) return;

    const now = new Date();
    const newFollowUp: FollowUp = {
      id: uuidv4(),
      date: format(now, "yyyy-MM-dd"),
      time: format(now, "HH:mm"),
      notes: newNote.trim(),
    };

    const updatedOrders = orders.map((order) =>
      order.id === activeFollowUpOrder.id
        ? {
            ...order,
            followUps: [...(order.followUps || []), newFollowUp],
          }
        : order
    );

    setOrders(updatedOrders);
    toast.success("Follow-up added.");
    setActiveFollowUpOrder(null);
    setNewNote("");
  };

  const filteredOrders = showOverdueOnly
    ? orders.filter((order) => isOverdue(order.expectedArrival))
    : orders;

  const canUpdateStatus = role === "admin" || role === "manager";
  const canAddFollowUp = role === "admin" || role === "manager";

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-blue-700">Dyeing Orders</h1>
        <Button
          variant={showOverdueOnly ? "default" : "outline"}
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
        >
          {showOverdueOnly ? "Show All" : "Show Overdue Only"}
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="p-3">Yarn</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Sent Date</th>
              <th className="p-3">Expected Arrival</th>
              <th className="p-3">Status</th>
              {canUpdateStatus || canAddFollowUp ? <th className="p-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const overdue = isOverdue(order.expectedArrival);
              return (
                <tr
                  key={order.id}
                  className={overdue ? "bg-red-50 text-red-700 font-medium" : ""}
                >
                  <td className="p-3">{order.name}</td>
                  <td className="p-3">{order.quantity}</td>
                  <td className="p-3">{format(new Date(order.sentDate), "yyyy-MM-dd")}</td>
                  <td className="p-3">{format(new Date(order.expectedArrival), "yyyy-MM-dd")}</td>
                  <td className="p-3">
                    {order.status === "Arrived"
                      ? "Arrived"
                      : overdue
                      ? "Overdue"
                      : order.status}
                  </td>
                  {(canUpdateStatus || canAddFollowUp) && (
                    <td className="p-3 space-x-2">
                      {canUpdateStatus && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={order.status === "Arrived"}
                          onClick={() => handleMarkAsArrived(order.id)}
                        >
                          Mark as Arrived
                        </Button>
                      )}
                      {canAddFollowUp && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveFollowUpOrder(order)}
                        >
                          Add Follow-up
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-4 text-gray-500 text-sm text-center">
            No {showOverdueOnly ? "overdue" : "dyeing"} orders.
          </div>
        )}
      </div>

      {activeFollowUpOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-2">
              Add Follow-up for {activeFollowUpOrder.name}
            </h2>
            <textarea
              className="w-full h-24 p-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter follow-up notes..."
            />
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => setActiveFollowUpOrder(null)}>
                Cancel
              </Button>
              <Button onClick={handleAddFollowUp}>Save Follow-up</Button>
            </div>

            {activeFollowUpOrder.followUps?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-sm mb-1">Previous Follow-Ups:</h3>
                <ul className="space-y-1 text-sm">
                  {activeFollowUpOrder.followUps.map((fup) => (
                    <li key={fup.id} className="text-gray-700 dark:text-gray-300 border-l-2 pl-2 border-blue-500">
                      <span className="font-medium">{fup.date} {fup.time}:</span> {fup.notes}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DyeingOrders;
