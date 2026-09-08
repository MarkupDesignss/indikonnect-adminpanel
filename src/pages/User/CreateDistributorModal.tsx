import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    FiX,
    FiUser,
    FiMail,
    FiPhone,
    FiCalendar,
    FiMapPin,
    FiCreditCard,
    FiBriefcase,
    FiShield,
    FiCheckCircle,
    FiAlertCircle,
    FiChevronDown,
    FiRefreshCw,
    FiEye,
    FiEyeOff,
    FiCheck,
    FiX as FiCross,
} from "react-icons/fi";
import GlobalModal from "@/components/common/GlobalModal";
import userManagementApi, {
    CreateDistributorRequest,
} from "@/api/endpoints/user";

interface CreateDistributorModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CreateDistributorModal: React.FC<CreateDistributorModalProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const [formData, setFormData] = useState<Partial<CreateDistributorRequest>>({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        country: "India",
        date_of_birth: "",
        terms_condition: 1,

        sponsor_id: "",
        placement_leg: "left",

        encrypted_aadhaar: "",
        aadhaar_consent: 1,

        encrypted_pan: "",

        bank_holder_name: "",
        bank_name: "",
        title: "Mr.",
        type_of_entity: "Individual",
        branch_name: "",
        encrypted_bank_account: "",
        confirm_account_number: "",
        bank_ifsc: "",
        account_type: "savings",

        location_consent: 1,
        latitude: 0,
        longitude: 0,

        accept_terms: 1,
        accept_agreement: 1,
        accept_code_of_conduct: 1,

        distributor_status: "active",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Password validation rules
    const passwordRules = {
        minLength: formData.password?.length >= 6,
        hasNumber: /[0-9]/.test(formData.password || ""),
        hasUpperCase: /[A-Z]/.test(formData.password || ""),
        hasLowerCase: /[a-z]/.test(formData.password || ""),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password || ""),
    };

    const allRulesPassed = Object.values(passwordRules).every(Boolean);

    // Real-time validation for password confirmation
    const passwordMatch = formData.password === formData.password_confirmation && formData.password_confirmation?.length > 0;

    const resetForm = () => {
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            password: "",
            password_confirmation: "",
            country: "India",
            date_of_birth: "",
            terms_condition: 1,

            sponsor_id: "",
            placement_leg: "left",

            encrypted_aadhaar: "",
            aadhaar_consent: 1,

            encrypted_pan: "",

            bank_holder_name: "",
            bank_name: "",
            title: "Mr.",
            type_of_entity: "Individual",
            branch_name: "",
            encrypted_bank_account: "",
            confirm_account_number: "",
            bank_ifsc: "",
            account_type: "savings",

            location_consent: 1,
            latitude: 0,
            longitude: 0,

            accept_terms: 1,
            accept_agreement: 1,
            accept_code_of_conduct: 1,

            distributor_status: "active",
        });
        setErrors({});
        setGeneralError(null);
        setTouched({});
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
        }));

        // Mark field as touched
        setTouched((prev) => ({ ...prev, [name]: true }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Clear general error
        if (generalError) {
            setGeneralError(null);
        }

        // Real-time validation for password confirmation
        if (name === "password" || name === "password_confirmation") {
            const pass = name === "password" ? value : formData.password;
            const confirm = name === "password_confirmation" ? value : formData.password_confirmation;

            if (pass && confirm && pass !== confirm) {
                setErrors((prev) => ({ ...prev, password_confirmation: "Passwords do not match" }));
            } else if (errors.password_confirmation) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.password_confirmation;
                    return newErrors;
                });
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        // Trigger validation on blur
        validateField(name);
    };

    const validateField = (fieldName: string) => {
        const newErrors: Record<string, string> = {};

        switch (fieldName) {
            case "full_name":
                if (!formData.full_name?.trim()) {
                    newErrors.full_name = "Full name is required";
                }
                break;
            case "email":
                if (!formData.email?.trim()) {
                    newErrors.email = "Email is required";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    newErrors.email = "Invalid email format";
                }
                break;
            case "phone":
                if (!formData.phone?.trim()) {
                    newErrors.phone = "Phone number is required";
                }
                break;
            case "password":
                if (!formData.password || formData.password.length < 6) {
                    newErrors.password = "Password must be at least 6 characters";
                }
                break;
            case "password_confirmation":
                if (formData.password !== formData.password_confirmation) {
                    newErrors.password_confirmation = "Passwords do not match";
                }
                break;
            case "sponsor_id":
                if (!formData.sponsor_id?.trim()) {
                    newErrors.sponsor_id = "Sponsor ID is required";
                }
                break;
            case "encrypted_aadhaar":
                if (!formData.encrypted_aadhaar?.trim() || formData.encrypted_aadhaar.length < 12) {
                    newErrors.encrypted_aadhaar = "Valid Aadhaar number is required (12 digits)";
                }
                break;
            case "encrypted_pan":
                if (!formData.encrypted_pan?.trim() || formData.encrypted_pan.length < 10) {
                    newErrors.encrypted_pan = "Valid PAN is required (10 characters)";
                }
                break;
            case "bank_holder_name":
                if (!formData.bank_holder_name?.trim()) {
                    newErrors.bank_holder_name = "Bank holder name is required";
                }
                break;
            case "bank_name":
                if (!formData.bank_name?.trim()) {
                    newErrors.bank_name = "Bank name is required";
                }
                break;
            case "encrypted_bank_account":
                if (!formData.encrypted_bank_account?.trim()) {
                    newErrors.encrypted_bank_account = "Bank account number is required";
                }
                break;
            case "confirm_account_number":
                if (formData.encrypted_bank_account !== formData.confirm_account_number) {
                    newErrors.confirm_account_number = "Account numbers do not match";
                }
                break;
            case "bank_ifsc":
                if (!formData.bank_ifsc?.trim()) {
                    newErrors.bank_ifsc = "IFSC code is required";
                }
                break;
            case "date_of_birth":
                if (!formData.date_of_birth) {
                    newErrors.date_of_birth = "Date of birth is required";
                }
                break;
        }

        setErrors((prev) => {
            const updated = { ...prev };
            Object.keys(newErrors).forEach((key) => {
                updated[key] = newErrors[key];
            });
            // Remove errors for fields that are now valid
            Object.keys(prev).forEach((key) => {
                if (!newErrors[key]) {
                    delete updated[key];
                }
            });
            return updated;
        });
    };

    const validate = (): { isValid: boolean; firstErrorField: string | null } => {
        const newErrors: Record<string, string> = {};
        let firstErrorField: string | null = null;

        if (!formData.full_name?.trim()) {
            newErrors.full_name = "Full name is required";
            if (!firstErrorField) firstErrorField = "full_name";
        }

        if (!formData.email?.trim()) {
            newErrors.email = "Email is required";
            if (!firstErrorField) firstErrorField = "email";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
            if (!firstErrorField) firstErrorField = "email";
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = "Phone number is required";
            if (!firstErrorField) firstErrorField = "phone";
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
            if (!firstErrorField) firstErrorField = "password";
        }

        if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = "Passwords do not match";
            if (!firstErrorField) firstErrorField = "password_confirmation";
        }

        if (!formData.sponsor_id?.trim()) {
            newErrors.sponsor_id = "Sponsor ID is required";
            if (!firstErrorField) firstErrorField = "sponsor_id";
        }

        if (!formData.encrypted_aadhaar?.trim() || formData.encrypted_aadhaar.length < 12) {
            newErrors.encrypted_aadhaar = "Valid Aadhaar number is required (12 digits)";
            if (!firstErrorField) firstErrorField = "encrypted_aadhaar";
        }

        if (!formData.encrypted_pan?.trim() || formData.encrypted_pan.length < 10) {
            newErrors.encrypted_pan = "Valid PAN is required (10 characters)";
            if (!firstErrorField) firstErrorField = "encrypted_pan";
        }

        if (!formData.bank_holder_name?.trim()) {
            newErrors.bank_holder_name = "Bank holder name is required";
            if (!firstErrorField) firstErrorField = "bank_holder_name";
        }

        if (!formData.bank_name?.trim()) {
            newErrors.bank_name = "Bank name is required";
            if (!firstErrorField) firstErrorField = "bank_name";
        }

        if (!formData.encrypted_bank_account?.trim()) {
            newErrors.encrypted_bank_account = "Bank account number is required";
            if (!firstErrorField) firstErrorField = "encrypted_bank_account";
        }

        if (formData.encrypted_bank_account !== formData.confirm_account_number) {
            newErrors.confirm_account_number = "Account numbers do not match";
            if (!firstErrorField) firstErrorField = "confirm_account_number";
        }

        if (!formData.bank_ifsc?.trim()) {
            newErrors.bank_ifsc = "IFSC code is required";
            if (!firstErrorField) firstErrorField = "bank_ifsc";
        }

        if (!formData.date_of_birth) {
            newErrors.date_of_birth = "Date of birth is required";
            if (!firstErrorField) firstErrorField = "date_of_birth";
        }

        if (formData.accept_terms !== 1) {
            newErrors.accept_terms = "You must accept the terms";
            if (!firstErrorField) firstErrorField = "accept_terms";
        }

        if (formData.accept_agreement !== 1) {
            newErrors.accept_agreement = "You must accept the agreement";
            if (!firstErrorField) firstErrorField = "accept_agreement";
        }

        if (formData.accept_code_of_conduct !== 1) {
            newErrors.accept_code_of_conduct = "You must accept the code of conduct";
            if (!firstErrorField) firstErrorField = "accept_code_of_conduct";
        }

        setErrors(newErrors);
        return { isValid: Object.keys(newErrors).length === 0, firstErrorField };
    };

    const scrollToError = (fieldName: string) => {
        // Find the element with the error
        const element = document.querySelector(`[name="${fieldName}"]`);
        if (element) {
            // Scroll to the element
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Focus the element
            (element as HTMLElement).focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        // Mark all fields as touched
        const allFields = Object.keys(formData);
        const touchedState: Record<string, boolean> = {};
        allFields.forEach((field) => {
            touchedState[field] = true;
        });
        setTouched(touchedState);

        const { isValid, firstErrorField } = validate();

        if (!isValid) {
            toast.error("Please fix all validation errors");
            // Auto-scroll to first error
            if (firstErrorField) {
                setTimeout(() => scrollToError(firstErrorField), 100);
            }
            return;
        }

        try {
            setLoading(true);

            const payload: CreateDistributorRequest = {
                full_name: formData.full_name!,
                email: formData.email!,
                phone: formData.phone!,
                password: formData.password!,
                password_confirmation: formData.password_confirmation!,
                country: formData.country || "India",
                date_of_birth: formData.date_of_birth!,
                terms_condition: formData.terms_condition || 1,

                sponsor_id: formData.sponsor_id!,
                placement_leg: formData.placement_leg || "left",

                encrypted_aadhaar: formData.encrypted_aadhaar!,
                aadhaar_consent: formData.aadhaar_consent || 1,

                encrypted_pan: formData.encrypted_pan!,

                bank_holder_name: formData.bank_holder_name!,
                bank_name: formData.bank_name!,
                title: formData.title || "Mr.",
                type_of_entity: formData.type_of_entity || "Individual",
                branch_name: formData.branch_name || "",
                encrypted_bank_account: formData.encrypted_bank_account!,
                confirm_account_number: formData.confirm_account_number!,
                bank_ifsc: formData.bank_ifsc!,
                account_type: formData.account_type || "savings",

                location_consent: formData.location_consent || 1,
                latitude: formData.latitude || 0,
                longitude: formData.longitude || 0,

                accept_terms: formData.accept_terms || 1,
                accept_agreement: formData.accept_agreement || 1,
                accept_code_of_conduct: formData.accept_code_of_conduct || 1,

                distributor_status: "active",
            };

            const response = await userManagementApi.createDistributor(payload);

            if (response.status === 201 || response.status === 200) {
                const isSuccess =
                    response.data?.success !== undefined ? response.data.success : true;

                if (isSuccess) {
                    toast.success(
                        response.data?.message || "Distributor created successfully!",
                    );

                    resetForm();
                    onClose();

                    if (onSuccess) {
                        onSuccess();
                    }

                    return;
                }
            }

            const errorMsg = response.data?.message || "Failed to create distributor";
            setGeneralError(errorMsg);
            toast.error(errorMsg);
        } catch (error: any) {
            console.error("Create distributor error:", error);

            if (error?.response?.data?.errors) {
                const backendErrors = error.response.data.errors;
                const formattedErrors: Record<string, string> = {};
                let firstErrorField: string | null = null;
                Object.keys(backendErrors).forEach((key) => {
                    formattedErrors[key] = backendErrors[key][0] || "Invalid value";
                    if (!firstErrorField) firstErrorField = key;
                });
                setErrors(formattedErrors);
                toast.error("Please fix the validation errors");
                // Scroll to first backend error
                if (firstErrorField) {
                    setTimeout(() => scrollToError(firstErrorField), 100);
                }
            } else if (error?.response?.data?.message) {
                const errorMsg = error.response.data.message;
                setGeneralError(errorMsg);
                toast.error(errorMsg);
            } else if (error?.message) {
                setGeneralError(error.message);
                toast.error(error.message);
            } else {
                const errorMsg = "Failed to create distributor. Please try again.";
                setGeneralError(errorMsg);
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    if (!open) return null;

    return (
        <GlobalModal
            isOpen={open}
            onClose={handleClose}
            closeOnOverlayClick={!loading}
        >
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white">
                            <FiBriefcase size={19} />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                                Distributor Management
                            </p>

                            <h2 className="mt-0.5 text-xl font-bold text-[#2a2620]">
                                Create Distributor
                            </h2>

                            <p className="mt-1 text-xs text-[#a89a7d]">
                                Register a new distributor with KYC and banking details
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e]/10 disabled:opacity-50"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* BODY */}
                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="max-h-[calc(95vh-150px)] overflow-y-auto p-5 sm:p-6"
                >
                    {/* General Error */}
                    {generalError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start gap-3">
                                <FiAlertCircle className="mt-0.5 text-red-500" size={18} />
                                <div>
                                    <p className="text-sm font-bold text-red-700">Error</p>
                                    <p className="text-sm text-red-600">{generalError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                    <FiUser size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#2a2620]">
                                    Personal Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.full_name && touched.full_name ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter full name"
                                    />
                                    {errors.full_name && touched.full_name && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.full_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.email && touched.email ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && touched.email && (
                                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.phone && touched.phone ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone && touched.phone && (
                                        <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.date_of_birth && touched.date_of_birth ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                    />
                                    {errors.date_of_birth && touched.date_of_birth && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.date_of_birth}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country || "India"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                                        placeholder="Enter country"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Title
                                    </label>
                                    <select
                                        name="title"
                                        value={formData.title || "Mr."}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                                    >
                                        <option value="Mr.">Mr.</option>
                                        <option value="Ms.">Ms.</option>
                                        <option value="Mrs.">Mrs.</option>
                                        <option value="Dr.">Dr.</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                    <FiShield size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#2a2620]">Security</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Password *
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password || ""}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full rounded-xl border ${errors.password && touched.password ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 pr-12 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                            placeholder="Min 6 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] hover:text-[#8f6d1d]"
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && touched.password && (
                                        <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Confirm Password *
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            value={formData.password_confirmation || ""}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full rounded-xl border ${errors.password_confirmation && touched.password_confirmation
                                                    ? "border-red-400"
                                                    : touched.password_confirmation && passwordMatch && formData.password_confirmation
                                                        ? "border-green-500"
                                                        : "border-[#d8d0c0]"
                                                } bg-white px-4 py-2.5 pr-12 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                            placeholder="Confirm password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] hover:text-[#8f6d1d]"
                                        >
                                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                        {touched.password_confirmation && formData.password_confirmation && passwordMatch && (
                                            <FiCheck className="absolute right-12 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                        )}
                                    </div>
                                    {errors.password_confirmation && touched.password_confirmation && (
                                        <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>
                                    )}
                                    {touched.password_confirmation && formData.password_confirmation && passwordMatch && (
                                        <p className="mt-1 text-xs text-green-500">✓ Passwords match</p>
                                    )}
                                </div>
                            </div>

                            {/* Password Requirements */}
                            {formData.password && (
                                <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-white p-4">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Password Requirements:
                                    </p>
                                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                        <div className={`flex items-center gap-2 text-xs ${passwordRules.minLength ? "text-green-600" : "text-[#a89a7d]"}`}>
                                            {passwordRules.minLength ? <FiCheck size={14} /> : <FiCross size={14} />}
                                            At least 6 characters
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${passwordRules.hasNumber ? "text-green-600" : "text-[#a89a7d]"}`}>
                                            {passwordRules.hasNumber ? <FiCheck size={14} /> : <FiCross size={14} />}
                                            Contains a number
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${passwordRules.hasUpperCase ? "text-green-600" : "text-[#a89a7d]"}`}>
                                            {passwordRules.hasUpperCase ? <FiCheck size={14} /> : <FiCross size={14} />}
                                            Contains uppercase letter
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${passwordRules.hasLowerCase ? "text-green-600" : "text-[#a89a7d]"}`}>
                                            {passwordRules.hasLowerCase ? <FiCheck size={14} /> : <FiCross size={14} />}
                                            Contains lowercase letter
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${passwordRules.hasSpecialChar ? "text-green-600" : "text-[#a89a7d]"}`}>
                                            {passwordRules.hasSpecialChar ? <FiCheck size={14} /> : <FiCross size={14} />}
                                            Contains special character
                                        </div>
                                    </div>
                                    {allRulesPassed && formData.password && (
                                        <p className="mt-2 text-xs font-bold text-green-600">✓ Strong password</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Distributor & Sponsor */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                    <FiBriefcase size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#2a2620]">
                                    Distributor Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Sponsor ID *
                                    </label>
                                    <input
                                        type="text"
                                        name="sponsor_id"
                                        value={formData.sponsor_id || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.sponsor_id && touched.sponsor_id ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter sponsor ID"
                                    />
                                    {errors.sponsor_id && touched.sponsor_id && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.sponsor_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Placement Leg
                                    </label>
                                    <select
                                        name="placement_leg"
                                        value={formData.placement_leg || "left"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                                    >
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Type of Entity
                                    </label>
                                    <select
                                        name="type_of_entity"
                                        value={formData.type_of_entity || "Individual"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                                    >
                                        <option value="Individual">Individual</option>
                                        <option value="Proprietorship">Proprietorship</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="LLP">LLP</option>
                                        <option value="Private Limited">Private Limited</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* KYC Documents */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                    <FiCreditCard size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#2a2620]">
                                    KYC Documents
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Aadhaar Number * (12 digits)
                                    </label>
                                    <input
                                        type="text"
                                        name="encrypted_aadhaar"
                                        value={formData.encrypted_aadhaar || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={12}
                                        className={`mt-1 w-full rounded-xl border ${errors.encrypted_aadhaar && touched.encrypted_aadhaar ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter 12-digit Aadhaar"
                                    />
                                    {errors.encrypted_aadhaar && touched.encrypted_aadhaar && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.encrypted_aadhaar}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        PAN Number * (10 characters)
                                    </label>
                                    <input
                                        type="text"
                                        name="encrypted_pan"
                                        value={formData.encrypted_pan || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={10}
                                        className={`mt-1 w-full rounded-xl border ${errors.encrypted_pan && touched.encrypted_pan ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter PAN (e.g., ABCDE1234F)"
                                    />
                                    {errors.encrypted_pan && touched.encrypted_pan && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.encrypted_pan}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Banking Details */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                    <FiCreditCard size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#2a2620]">
                                    Banking Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Bank Holder Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_holder_name"
                                        value={formData.bank_holder_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.bank_holder_name && touched.bank_holder_name ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter bank holder name"
                                    />
                                    {errors.bank_holder_name && touched.bank_holder_name && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.bank_holder_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        value={formData.bank_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.bank_name && touched.bank_name ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter bank name"
                                    />
                                    {errors.bank_name && touched.bank_name && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.bank_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Branch Name
                                    </label>
                                    <input
                                        type="text"
                                        name="branch_name"
                                        value={formData.branch_name || ""}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                                        placeholder="Enter branch name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Account Type
                                    </label>
                                    <select
                                        name="account_type"
                                        value={formData.account_type || "savings"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                                    >
                                        <option value="savings">Savings</option>
                                        <option value="current">Current</option>
                                        <option value="salary">Salary</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Account Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="encrypted_bank_account"
                                        value={formData.encrypted_bank_account || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.encrypted_bank_account && touched.encrypted_bank_account ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter bank account number"
                                    />
                                    {errors.encrypted_bank_account && touched.encrypted_bank_account && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.encrypted_bank_account}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        Confirm Account Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="confirm_account_number"
                                        value={formData.confirm_account_number || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.confirm_account_number && touched.confirm_account_number
                                                ? "border-red-400"
                                                : touched.confirm_account_number && formData.encrypted_bank_account === formData.confirm_account_number && formData.confirm_account_number
                                                    ? "border-green-500"
                                                    : "border-[#d8d0c0]"
                                            } bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Confirm account number"
                                    />
                                    {errors.confirm_account_number && touched.confirm_account_number && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.confirm_account_number}
                                        </p>
                                    )}
                                    {touched.confirm_account_number && formData.confirm_account_number && formData.encrypted_bank_account === formData.confirm_account_number && (
                                        <p className="mt-1 text-xs text-green-500">✓ Account numbers match</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#a89a7d]">
                                        IFSC Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_ifsc"
                                        value={formData.bank_ifsc || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.bank_ifsc && touched.bank_ifsc ? "border-red-400" : "border-[#d8d0c0]"} bg-white px-4 py-2.5 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15`}
                                        placeholder="Enter IFSC code"
                                    />
                                    {errors.bank_ifsc && touched.bank_ifsc && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.bank_ifsc}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Consents */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                    <FiCheckCircle size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#2a2620]">
                                    Consents & Agreements
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <label
                                    className={`flex items-center gap-3 rounded-xl border ${errors.accept_terms ? "border-red-400" : "border-[#b8902e]/10"} bg-white p-3 cursor-pointer hover:bg-[#faf8f3]`}
                                >
                                    <input
                                        type="checkbox"
                                        name="accept_terms"
                                        checked={formData.accept_terms === 1}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-[#b8902e]/30 text-[#b8902e] focus:ring-[#b8902e]/20"
                                    />
                                    <span className="text-sm font-medium text-[#2a2620]">
                                        Accept Terms *
                                    </span>
                                </label>

                                <label
                                    className={`flex items-center gap-3 rounded-xl border ${errors.accept_agreement ? "border-red-400" : "border-[#b8902e]/10"} bg-white p-3 cursor-pointer hover:bg-[#faf8f3]`}
                                >
                                    <input
                                        type="checkbox"
                                        name="accept_agreement"
                                        checked={formData.accept_agreement === 1}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-[#b8902e]/30 text-[#b8902e] focus:ring-[#b8902e]/20"
                                    />
                                    <span className="text-sm font-medium text-[#2a2620]">
                                        Accept Agreement *
                                    </span>
                                </label>

                                <label
                                    className={`flex items-center gap-3 rounded-xl border ${errors.accept_code_of_conduct ? "border-red-400" : "border-[#b8902e]/10"} bg-white p-3 cursor-pointer hover:bg-[#faf8f3]`}
                                >
                                    <input
                                        type="checkbox"
                                        name="accept_code_of_conduct"
                                        checked={formData.accept_code_of_conduct === 1}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-[#b8902e]/30 text-[#b8902e] focus:ring-[#b8902e]/20"
                                    />
                                    <span className="text-sm font-medium text-[#2a2620]">
                                        Code of Conduct *
                                    </span>
                                </label>
                            </div>
                            {errors.accept_terms && (
                                <p className="mt-2 text-xs text-red-500">
                                    {errors.accept_terms}
                                </p>
                            )}
                            {errors.accept_agreement && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.accept_agreement}
                                </p>
                            )}
                            {errors.accept_code_of_conduct && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.accept_code_of_conduct}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border border-[#b8902e]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] hover:text-[#8f6d1d] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:shadow-lg disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <FiRefreshCw size={16} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FiBriefcase size={16} />
                                    Create Distributor
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </GlobalModal>
    );
};

export default CreateDistributorModal;