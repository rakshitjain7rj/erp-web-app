// erp-frontend/src/components/PartySummary.tsx

import { useEffect, useState } from 'react';
import axios from 'axios';

type PartySummary = {
  partyName: string;
  totalOrders: number;
  totalYarn: number;
  pendingYarn: number;
  reprocessingYarn: number;
  arrivedYarn: number;
};

const PartySummary = () => {
  const [summary, setSummary] = useState<PartySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('/api/dyeing/summary-by-party');
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching party summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-semibold">Party-wise Dyeing Summary</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full text-sm text-gray-800 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Party Name</th>
                <th className="px-4 py-2 text-center">Total Orders</th>
                <th className="px-4 py-2 text-center">Total Yarn</th>
                <th className="px-4 py-2 text-center">Pending</th>
                <th className="px-4 py-2 text-center">Reprocessing</th>
                <th className="px-4 py-2 text-center">Arrived</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((party) => (
                <tr key={party.partyName} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{party.partyName}</td>
                  <td className="px-4 py-2 text-center">{party.totalOrders}</td>
                  <td className="px-4 py-2 text-center">{party.totalYarn}</td>
                  <td className="px-4 py-2 text-center text-yellow-600">{party.pendingYarn}</td>
                  <td className="px-4 py-2 text-center text-orange-500">{party.reprocessingYarn}</td>
                  <td className="px-4 py-2 text-center text-green-600">{party.arrivedYarn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartySummary;
