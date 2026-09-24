import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
    FiX,
    FiUser,
    FiCreditCard,
    FiBriefcase,
    FiShield,
    FiCheckCircle,
    FiAlertCircle,
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

    const defaultFormData: Partial<CreateDistributorRequest> = {
        full_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        country: "India",
        date_of_birth: "",
        terms_condition: 1,

        // ✅ NEW fields
        distributor_id: "",
        company_name: "",
        gst_in: "",

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
    };

    const [formData, setFormData] = useState<Partial<CreateDistributorRequest>>(
        defaultFormData,
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Password validation rules
    const passwordRules = {
        minLength: (formData.password?.length || 0) >= 6,
        hasNumber: /[0-9]/.test(formData.password || ""),
        hasUpperCase: /[A-Z]/.test(formData.password || ""),
        hasLowerCase: /[a-z]/.test(formData.password || ""),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password || ""),
    };

    const allRulesPassed = Object.values(passwordRules).every(Boolean);

    const passwordMatch =
        formData.password === formData.password_confirmation &&
        (formData.password_confirmation?.length || 0) > 0;

    const resetForm = () => {
        setFormData(defaultFormData);
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

        setTouched((prev) => ({ ...prev, [name]: true }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (generalError) setGeneralError(null);

        if (name === "password" || name === "password_confirmation") {
            const pass = name === "password" ? value : formData.password;
            const confirm =
                name === "password_confirmation"
                    ? value
                    : formData.password_confirmation;

            if (pass && confirm && pass !== confirm) {
                setErrors((prev) => ({
                    ...prev,
                    password_confirmation: "Passwords do not match",
                }));
            } else if (errors.password_confirmation) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.password_confirmation;
                    return newErrors;
                });
            }
        }
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        validateField(name);
    };

    const validateField = (fieldName: string) => {
        const newErrors: Record<string, string> = {};

        switch (fieldName) {
            case "full_name":
                if (!formData.full_name?.trim())
                    newErrors.full_name = "Full name is required";
                break;
            case "email":
                if (!formData.email?.trim())
                    newErrors.email = "Email is required";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                    newErrors.email = "Invalid email format";
                break;
            case "phone":
                if (!formData.phone?.trim())
                    newErrors.phone = "Phone number is required";
                break;
            case "password":
                if (!formData.password || formData.password.length < 6)
                    newErrors.password = "Password must be at least 6 characters";
                break;
            case "password_confirmation":
                if (formData.password !== formData.password_confirmation)
                    newErrors.password_confirmation = "Passwords do not match";
                break;

            // ✅ NEW field validations
            case "distributor_id":
                if (!formData.distributor_id?.trim())
                    newErrors.distributor_id = "Distributor ID (BA ID) is required";
                break;
            case "company_name":
                if (!formData.company_name?.trim())
                    newErrors.company_name = "Company name is required";
                break;
            case "gst_in":
                if (!formData.gst_in?.trim())
                    newErrors.gst_in = "GST number is required";
                else if (
                    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                        formData.gst_in.trim().toUpperCase(),
                    )
                )
                    newErrors.gst_in = "Invalid GST format (e.g., 22AAAAA0000A1Z5)";
                break;

            case "sponsor_id":
                if (!formData.sponsor_id?.trim())
                    newErrors.sponsor_id = "Sponsor ID is required";
                break;
            case "encrypted_aadhaar":
                if (
                    !formData.encrypted_aadhaar?.trim() ||
                    formData.encrypted_aadhaar.length < 12
                )
                    newErrors.encrypted_aadhaar =
                        "Valid Aadhaar number is required (12 digits)";
                break;
            case "encrypted_pan":
                if (
                    !formData.encrypted_pan?.trim() ||
                    formData.encrypted_pan.length < 10
                )
                    newErrors.encrypted_pan =
                        "Valid PAN is required (10 characters)";
                break;
            case "bank_holder_name":
                if (!formData.bank_holder_name?.trim())
                    newErrors.bank_holder_name = "Bank holder name is required";
                break;
            case "bank_name":
                if (!formData.bank_name?.trim())
                    newErrors.bank_name = "Bank name is required";
                break;
            case "encrypted_bank_account":
                if (!formData.encrypted_bank_account?.trim())
                    newErrors.encrypted_bank_account =
                        "Bank account number is required";
                break;
            case "confirm_account_number":
                if (formData.encrypted_bank_account !== formData.confirm_account_number)
                    newErrors.confirm_account_number = "Account numbers do not match";
                break;
            case "bank_ifsc":
                if (!formData.bank_ifsc?.trim())
                    newErrors.bank_ifsc = "IFSC code is required";
                break;
            case "date_of_birth":
                if (!formData.date_of_birth)
                    newErrors.date_of_birth = "Date of birth is required";
                break;
        }

        setErrors((prev) => {
            const updated = { ...prev };
            Object.keys(newErrors).forEach((key) => {
                updated[key] = newErrors[key];
            });
            Object.keys(prev).forEach((key) => {
                if (!newErrors[key]) delete updated[key];
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

        // ✅ NEW field validations
        if (!formData.distributor_id?.trim()) {
            newErrors.distributor_id = "Distributor ID (BA ID) is required";
            if (!firstErrorField) firstErrorField = "distributor_id";
        }

        if (!formData.company_name?.trim()) {
            newErrors.company_name = "Company name is required";
            if (!firstErrorField) firstErrorField = "company_name";
        }

        if (!formData.gst_in?.trim()) {
            newErrors.gst_in = "GST number is required";
            if (!firstErrorField) firstErrorField = "gst_in";
        } else if (
            !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                formData.gst_in.trim().toUpperCase(),
            )
        ) {
            newErrors.gst_in = "Invalid GST format (e.g., 22AAAAA0000A1Z5)";
            if (!firstErrorField) firstErrorField = "gst_in";
        }

        if (!formData.sponsor_id?.trim()) {
            newErrors.sponsor_id = "Sponsor ID is required";
            if (!firstErrorField) firstErrorField = "sponsor_id";
        }

        if (
            !formData.encrypted_aadhaar?.trim() ||
            formData.encrypted_aadhaar.length < 12
        ) {
            newErrors.encrypted_aadhaar =
                "Valid Aadhaar number is required (12 digits)";
            if (!firstErrorField) firstErrorField = "encrypted_aadhaar";
        }

        if (
            !formData.encrypted_pan?.trim() ||
            formData.encrypted_pan.length < 10
        ) {
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
        const element = document.querySelector(`[name="${fieldName}"]`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            (element as HTMLElement).focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        const allFields = Object.keys(formData);
        const touchedState: Record<string, boolean> = {};
        allFields.forEach((field) => {
            touchedState[field] = true;
        });
        setTouched(touchedState);

        const { isValid, firstErrorField } = validate();

        if (!isValid) {
            toast.error("Please fix all validation errors");
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

                // ✅ NEW fields
                distributor_id: formData.distributor_id!.trim(),
                company_name: formData.company_name!.trim(),
                gst_in: formData.gst_in!.trim().toUpperCase(),

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
                    response.data?.success !== undefined
                        ? response.data.success
                        : true;

                if (isSuccess) {
                    toast.success(
                        response.data?.message || "Distributor created successfully!",
                    );

                    resetForm();
                    onClose();

                    if (onSuccess) onSuccess();
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
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-sm font-bold text-white">
                            <FiBriefcase size={19} />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                                Distributor Management
                            </p>

                            <h2 className="mt-0.5 text-xl font-bold text-[#202721]">
                                Create Distributor
                            </h2>

                            <p className="mt-1 text-xs text-[#9AA29C]">
                                Register a new distributor with KYC and banking details
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-50"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* BODY */}
                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    autoComplete="off"
                    className="max-h-[calc(95vh-150px)] overflow-y-auto p-5 sm:p-6"
                >
                    {/* ✅ Hidden dummy inputs to trick browser autofill */}
                    <input
                        type="text"
                        name="fakeusernameremembered"
                        autoComplete="username"
                        style={{ display: "none" }}
                        tabIndex={-1}
                    />
                    <input
                        type="password"
                        name="fakepasswordremembered"
                        autoComplete="new-password"
                        style={{ display: "none" }}
                        tabIndex={-1}
                    />

                    {/* General Error */}
                    {generalError && (
                        <div className="mb-4 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] p-4">
                            <div className="flex items-start gap-3">
                                <FiAlertCircle
                                    className="mt-0.5 text-[#C23B32]"
                                    size={18}
                                />
                                <div>
                                    <p className="text-sm font-bold text-[#C23B32]">
                                        Error
                                    </p>
                                    <p className="text-sm text-[#C23B32]/80">
                                        {generalError}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiUser size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#202721]">
                                    Personal Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        autoComplete="off"
                                        value={formData.full_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.full_name && touched.full_name
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter full name"
                                    />
                                    {errors.full_name && touched.full_name && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.full_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="off"
                                        value={formData.email || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.email && touched.email
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && touched.email && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        autoComplete="off"
                                        value={formData.phone || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.phone && touched.phone
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone && touched.phone && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        autoComplete="off"
                                        value={formData.date_of_birth || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.date_of_birth && touched.date_of_birth
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                    />
                                    {errors.date_of_birth && touched.date_of_birth && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.date_of_birth}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        autoComplete="off"
                                        value={formData.country || "India"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15"
                                        placeholder="Enter country"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Title
                                    </label>
                                    <select
                                        name="title"
                                        value={formData.title || "Mr."}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15"
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
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiShield size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#202721]">
                                    Security
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Password *
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            autoComplete="new-password"
                                            value={formData.password || ""}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full rounded-xl border ${errors.password && touched.password
                                                    ? "border-[#C23B32]"
                                                    : "border-[#D8E2D8]"
                                                } bg-white px-4 py-2.5 pr-12 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                            placeholder="Min 6 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29C] hover:text-[#163F20]"
                                        >
                                            {showPassword ? (
                                                <FiEyeOff size={18} />
                                            ) : (
                                                <FiEye size={18} />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && touched.password && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Confirm Password *
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            value={formData.password_confirmation || ""}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full rounded-xl border ${errors.password_confirmation &&
                                                    touched.password_confirmation
                                                    ? "border-[#C23B32]"
                                                    : touched.password_confirmation &&
                                                        passwordMatch &&
                                                        formData.password_confirmation
                                                        ? "border-[#1F7A3D]"
                                                        : "border-[#D8E2D8]"
                                                } bg-white px-4 py-2.5 pr-12 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                            placeholder="Confirm password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(!showConfirmPassword)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29C] hover:text-[#163F20]"
                                        >
                                            {showConfirmPassword ? (
                                                <FiEyeOff size={18} />
                                            ) : (
                                                <FiEye size={18} />
                                            )}
                                        </button>
                                        {touched.password_confirmation &&
                                            formData.password_confirmation &&
                                            passwordMatch && (
                                                <FiCheck
                                                    className="absolute right-12 top-1/2 -translate-y-1/2 text-[#1F7A3D]"
                                                    size={18}
                                                />
                                            )}
                                    </div>
                                    {errors.password_confirmation &&
                                        touched.password_confirmation && (
                                            <p className="mt-1 text-xs text-[#C23B32]">
                                                {errors.password_confirmation}
                                            </p>
                                        )}
                                    {touched.password_confirmation &&
                                        formData.password_confirmation &&
                                        passwordMatch && (
                                            <p className="mt-1 text-xs text-[#1F7A3D]">
                                                ✓ Passwords match
                                            </p>
                                        )}
                                </div>
                            </div>

                            {/* Password Requirements */}
                            {formData.password && (
                                <div className="mt-4 rounded-xl border border-[#163F20]/10 bg-white p-4">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Password Requirements:
                                    </p>
                                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                        <div
                                            className={`flex items-center gap-2 text-xs ${passwordRules.minLength
                                                    ? "text-[#1F7A3D]"
                                                    : "text-[#9AA29C]"
                                                }`}
                                        >
                                            {passwordRules.minLength ? (
                                                <FiCheck size={14} />
                                            ) : (
                                                <FiCross size={14} />
                                            )}
                                            At least 6 characters
                                        </div>
                                        <div
                                            className={`flex items-center gap-2 text-xs ${passwordRules.hasNumber
                                                    ? "text-[#1F7A3D]"
                                                    : "text-[#9AA29C]"
                                                }`}
                                        >
                                            {passwordRules.hasNumber ? (
                                                <FiCheck size={14} />
                                            ) : (
                                                <FiCross size={14} />
                                            )}
                                            Contains a number
                                        </div>
                                        <div
                                            className={`flex items-center gap-2 text-xs ${passwordRules.hasUpperCase
                                                    ? "text-[#1F7A3D]"
                                                    : "text-[#9AA29C]"
                                                }`}
                                        >
                                            {passwordRules.hasUpperCase ? (
                                                <FiCheck size={14} />
                                            ) : (
                                                <FiCross size={14} />
                                            )}
                                            Contains uppercase letter
                                        </div>
                                        <div
                                            className={`flex items-center gap-2 text-xs ${passwordRules.hasLowerCase
                                                    ? "text-[#1F7A3D]"
                                                    : "text-[#9AA29C]"
                                                }`}
                                        >
                                            {passwordRules.hasLowerCase ? (
                                                <FiCheck size={14} />
                                            ) : (
                                                <FiCross size={14} />
                                            )}
                                            Contains lowercase letter
                                        </div>
                                        <div
                                            className={`flex items-center gap-2 text-xs ${passwordRules.hasSpecialChar
                                                    ? "text-[#1F7A3D]"
                                                    : "text-[#9AA29C]"
                                                }`}
                                        >
                                            {passwordRules.hasSpecialChar ? (
                                                <FiCheck size={14} />
                                            ) : (
                                                <FiCross size={14} />
                                            )}
                                            Contains special character
                                        </div>
                                    </div>
                                    {allRulesPassed && formData.password && (
                                        <p className="mt-2 text-xs font-bold text-[#1F7A3D]">
                                            ✓ Strong password
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ✅ NEW: Distributor Identity (BA ID, Company, GST) */}
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiBriefcase size={17} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#202721]">
                                        Distributor Identity
                                    </h3>
                                    <p className="mt-0.5 text-xs text-[#9AA29C]">
                                        BA ID, company name and GST details
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Distributor ID (BA ID) *
                                    </label>
                                    <input
                                        type="text"
                                        name="distributor_id"
                                        autoComplete="off"
                                        value={formData.distributor_id || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.distributor_id && touched.distributor_id
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="e.g., IND-0077"
                                    />
                                    {errors.distributor_id && touched.distributor_id && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.distributor_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        autoComplete="off"
                                        value={formData.company_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.company_name && touched.company_name
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter company name"
                                    />
                                    {errors.company_name && touched.company_name && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.company_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        GST Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="gst_in"
                                        autoComplete="off"
                                        value={formData.gst_in || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={15}
                                        className={`mt-1 w-full rounded-xl border ${errors.gst_in && touched.gst_in
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm uppercase text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="e.g., 22AAAAA0000A1Z5"
                                    />
                                    {errors.gst_in && touched.gst_in && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.gst_in}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sponsor & Placement */}
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiBriefcase size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#202721]">
                                    Sponsor & Placement
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Sponsor ID *
                                    </label>
                                    <input
                                        type="text"
                                        name="sponsor_id"
                                        autoComplete="off"
                                        value={formData.sponsor_id || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.sponsor_id && touched.sponsor_id
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter sponsor ID"
                                    />
                                    {errors.sponsor_id && touched.sponsor_id && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.sponsor_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Placement Leg
                                    </label>
                                    <select
                                        name="placement_leg"
                                        value={formData.placement_leg || "left"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15"
                                    >
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Type of Entity
                                    </label>
                                    <select
                                        name="type_of_entity"
                                        value={formData.type_of_entity || "Individual"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15"
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
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiCreditCard size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#202721]">
                                    KYC Documents
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Aadhaar Number * (12 digits)
                                    </label>
                                    <input
                                        type="text"
                                        name="encrypted_aadhaar"
                                        autoComplete="off"
                                        value={formData.encrypted_aadhaar || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={12}
                                        className={`mt-1 w-full rounded-xl border ${errors.encrypted_aadhaar &&
                                                touched.encrypted_aadhaar
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter 12-digit Aadhaar"
                                    />
                                    {errors.encrypted_aadhaar &&
                                        touched.encrypted_aadhaar && (
                                            <p className="mt-1 text-xs text-[#C23B32]">
                                                {errors.encrypted_aadhaar}
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        PAN Number * (10 characters)
                                    </label>
                                    <input
                                        type="text"
                                        name="encrypted_pan"
                                        autoComplete="off"
                                        value={formData.encrypted_pan || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={10}
                                        className={`mt-1 w-full rounded-xl border ${errors.encrypted_pan && touched.encrypted_pan
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter PAN (e.g., ABCDE1234F)"
                                    />
                                    {errors.encrypted_pan && touched.encrypted_pan && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.encrypted_pan}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Banking Details */}
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiCreditCard size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#202721]">
                                    Banking Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Bank Holder Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_holder_name"
                                        autoComplete="off"
                                        value={formData.bank_holder_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.bank_holder_name &&
                                                touched.bank_holder_name
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter bank holder name"
                                    />
                                    {errors.bank_holder_name &&
                                        touched.bank_holder_name && (
                                            <p className="mt-1 text-xs text-[#C23B32]">
                                                {errors.bank_holder_name}
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        autoComplete="off"
                                        value={formData.bank_name || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.bank_name && touched.bank_name
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter bank name"
                                    />
                                    {errors.bank_name && touched.bank_name && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.bank_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Branch Name
                                    </label>
                                    <input
                                        type="text"
                                        name="branch_name"
                                        autoComplete="off"
                                        value={formData.branch_name || ""}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15"
                                        placeholder="Enter branch name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Account Type
                                    </label>
                                    <select
                                        name="account_type"
                                        value={formData.account_type || "savings"}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15"
                                    >
                                        <option value="savings">Savings</option>
                                        <option value="current">Current</option>
                                        <option value="salary">Salary</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Account Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="encrypted_bank_account"
                                        autoComplete="off"
                                        value={formData.encrypted_bank_account || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.encrypted_bank_account &&
                                                touched.encrypted_bank_account
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter bank account number"
                                        maxLength={20}
                                    />
                                    {errors.encrypted_bank_account &&
                                        touched.encrypted_bank_account && (
                                            <p className="mt-1 text-xs text-[#C23B32]">
                                                {errors.encrypted_bank_account}
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        Confirm Account Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="confirm_account_number"
                                        autoComplete="off"
                                        value={formData.confirm_account_number || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.confirm_account_number &&
                                                touched.confirm_account_number
                                                ? "border-[#C23B32]"
                                                : touched.confirm_account_number &&
                                                    formData.encrypted_bank_account ===
                                                    formData.confirm_account_number &&
                                                    formData.confirm_account_number
                                                    ? "border-[#1F7A3D]"
                                                    : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Confirm account number"
                                        maxLength={20}
                                    />
                                    {errors.confirm_account_number &&
                                        touched.confirm_account_number && (
                                            <p className="mt-1 text-xs text-[#C23B32]">
                                                {errors.confirm_account_number}
                                            </p>
                                        )}
                                    {touched.confirm_account_number &&
                                        formData.confirm_account_number &&
                                        formData.encrypted_bank_account ===
                                        formData.confirm_account_number && (
                                            <p className="mt-1 text-xs text-[#1F7A3D]">
                                                ✓ Account numbers match
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-[#9AA29C]">
                                        IFSC Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_ifsc"
                                        autoComplete="off"
                                        value={formData.bank_ifsc || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`mt-1 w-full rounded-xl border ${errors.bank_ifsc && touched.bank_ifsc
                                                ? "border-[#C23B32]"
                                                : "border-[#D8E2D8]"
                                            } bg-white px-4 py-2.5 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15`}
                                        placeholder="Enter IFSC code"
                                    />
                                    {errors.bank_ifsc && touched.bank_ifsc && (
                                        <p className="mt-1 text-xs text-[#C23B32]">
                                            {errors.bank_ifsc}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Consents */}
                        <div className="rounded-2xl border border-[#E5EAE5] bg-[#F5F7F5] p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                                    <FiCheckCircle size={17} />
                                </div>
                                <h3 className="text-sm font-bold text-[#202721]">
                                    Consents & Agreements
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <label
                                    className={`flex items-center gap-3 rounded-xl border ${errors.accept_terms
                                            ? "border-[#C23B32]"
                                            : "border-[#163F20]/10"
                                        } bg-white p-3 cursor-pointer hover:bg-[#FAFBFA]`}
                                >
                                    <input
                                        type="checkbox"
                                        name="accept_terms"
                                        checked={formData.accept_terms === 1}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-[#163F20]/30 text-[#163F20] focus:ring-[#163F20]/20"
                                    />
                                    <span className="text-sm font-medium text-[#202721]">
                                        Accept Terms *
                                    </span>
                                </label>

                                <label
                                    className={`flex items-center gap-3 rounded-xl border ${errors.accept_agreement
                                            ? "border-[#C23B32]"
                                            : "border-[#163F20]/10"
                                        } bg-white p-3 cursor-pointer hover:bg-[#FAFBFA]`}
                                >
                                    <input
                                        type="checkbox"
                                        name="accept_agreement"
                                        checked={formData.accept_agreement === 1}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-[#163F20]/30 text-[#163F20] focus:ring-[#163F20]/20"
                                    />
                                    <span className="text-sm font-medium text-[#202721]">
                                        Accept Agreement *
                                    </span>
                                </label>

                                <label
                                    className={`flex items-center gap-3 rounded-xl border ${errors.accept_code_of_conduct
                                            ? "border-[#C23B32]"
                                            : "border-[#163F20]/10"
                                        } bg-white p-3 cursor-pointer hover:bg-[#FAFBFA]`}
                                >
                                    <input
                                        type="checkbox"
                                        name="accept_code_of_conduct"
                                        checked={formData.accept_code_of_conduct === 1}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-[#163F20]/30 text-[#163F20] focus:ring-[#163F20]/20"
                                    />
                                    <span className="text-sm font-medium text-[#202721]">
                                        Code of Conduct *
                                    </span>
                                </label>
                            </div>
                            {errors.accept_terms && (
                                <p className="mt-2 text-xs text-[#C23B32]">
                                    {errors.accept_terms}
                                </p>
                            )}
                            {errors.accept_agreement && (
                                <p className="mt-1 text-xs text-[#C23B32]">
                                    {errors.accept_agreement}
                                </p>
                            )}
                            {errors.accept_code_of_conduct && (
                                <p className="mt-1 text-xs text-[#C23B32]">
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
                            className="rounded-xl border border-[#163F20]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#163F20]/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70"
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