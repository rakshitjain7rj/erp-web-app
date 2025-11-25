import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "./ui/Button";
import {
    createCountProduct,
    type CountProduct,
    type CreateCountProductRequest,
} from "../api/countProductApi";
import { updateDyeingRecord } from "../api/dyeingApi";
import { getAllDyeingFirms, type DyeingFirm } from "../api/dyeingFirmApi";
import { getAllPartyNames } from "../api/partyApi";
import { dyeingDataStore } from "../stores/dyeingDataStore";
import type { CreateDyeingRecordRequest } from "../types/dyeing";

interface EditableOrder {
    id?: number;
    quantity?: number;
    customerName?: string;
    sentToDye?: number;
    sentDate?: string;
    received?: number;
    receivedDate?: string;
    dispatch?: number;
    dispatchDate?: string;
    dyeingFirm?: string;
    partyName?: string;
    remarks?: string;
    yarnType?: string;
    shade?: string;
    count?: string;
    lot?: string;
    expectedArrivalDate?: string;
}

interface DyeingOrderQuickFormProps {
    onSuccess: (payload?: unknown) => void;
    onCancel: () => void;
    orderToEdit?: EditableOrder | null;
    existingFirms?: string[];
}

interface FormState {
    orderId?: number;
    customerName: string;
    partyName: string;
    dyeingFirm: string;
    yarnType: string;
    count: string;
    shade: string;
    quantity: string;
    sentQuantity: string;
    receivedQuantity: string;
    dispatchQuantity: string;
    sentDate: string;
    expectedArrivalDate: string;
    receivedDate: string;
    dispatchDate: string;
    lotNumber: string;
    remarks: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const todayIso = (): string => new Date().toISOString().split("T")[0];
const addDaysIso = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
};
const defaultLotNumber = (): string => `DO-${Date.now()}`;

const numberFromInput = (value: string): number => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePartyNames = (rawParties: unknown[]): string[] => {
    const names = rawParties
        .map((entry) => {
            if (typeof entry === "string") return entry.trim();
            if (entry && typeof entry === "object") {
                const record = entry as Record<string, unknown>;
                if (typeof record.name === "string") return record.name.trim();
                if (typeof record.partyName === "string") return record.partyName.trim();
            }
            return null;
        })
        .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
};

const stripTrackingSegments = (remarks?: string): string => {
    if (!remarks) return "";
    return remarks
        .split("|")
        .map((part) => part.trim())
        .filter((part) => part && !/^(OriginalQty|Received|Dispatched|Middleman):/i.test(part))
        .join(" | ");
};

