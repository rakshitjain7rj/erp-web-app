import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
    createCountProduct,
    CreateCountProductRequest
} from "../api/countProductApi";
import { getAllPartyNames } from "../api/partyApi";

interface AddDyeingOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newProduct: any) => void;
    currentFirm: string;
}

interface FormData {
    quantity: number;
    customerName: string;
    sentToDye: number;
    sentDate: string;
    received: number;
    receivedDate: string;
    dispatch: number;
    dispatchDate: string;
    partyName: string;
    isReprocessing: boolean;
}

interface FormErrors {
    [key: string]: string;
}

export const AddDyeingOrderModal: React.FC<AddDyeingOrderModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    currentFirm
}) => {
    const [formData, setFormData] = useState<FormData>({
        quantity: 0,
        customerName: "",
        sentToDye: 0,
        sentDate: new Date().toISOString().split('T')[0],
        received: 0,
        receivedDate: "",
        dispatch: 0,
        dispatchDate: "",
        partyName: "",
        isReprocessing: false
    });

    const [partyOptions, setPartyOptions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Fetch party options from API
    useEffect(() => {
        const fetchPartyOptions = async () => {
            try {
                const partyNames = await getAllPartyNames();
                if (Array.isArray(partyNames)) {
                    const validPartyNames = partyNames
                        .map((party: any) => {
                            if (typeof party === 'string') return party;
                            if (party && typeof party.name === 'string') return party.name;
                            if (party && typeof party.partyName === 'string') return party.partyName;
                            return null;
                        })
                        .filter((name): name is string => !!name);
                    setPartyOptions(validPartyNames);
                }
            } catch (error) {
                console.error("Failed to fetch party options:", error);
            }
        };
        if (isOpen) {
            fetchPartyOptions();
        }
    }, [isOpen]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                quantity: 0,
                customerName: "",
                sentToDye: 0,
                sentDate: new Date().toISOString().split('T')[0],
                received: 0,
                receivedDate: "",
                dispatch: 0,
                dispatchDate: "",
                partyName: "",
                isReprocessing: false
            });
            setErrors({});
        }
    }, [isOpen]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.quantity || formData.quantity <= 0) {
            newErrors.quantity = "Quantity is required and must be greater than 0";
        }
        if (!formData.customerName.trim()) {
            newErrors.customerName = "Customer name is required";
        }
        if (!formData.sentToDye || formData.sentToDye <= 0) {
            newErrors.sentToDye = "Sent to dye quantity is required and must be greater than 0";
        }
        if (!formData.sentDate) {
            newErrors.sentDate = "Sent date is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (field: keyof FormData, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Please fix validation errors");
            return;
        }

        setIsSubmitting(true);
        try {
            const newCountProductData: CreateCountProductRequest = {
                partyName: formData.partyName || "Direct",
                dyeingFirm: currentFirm,
                yarnType: "Mixed", // Default value
                count: "Standard", // Default value
                shade: "As Required", // Default value
                quantity: formData.quantity,
                completedDate: new Date().toISOString().split('T')[0],
                qualityGrade: "A", // Default grade
                remarks: `Added via modal - Customer: ${formData.customerName}`,
                lotNumber: `MOD-${Date.now()}`, // Generate lot number
                processedBy: "System",
                customerName: formData.customerName,
                sentToDye: true,
                sentDate: formData.sentDate,
                received: formData.received > 0,
                receivedDate: formData.receivedDate || undefined,
                receivedQuantity: formData.received,
                dispatch: formData.dispatch > 0,
                dispatchDate: formData.dispatchDate || undefined,
                dispatchQuantity: formData.dispatch,
                middleman: formData.partyName || "Direct",
                isReprocessing: formData.isReprocessing
            };

            const createdProduct = await createCountProduct(newCountProductData);
            onSuccess(createdProduct);
            toast.success("Dyeing order added successfully!");
            onClose();
        } catch (error) {
            console.error("Failed to create dyeing order:", error);
            toast.error("Failed to add dyeing order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Add New Dyeing Order
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Row 1: Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Quantity (kg) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                                className={`w-full border px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="0.00"
                            />
                            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                value={formData.customerName}
                                onChange={(e) => handleInputChange('customerName', e.target.value)}
                                className={`w-full border px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.customerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="Enter customer name"
                            />
                            {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
                        </div>
                    </div>

                    {/* Row 2: Sent Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sent to Dye (kg) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.sentToDye}
                                onChange={(e) => handleInputChange('sentToDye', parseFloat(e.target.value) || 0)}
                                className={`w-full border px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.sentToDye ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="0.00"
                            />
                            {errors.sentToDye && <p className="text-xs text-red-500 mt-1">{errors.sentToDye}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sent Date *
                            </label>
                            <input
                                type="date"
                                value={formData.sentDate}
                                onChange={(e) => handleInputChange('sentDate', e.target.value)}
                                className={`w-full border px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.sentDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.sentDate && <p className="text-xs text-red-500 mt-1">{errors.sentDate}</p>}
                        </div>
                    </div>

                    {/* Row 3: Received Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Received (kg)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.received}
                                onChange={(e) => handleInputChange('received', parseFloat(e.target.value) || 0)}
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Received Date
                            </label>
                            <input
                                type="date"
                                value={formData.receivedDate}
                                onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 4: Dispatch Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dispatch (kg)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.dispatch}
                                onChange={(e) => handleInputChange('dispatch', parseFloat(e.target.value) || 0)}
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dispatch Date
                            </label>
                            <input
                                type="date"
                                value={formData.dispatchDate}
                                onChange={(e) => handleInputChange('dispatchDate', e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 5: Party */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Party / Middleman
                        </label>
                        <select
                            value={formData.partyName}
                            onChange={(e) => handleInputChange('partyName', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">Select party or leave blank for Direct</option>
                            {partyOptions.map((party, index) => (
                                <option key={index} value={party}>
                                    {party}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Row 6: Reprocessing */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isReprocessing"
                            checked={formData.isReprocessing}
                            onChange={(e) => setFormData(prev => ({ ...prev, isReprocessing: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="isReprocessing" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            Mark as Reprocessing
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Adding..." : "Add Item"}
                    </button>
                </div>
            </div>
        </div>
    );
};
