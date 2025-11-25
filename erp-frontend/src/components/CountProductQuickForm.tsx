import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import {
    CountProduct,
    CreateCountProductRequest,
    createCountProduct,
    updateCountProduct,
} from "../api/countProductApi";
import { getAllDyeingFirms, type DyeingFirm } from "../api/dyeingFirmApi";
import { getAllPartyNames } from "../api/partyApi";
import { Button } from "./ui/Button";

interface CountProductQuickFormProps {
    onSuccess: (product: CountProduct) => void;
    onCancel: () => void;
    editMode?: boolean;
    productToEdit?: CountProduct | null;
}

interface FormState {
    customerName: string;
    partyName: string;
    middleman: string;
    dyeingFirm: string;
    yarnType: string;
    count: string;
    shade: string;
    quantity: string;
    qualityGrade: "A" | "B" | "C";
    sentQuantity: string;
    receivedQuantity: string;
    dispatchQuantity: string;
    completedDate: string;
    sentDate: string;
    receivedDate: string;
    dispatchDate: string;
    lotNumber: string;
    remarks: string;
}

const todayIso = () => new Date().toISOString().split("T")[0];
const defaultLotNumber = () => `CP-${Date.now()}`;

const emptyForm: FormState = {
    customerName: "",
    partyName: "",
    middleman: "",
    dyeingFirm: "",
    yarnType: "Mixed",
    count: "",
    shade: "Natural",
    quantity: "",
    qualityGrade: "A",
    sentQuantity: "",
    receivedQuantity: "",
    dispatchQuantity: "",
    completedDate: todayIso(),
    sentDate: todayIso(),
    receivedDate: "",
    dispatchDate: "",
    lotNumber: defaultLotNumber(),
    remarks: "",
};

const numberFromInput = (value: string): number => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePartyNames = (rawParties: unknown[]): string[] => {
    const names = rawParties
        .map((entry) => {
            if (typeof entry === "string") {
                return entry.trim();
            }
            if (entry && typeof entry === "object") {
                const possible = (entry as Record<string, unknown>);
                if (typeof possible.name === "string") {
                    return possible.name.trim();
                }
                if (typeof possible.partyName === "string") {
                    return possible.partyName.trim();
                }
            }
            return null;
        })
        .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
};

