import React, { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { createDyeingRecord, updateDyeingRecord } from "../api/dyeingApi";
import { CreateDyeingRecordRequest, DyeingRecord } from "../types/dyeing";
import { Button } from "./ui/Button";
import { X } from "lucide-react";

interface CreateDyeingOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: DyeingRecord) => void;
  recordToEdit?: DyeingRecord | null;
}

const CreateDyeingOrderForm: React.FC<CreateDyeingOrderFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  recordToEdit,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultExpectedDate = format(addDays(new Date(), 7), "yyyy-MM-dd");  const initialState: CreateDyeingRecordRequest = {
    yarnType: "",
    sentDate: today,
    expectedArrivalDate: defaultExpectedDate,
    remarks: "",
    partyName: "",
    quantity: 0,
    shade: "",
    count: "",
    lot: "",
    dyeingFirm: "",
  };

  const [formData, setFormData] = useState<CreateDyeingRecordRequest>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateDyeingRecordRequest>>({});  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        yarnType: recordToEdit.yarnType || "",
        sentDate: format(new Date(recordToEdit.sentDate), "yyyy-MM-dd"),
        expectedArrivalDate: format(new Date(recordToEdit.expectedArrivalDate), "yyyy-MM-dd"),
        remarks: recordToEdit.remarks || "",
        partyName: recordToEdit.partyName || "",
        quantity: recordToEdit.quantity || 0,
        shade: recordToEdit.shade || "",
        count: recordToEdit.count || "",
        lot: recordToEdit.lot || "",
        dyeingFirm: recordToEdit.dyeingFirm || "",
      });
    } else {
      setFormData({
        yarnType: "",
        sentDate: today,
        expectedArrivalDate: defaultExpectedDate,
        remarks: "",
        partyName: "",
        quantity: 0,
        shade: "",
        count: "",
        lot: "",
        dyeingFirm: "",
      });
    }
  }, [recordToEdit, isOpen, today, defaultExpectedDate]);  const validateForm = (): boolean => {
    const newErrors: Partial<CreateDyeingRecordRequest> = {};
    const sentDate = new Date(formData.sentDate);
    const expectedDate = new Date(formData.expectedArrivalDate);

    if (!formData.yarnType.trim()) newErrors.yarnType = "Yarn type is required";
    if (!formData.partyName.trim()) newErrors.partyName = "Party name is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0" as any;
    if (!formData.shade.trim()) newErrors.shade = "Shade is required";
    if (!formData.count.trim()) newErrors.count = "Count is required";
    if (!formData.lot.trim()) newErrors.lot = "Lot is required";
    if (!formData.dyeingFirm.trim()) newErrors.dyeingFirm = "Dyeing firm is required";
    if (!formData.sentDate) newErrors.sentDate = "Sent date is required";
    else if (sentDate > new Date()) newErrors.sentDate = "Sent date cannot be in the future";
    if (!formData.expectedArrivalDate) newErrors.expectedArrivalDate = "Expected arrival date is required";
    else if (expectedDate <= sentDate) newErrors.expectedArrivalDate = "Must be after sent date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Please fix the errors");

    setIsSubmitting(true);
    try {
      let result: DyeingRecord;
      if (recordToEdit?.id) {
        result = await updateDyeingRecord(recordToEdit.id, formData);
        toast.success("Dyeing order updated!");
      } else {
        result = await createDyeingRecord(formData);
        toast.success("Dyeing order created!");
      }
      onSuccess(result);
      handleClose();    } catch (error: unknown) {
      console.error("Save failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Operation failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };  const handleClose = () => {
    setFormData({
      yarnType: "",
      sentDate: today,
      expectedArrivalDate: defaultExpectedDate,
      remarks: "",
      partyName: "",
      quantity: 0,
      shade: "",
      count: "",
      lot: "",
      dyeingFirm: "",
    });
    setErrors({});
    onClose();
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle quantity as number
    if (name === "quantity") {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof CreateDyeingRecordRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === "sentDate" && value && !recordToEdit) {
      const sentDate = new Date(value);
      const suggested = format(addDays(sentDate, 7), "yyyy-MM-dd");
      setFormData(prev => ({
        ...prev,
        sentDate: value,
        expectedArrivalDate: suggested,
      }));
    }
  };

  if (!isOpen) return null;

  return (    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {recordToEdit ? "Edit Dyeing Order" : "Create New Dyeing Order"}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="partyName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                id="partyName"
                name="partyName"
                type="text"
                value={formData.partyName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.partyName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., ABC Textiles"
              />
              {errors.partyName && <p className="text-red-600 text-sm">{errors.partyName}</p>}
            </div>

            <div>
              <label htmlFor="yarnType" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Yarn Type <span className="text-red-500">*</span>
              </label>
              <input
                id="yarnType"
                name="yarnType"
                type="text"
                value={formData.yarnType}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.yarnType ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Cotton Yarn"
              />
              {errors.yarnType && <p className="text-red-600 text-sm">{errors.yarnType}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.quantity ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 100.5"
              />
              {errors.quantity && <p className="text-red-600 text-sm">{errors.quantity}</p>}
            </div>

            <div>
              <label htmlFor="shade" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Shade <span className="text-red-500">*</span>
              </label>
              <input
                id="shade"
                name="shade"
                type="text"
                value={formData.shade}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.shade ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Navy Blue"
              />
              {errors.shade && <p className="text-red-600 text-sm">{errors.shade}</p>}
            </div>

            <div>
              <label htmlFor="count" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Count <span className="text-red-500">*</span>
              </label>
              <input
                id="count"
                name="count"
                type="text"
                value={formData.count}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.count ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 30s"
              />
              {errors.count && <p className="text-red-600 text-sm">{errors.count}</p>}
            </div>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lot" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Lot <span className="text-red-500">*</span>
              </label>
              <input
                id="lot"
                name="lot"
                type="text"
                value={formData.lot}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.lot ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., LOT001"
              />
              {errors.lot && <p className="text-red-600 text-sm">{errors.lot}</p>}
            </div>

            <div>
              <label htmlFor="dyeingFirm" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Dyeing Firm <span className="text-red-500">*</span>
              </label>
              <input
                id="dyeingFirm"
                name="dyeingFirm"
                type="text"
                value={formData.dyeingFirm}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.dyeingFirm ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., XYZ Dyeing Co."
              />
              {errors.dyeingFirm && <p className="text-red-600 text-sm">{errors.dyeingFirm}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sentDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sent Date <span className="text-red-500">*</span>
              </label>
              <input
                id="sentDate"
                name="sentDate"
                type="date"
                value={formData.sentDate}
                max={today}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white ${
                  errors.sentDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.sentDate && <p className="text-red-600 text-sm">{errors.sentDate}</p>}
            </div>

            <div>
              <label htmlFor="expectedArrivalDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Expected Arrival Date <span className="text-red-500">*</span>
              </label>
              <input
                id="expectedArrivalDate"
                name="expectedArrivalDate"
                type="date"
                value={formData.expectedArrivalDate}
                min={formData.sentDate ? format(addDays(new Date(formData.sentDate), 1), "yyyy-MM-dd") : today}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white ${
                  errors.expectedArrivalDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.expectedArrivalDate && <p className="text-red-600 text-sm">{errors.expectedArrivalDate}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="remarks" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
              placeholder="Optional notes..."
            />
          </div>          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? recordToEdit
                  ? "Updating..."
                  : "Creating..."
                : recordToEdit
                ? "Update Order"
                : "Create Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDyeingOrderForm;