const formatNumeric = (value: number): string => {
    if (!Number.isFinite(value)) return "0";
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const enrichCreatedProduct = (
    product: CountProduct,
    sent: number,
    received: number,
    dispatch: number,
): CountProduct => ({
    ...product,
    sentQuantity: sent,
    receivedQuantity: received,
    dispatchQuantity: dispatch,
});

const buildEmptyForm = (): FormState => ({
    orderId: undefined,
    customerName: "",
    partyName: "",
    dyeingFirm: "",
    yarnType: "Mixed",
    count: "",
    shade: "Natural",
    quantity: "",
    sentQuantity: "",
    receivedQuantity: "",
    dispatchQuantity: "",
    sentDate: todayIso(),
    expectedArrivalDate: addDaysIso(7),
    receivedDate: "",
    dispatchDate: "",
    lotNumber: defaultLotNumber(),
    remarks: "",
});

const mapOrderToForm = (order: EditableOrder): FormState => {
    const totalQuantity = order.quantity ?? 0;
    const sentQuantity = order.sentToDye ?? totalQuantity;

    return {
        orderId: order.id,
        customerName: order.customerName ?? "",
        partyName: order.partyName ?? "",
        dyeingFirm: order.dyeingFirm ?? "",
        yarnType: order.yarnType ?? "Mixed",
        count: order.count ?? "",
        shade: order.shade ?? "Natural",
        quantity: totalQuantity ? totalQuantity.toString() : "",
        sentQuantity: sentQuantity ? sentQuantity.toString() : "",
        receivedQuantity: order.received ? order.received.toString() : "",
        dispatchQuantity: order.dispatch ? order.dispatch.toString() : "",
        sentDate: order.sentDate ?? todayIso(),
        expectedArrivalDate: order.expectedArrivalDate ?? addDaysIso(7),
        receivedDate: order.receivedDate ?? "",
        dispatchDate: order.dispatchDate ?? "",
        lotNumber: order.lot ?? defaultLotNumber(),
        remarks: stripTrackingSegments(order.remarks),
    };
};

export const DyeingOrderQuickForm: React.FC<DyeingOrderQuickFormProps> = ({
    onSuccess,
    onCancel,
    orderToEdit,
    existingFirms = [],
}) => {
    const [formState, setFormState] = useState<FormState>(() => buildEmptyForm());
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [partyOptions, setPartyOptions] = useState<string[]>([]);
    const [firmOptions, setFirmOptions] = useState<string[]>(() =>
        Array.from(new Set(existingFirms)).sort((a, b) => a.localeCompare(b)),
    );

    useEffect(() => {
        if (!existingFirms.length) {
            const loadFirms = async () => {
                try {
                    const firms = await getAllDyeingFirms();
                    if (Array.isArray(firms)) {
                        setFirmOptions(
                            firms
                                .filter((firm: DyeingFirm) => Boolean(firm?.name))
                                .map((firm: DyeingFirm) => firm.name)
                                .sort((a, b) => a.localeCompare(b)),
                        );
                    }
                } catch (error) {
                    console.error("Failed to fetch dyeing firms:", error);
                }
            };
            loadFirms();
        } else {
            setFirmOptions(
                Array.from(new Set(existingFirms)).sort((a, b) => a.localeCompare(b)),
            );
        }
    }, [existingFirms]);

    useEffect(() => {
        const loadParties = async () => {
            try {
                const parties = await getAllPartyNames();
                if (Array.isArray(parties)) {
                    setPartyOptions(normalizePartyNames(parties));
                }
            } catch (error) {
                console.error("Failed to fetch party names:", error);
            }
        };
        loadParties();
    }, []);

    useEffect(() => {
        if (orderToEdit) {
            setFormState(mapOrderToForm(orderToEdit));
            setErrors({});

            if (orderToEdit.dyeingFirm) {
                setFirmOptions((prev) => {
                    if (prev.some((name) => name.toLowerCase() === orderToEdit.dyeingFirm!.toLowerCase())) {
                        return prev;
                    }
                    return [...prev, orderToEdit.dyeingFirm!].sort((a, b) => a.localeCompare(b));
                });
            }
        } else {
            setFormState(buildEmptyForm());
            setErrors({});
        }
    }, [orderToEdit]);

    const handleChange = (field: keyof FormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};
        const totalQuantity = numberFromInput(formState.quantity);
        const sentQuantity = formState.sentQuantity.trim()
            ? numberFromInput(formState.sentQuantity)
            : totalQuantity;

        if (!formState.customerName.trim()) {
            nextErrors.customerName = "Customer name is required";
        }
        if (!formState.partyName.trim()) {
            nextErrors.partyName = "Party / middleman is required";
        }
        if (!formState.dyeingFirm.trim()) {
            nextErrors.dyeingFirm = "Dyeing firm is required";
        }
        if (!formState.count.trim()) {
            nextErrors.count = "Count is required";
        }
        if (totalQuantity <= 0) {
            nextErrors.quantity = "Total quantity must be greater than 0";
        }
        if (sentQuantity <= 0) {
            nextErrors.sentQuantity = "Sent quantity must be greater than 0";
        }
        if (!formState.sentDate) {
            nextErrors.sentDate = "Sent date is required";
        }
        if (!formState.expectedArrivalDate) {
            nextErrors.expectedArrivalDate = "Expected arrival date is required";
        }

        setErrors(nextErrors);
        return !Object.values(nextErrors).some(Boolean);
    };

    const ensureFirmExists = async () => {
        const trimmedFirm = formState.dyeingFirm.trim();
        if (!trimmedFirm) return;
        if (firmOptions.some((name) => name.toLowerCase() === trimmedFirm.toLowerCase())) {
            return;
        }
        try {
            const ensured = await dyeingDataStore.ensureFirm(trimmedFirm);
            setFirmOptions((prev) =>
                Array.from(new Set([...prev, ensured.name])).sort((a, b) => a.localeCompare(b)),
            );
        } catch (error) {
            console.error("Failed to ensure firm exists:", error);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) {
            toast.error("Please fix the highlighted errors");
            return;
        }

        setIsSubmitting(true);

        const totalQuantity = numberFromInput(formState.quantity);
        const sentQuantity = formState.sentQuantity.trim()
            ? numberFromInput(formState.sentQuantity)
            : totalQuantity;
        const receivedQuantity = numberFromInput(formState.receivedQuantity);
        const dispatchQuantity = numberFromInput(formState.dispatchQuantity);

        const trimmedRemarks = formState.remarks.trim();
        const trimmedCustomer = formState.customerName.trim();
        const trimmedParty = formState.partyName.trim();
        const trimmedFirm = formState.dyeingFirm.trim();
        const trimmedYarn = formState.yarnType.trim() || "Mixed";
        const trimmedShade = formState.shade.trim() || "Natural";
        const trimmedCount = formState.count.trim();
        const lotNumber = formState.lotNumber.trim() || defaultLotNumber();
        const sentDate = formState.sentDate || todayIso();
        const expectedDate = formState.expectedArrivalDate || addDaysIso(7);

        const trackingSegments: string[] = [];
        if (totalQuantity > 0 && Math.abs(totalQuantity - sentQuantity) > 0.0001) {
            trackingSegments.push(`OriginalQty: ${formatNumeric(totalQuantity)}kg`);
        }
        trackingSegments.push(
            `Received: ${formatNumeric(receivedQuantity)}kg${formState.receivedDate ? ` on ${formState.receivedDate}` : ""}`,
        );
        trackingSegments.push(
            `Dispatched: ${formatNumeric(dispatchQuantity)}kg${formState.dispatchDate ? ` on ${formState.dispatchDate}` : ""}`,
        );
        if (trimmedParty) {
            trackingSegments.push(`Middleman: ${trimmedParty}`);
        }

        const enhancedRemarks = [trimmedRemarks, ...trackingSegments]
            .filter(Boolean)
            .join(" | ");

        try {
            await ensureFirmExists();

            if (formState.orderId) {
                const updatePayload: CreateDyeingRecordRequest = {
                    yarnType: trimmedYarn,
                    sentDate,
                    expectedArrivalDate: expectedDate,
                    remarks: enhancedRemarks || undefined,
                    partyName: trimmedParty || "Direct",
                    customerName: trimmedCustomer || undefined,
                    quantity: sentQuantity,
                    shade: trimmedShade,
                    count: trimmedCount,
                    lot: lotNumber,
                    dyeingFirm: trimmedFirm,
                };

                await updateDyeingRecord(formState.orderId, updatePayload);
                toast.success("Dyeing order updated successfully");
                onSuccess({ action: "updated", id: formState.orderId });
            } else {
                const createPayload: CreateCountProductRequest = {
                    partyName: trimmedParty || "Direct",
                    dyeingFirm: trimmedFirm,
                    yarnType: trimmedYarn,
                    count: trimmedCount,
                    shade: trimmedShade,
                    quantity: sentQuantity,
                    completedDate: sentDate,
                    qualityGrade: "A",
                    remarks: enhancedRemarks || undefined,
                    lotNumber,
                    processedBy: "System",
                    customerName: trimmedCustomer,
                    sentToDye: true,
                    sentDate,
                    received: receivedQuantity > 0,
                    receivedDate: formState.receivedDate || undefined,
                    receivedQuantity: receivedQuantity > 0 ? receivedQuantity : undefined,
                    dispatch: dispatchQuantity > 0,
                    dispatchDate: formState.dispatchDate || undefined,
                    dispatchQuantity: dispatchQuantity > 0 ? dispatchQuantity : undefined,
                    middleman: trimmedParty || "Direct",
                };

                const created = await createCountProduct(createPayload);
                const enriched = enrichCreatedProduct(
                    created,
                    sentQuantity,
                    receivedQuantity,
                    dispatchQuantity,
                );
                toast.success("Dyeing order created successfully");
                onSuccess(enriched);
                setFormState(buildEmptyForm());
                setErrors({});
            }
        } catch (error) {
            console.error("Failed to submit dyeing order:", error);
            const action = formState.orderId ? "update" : "create";
            toast.error(`Failed to ${action} dyeing order. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormState(orderToEdit ? mapOrderToForm(orderToEdit) : buildEmptyForm());
        setErrors({});
    };

    const quantitySummary = useMemo(() => {
        const total = numberFromInput(formState.quantity);
        const sent = formState.sentQuantity.trim()
            ? numberFromInput(formState.sentQuantity)
            : total;
        const received = numberFromInput(formState.receivedQuantity);
        const dispatch = numberFromInput(formState.dispatchQuantity);
        return {
            total,
            sent,
            received,
            dispatch,
        };
    }, [
        formState.quantity,
        formState.sentQuantity,
        formState.receivedQuantity,
        formState.dispatchQuantity,
    ]);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formState.orderId ? "Edit Dyeing Order" : "Add Dyeing Order"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Streamlined form aligned with the inventory experience
                    </p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div>Total: {quantitySummary.total.toFixed(2)} kg</div>
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
                                Party / Middleman *
                            </label>
                            <input
                                type="text"
                                value={formState.partyName}
                                onChange={(event) => handleChange("partyName", event.target.value)}
                                list="dyeing-order-party-suggestions"
                                placeholder="Type or select party"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.partyName ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            <datalist id="dyeing-order-party-suggestions">
                                {partyOptions.map((party) => (
                                    <option key={party} value={party} />
                                ))}
                            </datalist>
                            {errors.partyName && (
                                <p className="text-xs text-red-500 mt-1">{errors.partyName}</p>
                            )}
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
                                list="dyeing-order-firm-suggestions"
                                placeholder="Type or select firm"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.dyeingFirm ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            <datalist id="dyeing-order-firm-suggestions">
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
                                Sent to Dye (kg) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formState.sentQuantity}
                                onChange={(event) => handleChange("sentQuantity", event.target.value)}
                                placeholder="Defaults to total"
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.sentQuantity ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.sentQuantity && (
                                <p className="text-xs text-red-500 mt-1">{errors.sentQuantity}</p>
                            )}
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
                        Timeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                Expected Arrival *
                            </label>
                            <input
                                type="date"
                                value={formState.expectedArrivalDate}
                                onChange={(event) => handleChange("expectedArrivalDate", event.target.value)}
                                className={`w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.expectedArrivalDate ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            {errors.expectedArrivalDate && (
                                <p className="text-xs text-red-500 mt-1">{errors.expectedArrivalDate}</p>
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
                        Remarks
                    </h4>
                    <textarea
                        value={formState.remarks}
                        onChange={(event) => handleChange("remarks", event.target.value)}
                        rows={3}
                        placeholder="Any notes about this order"
                        className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
                    />
                </section>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
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
                                {formState.orderId ? "Saving..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                {formState.orderId ? "Update Order" : "Add Order"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default DyeingOrderQuickForm;
