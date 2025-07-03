import React, { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

const AddPartyForm: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [partyName, setPartyName] = useState('');
  const [dyeingFirm, setDyeingFirm] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      toast.error('Party name is required');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/parties', {
        name: partyName.trim(),
        dyeingFirm: dyeingFirm.trim() || undefined,
        address: address.trim() || undefined,
        contact: contact.trim() || undefined,
      });

      toast.success('Party added successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding party:', err);
      toast.error('Failed to add party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white shadow-lg dark:bg-gray-900 rounded-xl">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Add New Party</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Party Name *</label>
          <input
            type="text"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter party name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dyeing Firm (Optional)</label>
          <input
            type="text"
            value={dyeingFirm}
            onChange={(e) => setDyeingFirm(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter dyeing firm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact (Optional)</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter contact info"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPartyForm;
