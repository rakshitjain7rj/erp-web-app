import { useEffect, useState } from "react";

interface InventoryLog {
  id: string;
  productName: string;
  changedBy: string;
  changeType: string;
  changeDescription: string;
  timestamp: string;
}

interface Props {
  onClose: () => void;
}

const InventoryLogs: React.FC<Props> = ({ onClose }) => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    fetch("/api/inventory/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch(() => {
        console.error("Failed to fetch audit logs");
      });
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.productName.toLowerCase().includes(searchProduct.toLowerCase()) &&
    log.changedBy.toLowerCase().includes(searchUser.toLowerCase()) &&
    (searchDate ? log.timestamp.slice(0, 10) === searchDate : true)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-600 dark:text-gray-300 hover:text-red-500 text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-white">
          🧾 Inventory Audit Logs
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="🔍 Product Name"
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <input
            type="text"
            placeholder="👤 Changed By"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
          />
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[60vh] rounded border">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Changed By</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="px-4 py-2">{log.productName}</td>
                    <td className="px-4 py-2">{log.changedBy}</td>
                    <td className="px-4 py-2">{log.changeType}</td>
                    <td className="px-4 py-2">{log.changeDescription}</td>
                    <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No matching logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryLogs;
