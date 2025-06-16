// src/components/YarnEntryModal.tsx
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "../components/ui/Button"; // Adjust path accordingly

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (yarn: {
    name: string;
    quantity: number;
    sentDate: string;
    expectedArrival: string;
  }) => void;
};

const YarnEntryModal = ({ isOpen, onClose, onSave }: Props) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [sentDate, setSentDate] = useState("");
  const [expectedArrival, setExpectedArrival] = useState("");

  const handleSubmit = () => {
    if (!name || quantity <= 0 || !sentDate || !expectedArrival) return;
    onSave({ name, quantity, sentDate, expectedArrival });
    onClose();
    setName("");
    setQuantity(0);
    setSentDate("");
    setExpectedArrival("");
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
          <Dialog.Title className="text-lg font-semibold text-gray-800">
            Add Yarn Dyeing Entry
          </Dialog.Title>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Yarn Name</label>
              <input
                type="text"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Sent for Dyeing</label>
              <input
                type="date"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={sentDate}
                onChange={(e) => setSentDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Expected Arrival</label>
              <input
                type="date"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={expectedArrival}
                onChange={(e) => setExpectedArrival(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default YarnEntryModal;