export const CountProductQuickForm: React.FC<CountProductQuickFormProps> = ({
    onSuccess,
    onCancel,
    editMode = false,
    productToEdit,
}) => {
    const [formState, setFormState] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<keyof FormState, string | undefined>>({} as Record<keyof FormState, string | undefined>);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [partyOptions, setPartyOptions] = useState<string[]>([]);
    const [firmOptions, setFirmOptions] = useState<string[]>([]);

    useEffect(() => {
        const syncFirms = async () => {
            try {
                const firms = await getAllDyeingFirms();
                if (Array.isArray(firms)) {
                    setFirmOptions(
                        firms
                            .filter((firm: DyeingFirm) => Boolean(firm?.name))
                            .map((firm: DyeingFirm) => firm.name)
                            .sort((a, b) => a.localeCompare(b))
                    );
                }
            } catch (error) {
                console.error("Failed to fetch dyeing firms:", error);
            }
        };

        const syncParties = async () => {
            try {
                const parties = await getAllPartyNames();
                if (Array.isArray(parties)) {
                    setPartyOptions(normalizePartyNames(parties));
                }
            } catch (error) {
                console.error("Failed to fetch party names:", error);
            }
        };

        syncFirms();
        syncParties();
    }, []);

    useEffect(() => {
        if (!editMode || !productToEdit) {
            setFormState({
                ...emptyForm,
                lotNumber: defaultLotNumber(),
            });
            setErrors({} as Record<keyof FormState, string | undefined>);
            return;
        }

        setFormState({
            customerName: productToEdit.customerName || "",
            partyName: productToEdit.partyName || "",
            middleman: productToEdit.middleman || productToEdit.partyName || "",
            dyeingFirm: productToEdit.dyeingFirm || "",
            yarnType: productToEdit.yarnType || "Mixed",
            count: productToEdit.count || "",
            shade: productToEdit.shade || "Natural",
            quantity: productToEdit.quantity ? productToEdit.quantity.toString() : "",
            qualityGrade: productToEdit.qualityGrade || "A",
            sentQuantity: productToEdit.sentQuantity ? productToEdit.sentQuantity.toString() : "",
            receivedQuantity: productToEdit.receivedQuantity ? productToEdit.receivedQuantity.toString() : "",
            dispatchQuantity: productToEdit.dispatchQuantity ? productToEdit.dispatchQuantity.toString() : "",
            completedDate: productToEdit.completedDate || todayIso(),
            sentDate: productToEdit.sentDate || productToEdit.completedDate || todayIso(),
            receivedDate: productToEdit.receivedDate || "",
            dispatchDate: productToEdit.dispatchDate || "",
            lotNumber: productToEdit.lotNumber || defaultLotNumber(),
            remarks: productToEdit.remarks || "",
        });
        setErrors({} as Record<keyof FormState, string | undefined>);
    }, [editMode, productToEdit]);

    const handleChange = (
        field: keyof FormState,
        value: string,
    ) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const nextErrors: Record<keyof FormState, string | undefined> = {} as Record<keyof FormState, string | undefined>;

        if (!formState.customerName.trim()) {
            nextErrors.customerName = "Customer name is required";
        }
        if (!formState.count.trim()) {
            nextErrors.count = "Count is required";
        }
        if (!formState.dyeingFirm.trim()) {
            nextErrors.dyeingFirm = "Dyeing firm is required";
        }
        if (!formState.quantity.trim() || numberFromInput(formState.quantity) <= 0) {
            nextErrors.quantity = "Quantity must be greater than 0";
        }
        if (!formState.completedDate) {
            nextErrors.completedDate = "Completion date is required";
        }
        if (!formState.sentDate) {
            nextErrors.sentDate = "Sent date is required";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const resolvedSent = () => {
        if (!formState.sentQuantity.trim()) {
            return numberFromInput(formState.quantity);
        }
        return numberFromInput(formState.sentQuantity);
    };

    const buildPayload = (): CreateCountProductRequest => {
        const quantity = numberFromInput(formState.quantity);
        const sent = resolvedSent();
        const received = numberFromInput(formState.receivedQuantity);
        const dispatch = numberFromInput(formState.dispatchQuantity);

        return {
            partyName: formState.partyName.trim() || "Direct",
            dyeingFirm: formState.dyeingFirm.trim(),
            yarnType: formState.yarnType.trim() || "Mixed",
            count: formState.count.trim(),
            shade: formState.shade.trim() || "Natural",
            quantity,
            completedDate: formState.completedDate,
            qualityGrade: formState.qualityGrade,
            remarks: formState.remarks.trim() || undefined,
            lotNumber: formState.lotNumber.trim() || defaultLotNumber(),
            processedBy: "System",
            customerName: formState.customerName.trim(),
            sentToDye: sent > 0,
            sentDate: formState.sentDate || formState.completedDate,
            received: received > 0,
            receivedDate: formState.receivedDate || undefined,
            receivedQuantity: received,
            dispatch: dispatch > 0,
            dispatchDate: formState.dispatchDate || undefined,
            dispatchQuantity: dispatch,
            middleman: formState.middleman.trim() || formState.partyName.trim() || "Direct",
        };
    };

    const enrichProduct = (product: CountProduct): CountProduct => ({
        ...product,
        sentQuantity: resolvedSent() || product.sentQuantity || 0,
        receivedQuantity: numberFromInput(formState.receivedQuantity) || product.receivedQuantity || 0,
        dispatchQuantity: numberFromInput(formState.dispatchQuantity) || product.dispatchQuantity || 0,
    });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) {
            toast.error("Please fix the highlighted errors");
            return;
        }

        const payload = buildPayload();
        setIsSubmitting(true);

        try {
            if (editMode && productToEdit) {
                const updated = await updateCountProduct(productToEdit.id, payload);
                toast.success("Count product updated successfully");
                onSuccess(enrichProduct(updated));
            } else {
                const created = await createCountProduct(payload);
                toast.success("Count product added successfully");
                onSuccess(enrichProduct(created));
                setFormState({
                    ...emptyForm,
                    lotNumber: defaultLotNumber(),
                });
            }
        } catch (error) {
            console.error("Failed to submit count product:", error);
            toast.error("Failed to save count product. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const quantitySummary = useMemo(() => {
        const quantity = numberFromInput(formState.quantity);
        const sent = resolvedSent();
        const received = numberFromInput(formState.receivedQuantity);
        const dispatch = numberFromInput(formState.dispatchQuantity);
        return {
            quantity,
            sent,
            received,
            dispatch,
        };
    }, [formState.quantity, formState.sentQuantity, formState.receivedQuantity, formState.dispatchQuantity]);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {editMode ? "Edit Count Product" : "Add Count Product"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Match inventory styling for quick data entry
                    </p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div>Total: {quantitySummary.quantity.toFixed(2)} kg</div>
                    <div>Sent: {quantitySummary.sent.toFixed(2)} kg</div>
                    <div>Received: {quantitySummary.received.toFixed(2)} kg</div>
                    <div>Dispatch: {quantitySummary.dispatch.toFixed(2)} kg</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                <section>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-base">📋</span>
                        Basic Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                value={formState.customerName}
                                onChange={(event) => handleChange("customerName", event.target.value)}
                                placeholder="Customer"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.customerName ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.customerName && (
                                <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Party / Middleman
                            </label>
                            <input
                                type="text"
                                value={formState.partyName}
                                onChange={(event) => {
                                    handleChange("partyName", event.target.value);
                                    handleChange("middleman", event.target.value);
                                }}
                                list="party-suggestions"
                                placeholder="Type or select party"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                            <datalist id="party-suggestions">
                                {partyOptions.map((party) => (
                                    <option key={party} value={party} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Dyeing Firm *
                            </label>
                            <input
                                type="text"
                                value={formState.dyeingFirm}
                                onChange={(event) => handleChange("dyeingFirm", event.target.value)}
                                list="firm-suggestions"
                                placeholder="Type or select firm"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.dyeingFirm ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            <datalist id="firm-suggestions">
                                {firmOptions.map((firm) => (
                                    <option key={firm} value={firm} />
                                ))}
                            </datalist>
                            {errors.dyeingFirm && (
                                <p className="text-xs text-red-500 mt-1">{errors.dyeingFirm}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Quality Grade
                            </label>
                            <select
                                value={formState.qualityGrade}
                                onChange={(event) => handleChange("qualityGrade", event.target.value as FormState["qualityGrade"]) }
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="A">Grade A</option>
                                <option value="B">Grade B</option>
                                <option value="C">Grade C</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-base">🧵</span>
                        Material Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Count *
                            </label>
                            <input
                                type="text"
                                value={formState.count}
                                onChange={(event) => handleChange("count", event.target.value)}
                                placeholder="e.g. 2/40"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.count ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.count && (
                                <p className="text-xs text-red-500 mt-1">{errors.count}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Yarn Type
                            </label>
                            <input
                                type="text"
                                value={formState.yarnType}
                                onChange={(event) => handleChange("yarnType", event.target.value)}
                                placeholder="Mixed"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Shade
                            </label>
                            <input
                                type="text"
                                value={formState.shade}
                                onChange={(event) => handleChange("shade", event.target.value)}
                                placeholder="Natural"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-base">⚖️</span>
                        Quantities
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Total Quantity (kg) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formState.quantity}
                                onChange={(event) => handleChange("quantity", event.target.value)}
                                placeholder="0.00"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.quantity ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.quantity && (
                                <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Sent (kg)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formState.sentQuantity}
                                onChange={(event) => handleChange("sentQuantity", event.target.value)}
                                placeholder="Auto uses total"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Received (kg)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formState.receivedQuantity}
                                onChange={(event) => handleChange("receivedQuantity", event.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Dispatch (kg)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formState.dispatchQuantity}
                                onChange={(event) => handleChange("dispatchQuantity", event.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-base">📅</span>
                        Tracking Dates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Completed Date *
                            </label>
                            <input
                                type="date"
                                value={formState.completedDate}
                                onChange={(event) => handleChange("completedDate", event.target.value)}
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.completedDate ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.completedDate && (
                                <p className="text-xs text-red-500 mt-1">{errors.completedDate}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Sent Date *
                            </label>
                            <input
                                type="date"
                                value={formState.sentDate}
                                onChange={(event) => handleChange("sentDate", event.target.value)}
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.sentDate ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.sentDate && (
                                <p className="text-xs text-red-500 mt-1">{errors.sentDate}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Received Date
                            </label>
                            <input
                                type="date"
                                value={formState.receivedDate}
                                onChange={(event) => handleChange("receivedDate", event.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Dispatch Date
                            </label>
                            <input
                                type="date"
                                value={formState.dispatchDate}
                                onChange={(event) => handleChange("dispatchDate", event.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-base">🗒️</span>
                        Additional Info
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Lot Number
                            </label>
                            <input
                                type="text"
                                value={formState.lotNumber}
                                onChange={(event) => handleChange("lotNumber", event.target.value)}
                                placeholder="Auto generated"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Remarks
                            </label>
                            <textarea
                                value={formState.remarks}
                                onChange={(event) => handleChange("remarks", event.target.value)}
                                rows={3}
                                placeholder="Any notes about this product"
                                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
                            />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setFormState({
                                ...emptyForm,
                                lotNumber: defaultLotNumber(),
                            });
                            setErrors({} as Record<keyof FormState, string | undefined>);
                        }}
                        disabled={isSubmitting}
                        className="px-6"
                    >
                        Reset
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-6"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                {editMode ? "Saving..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                {editMode ? "Update Product" : "Add Product"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CountProductQuickForm;
