import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import growthStepsApi, {
  GrowthStep,
  GrowthStepPayload,
} from "../../api/endpoints/growthSteps";


const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const padNumber = (
  value: string | number | undefined | null
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "01";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return String(number).padStart(2, "0");
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge: React.FC<{
  active: boolean;
}> = ({ active }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide ${
        active
          ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]"
          : "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-[#b8902e]"
            : "bg-[#9b9182]"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
};

// =====================================================
// VIEW STEP MODAL
// =====================================================

interface ViewGrowthStepModalProps {
  open: boolean;
  step: GrowthStep | null;
  onClose: () => void;
}

const ViewGrowthStepModal: React.FC<
  ViewGrowthStepModalProps
> = ({
  open,
  step,
  onClose,
}) => {
  if (!open || !step) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={true}
    >
      <div className="w-full max-w-[550px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                <FiEye size={17} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a741b]">
                Step Details
              </span>
            </div>

            <h2 className="text-[20px] font-bold text-[#29251f]">
              Growth Step Details
            </h2>

            <p className="mt-1 text-xs text-[#a19583]">
              View complete information about this growth step.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#f2ead8]"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-5 p-5 sm:p-6">
          {/* Step Number & Order */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#faf8f3] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
                Step Number
              </p>
              <p className="mt-1 text-lg font-bold text-[#29251f]">
                {padNumber(step.number)}
              </p>
            </div>

            <div className="rounded-xl bg-[#faf8f3] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
                Display Order
              </p>
              <p className="mt-1 text-lg font-bold text-[#29251f]">
                {step.order}
              </p>
            </div>
          </div>

          {/* Step Name */}
          <div className="rounded-xl bg-[#faf8f3] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Step Name
            </p>
            <p className="mt-1 text-base font-bold text-[#29251f]">
              {step.subtitle}
            </p>
          </div>

          {/* Description */}
          <div className="rounded-xl bg-[#faf8f3] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Description
            </p>
            <p className="mt-1 text-sm leading-6 text-[#4a4436]">
              {step.description}
            </p>
          </div>

          {/* Status */}
          <div className="rounded-xl bg-[#faf8f3] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Status
            </p>
            <div className="mt-2">
              <StatusBadge active={Boolean(step.is_active)} />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white transition hover:from-[#a98227] hover:to-[#7e6017]"
          >
            Close
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// TEXT INPUT
// =====================================================

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (
    value: string
  ) => void;
}

const TextField: React.FC<
  TextFieldProps
> = ({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
      />
    </div>
  );
};

// =====================================================
// TEXTAREA
// =====================================================

interface TextAreaFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
}

const TextAreaField: React.FC<
  TextAreaFieldProps
> = ({
  label,
  value,
  placeholder,
  onChange,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
        {label}
      </label>

      <textarea
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm leading-6 text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
      />
    </div>
  );
};

// =====================================================
// TOGGLE
// =====================================================

const ActiveToggle: React.FC<{
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}> = ({
  checked,
  onChange,
}) => {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className={`relative h-7 w-12 rounded-full transition-all ${
        checked
          ? "bg-[#b8902e]"
          : "bg-[#d9d4ca]"
      }`}
      aria-label="Toggle status"
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
};

// =====================================================
// ADD / EDIT MODAL
// =====================================================

interface GrowthStepModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  initialStep: GrowthStep | null;
  sectionTitle: string;
  onClose: () => void;
  onSubmit: (
    payload: GrowthStepPayload
  ) => void;
}

const GrowthStepModal: React.FC<
  GrowthStepModalProps
> = ({
  open,
  loading,
  mode,
  initialStep,
  sectionTitle,
  onClose,
  onSubmit,
}) => {
  const [number, setNumber] =
    useState("01");

  const [subtitle, setSubtitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [order, setOrder] =
    useState("1");

  const [isActive, setIsActive] =
    useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNumber(
      initialStep?.number ||
        "01"
    );

    setSubtitle(
      initialStep?.subtitle ||
        ""
    );

    setDescription(
      initialStep?.description ||
        ""
    );

    setOrder(
      String(
        initialStep?.order ||
          1
      )
    );

    setIsActive(
      initialStep
        ? Boolean(
            initialStep.is_active
          )
        : true
    );
  }, [open, initialStep]);

  if (!open) {
    return null;
  }

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!number.trim()) {
      toast.error(
        "Step number is required."
      );
      return;
    }

    if (!subtitle.trim()) {
      toast.error(
        "Step name is required."
      );
      return;
    }

    if (!description.trim()) {
      toast.error(
        "Description is required."
      );
      return;
    }

    const orderValue =
      Number(order);

    if (
      !Number.isFinite(
        orderValue
      ) ||
      orderValue <= 0
    ) {
      toast.error(
        "Please enter a valid display order."
      );
      return;
    }

    onSubmit({
      title:
        sectionTitle ||
        "A growth ladder for leaders",

      number:
        number.trim(),

      subtitle:
        subtitle.trim(),

      description:
        description.trim(),

      order:
        orderValue,

      is_active:
        isActive,
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      closeOnOverlayClick={
        !loading
      }
    >
      <div className="w-full max-w-[600px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                {mode ===
                "add" ? (
                  <FiPlus
                    size={17}
                  />
                ) : (
                  <FiEdit2
                    size={16}
                  />
                )}
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a741b]">
                Growth Step
              </span>
            </div>

            <h2 className="text-[20px] font-bold text-[#29251f]">
              {mode ===
              "add"
                ? "Add Growth Step"
                : "Edit Growth Step"}
            </h2>

            <p className="mt-1 text-xs text-[#a19583]">
              {mode ===
              "add"
                ? "Create a new leadership growth step."
                : "Update this growth step."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#f2ead8] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}

        <form
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Step Number"
                value={number}
                placeholder="01"
                onChange={
                  setNumber
                }
              />

              <TextField
                label="Display Order"
                value={order}
                type="number"
                placeholder="1"
                onChange={
                  setOrder
                }
              />
            </div>

            <TextField
              label="Step Name"
              value={subtitle}
              placeholder="Associate"
              onChange={
                setSubtitle
              }
            />

            <TextAreaField
              label="Description"
              value={
                description
              }
              placeholder="Describe this growth level..."
              onChange={
                setDescription
              }
            />

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#29251f]">
                    Active Status
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-[#a19583]">
                    Enable this step to show it on the
                    website.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                    {isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <ActiveToggle
                    checked={
                      isActive
                    }
                    onChange={
                      setIsActive
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-2 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                loading
              }
              className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white transition hover:from-[#a98227] hover:to-[#7e6017] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiSave
                  size={15}
                />
              )}

              {loading
                ? "Saving..."
                : mode ===
                  "add"
                ? "Create Step"
                : "Update Step"}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE MODAL
// =====================================================

interface DeleteGrowthStepModalProps {
  open: boolean;
  loading: boolean;
  step: GrowthStep | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteGrowthStepModal: React.FC<
  DeleteGrowthStepModalProps
> = ({
  open,
  loading,
  step,
  onClose,
  onConfirm,
}) => {
  if (
    !open ||
    !step
  ) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={
        !loading
      }
    >
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] to-[#8a6c1f]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff8f6] text-[#b46055]">
              <FiTrash2
                size={21}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#29251f]">
                Delete Growth Step
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#786f60]">
                Are you sure you want to delete this
                growth step?
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#8f6d1d]">
                {padNumber(
                  step.number
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#29251f]">
                  {
                    step.subtitle
                  }
                </p>

                <p className="mt-1 text-[10px] text-[#a19583]">
                  Display order:{" "}
                  {
                    step.order
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                loading
              }
              className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                onConfirm
              }
              disabled={
                loading
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b46055] to-[#93483e] px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2
                  size={15}
                />
              )}

              {loading
                ? "Deleting..."
                : "Delete Step"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const GrowthSteps: React.FC =
  () => {
    const [
      growthSteps,
      setGrowthSteps,
    ] = useState<
      GrowthStep[]
    >([]);

    const [
      sectionTitle,
      setSectionTitle,
    ] = useState(
      "A growth ladder for leaders"
    );

    const [
      loading,
      setLoading,
    ] = useState(false);

    const [
      saveLoading,
      setSaveLoading,
    ] = useState(false);

    const [
      deleteLoading,
      setDeleteLoading,
    ] = useState(false);

    const [
      addEditOpen,
      setAddEditOpen,
    ] = useState(false);

    const [
      modalMode,
      setModalMode,
    ] = useState<
      "add" | "edit"
    >("add");

    const [
      selectedStep,
      setSelectedStep,
    ] = useState<
      GrowthStep | null
    >(null);

    const [
      deleteOpen,
      setDeleteOpen,
    ] = useState(false);

    const [
      viewOpen,
      setViewOpen,
    ] = useState(false);

    // Search

    const [
      search,
      setSearch,
    ] = useState("");

    // Pagination

    const [
      currentPage,
      setCurrentPage,
    ] = useState(1);

    const ITEMS_PER_PAGE = 10;

    // =================================================
    // GET
    // =================================================

    const fetchGrowthSteps =
      async () => {
        try {
          setLoading(true);

          const response =
            await growthStepsApi.getAll();

          if (
            response.data
              .success
          ) {
            const data =
              response.data.data;

            const sortedSteps = [
              ...(data.steps ||
                []),
            ].sort(
              (a, b) =>
                Number(a.order) -
                Number(b.order)
            );

            setGrowthSteps(
              sortedSteps
            );

            if (
              data.title
            ) {
              setSectionTitle(
                data.title
              );
            }
          } else {
            toast.error(
              response.data.message ||
                "Unable to fetch growth steps."
            );
          }
        } catch (error: any) {
          console.error(
            "Get growth steps error:",
            error
          );

          toast.error(
            error?.response
              ?.data?.message ||
              "Unable to fetch growth steps."
          );
        } finally {
          setLoading(false);
        }
      };

    useEffect(() => {
      fetchGrowthSteps();
    }, []);

    // =================================================
    // FILTER
    // =================================================

    const filteredSteps =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return growthSteps;
        }

        return growthSteps.filter(
          (step) =>
            [
              step.number,
              step.subtitle,
              step.description,
              String(
                step.order
              ),
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                query
              )
        );
      }, [
        growthSteps,
        search,
      ]);

    // =================================================
    // PAGINATION
    // =================================================

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          filteredSteps.length /
            ITEMS_PER_PAGE
        )
      );

    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    const paginatedSteps =
      filteredSteps.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );

    const startEntry =
      filteredSteps.length ===
      0
        ? 0
        : startIndex + 1;

    const endEntry =
      Math.min(
        startIndex +
          ITEMS_PER_PAGE,
        filteredSteps.length
      );

    useEffect(() => {
      if (
        currentPage >
        totalPages
      ) {
        setCurrentPage(
          totalPages
        );
      }
    }, [
      currentPage,
      totalPages,
    ]);

    // =================================================
    // PAGINATION BUTTONS
    // =================================================

    const paginationPages =
      useMemo(() => {
        if (
          totalPages <= 5
        ) {
          return Array.from(
            {
              length:
                totalPages,
            },
            (_, index) =>
              index + 1
          );
        }

        if (
          currentPage <=
          3
        ) {
          return [
            1,
            2,
            3,
            4,
            5,
          ];
        }

        if (
          currentPage >=
          totalPages - 2
        ) {
          return [
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
          ];
        }

        return [
          currentPage - 2,
          currentPage - 1,
          currentPage,
          currentPage + 1,
          currentPage + 2,
        ];
      }, [
        currentPage,
        totalPages,
      ]);

    // =================================================
    // VIEW
    // =================================================

    const openViewModal = (
      step: GrowthStep
    ) => {
      setSelectedStep(step);
      setViewOpen(true);
    };

    // =================================================
    // ADD
    // =================================================

    const openAddModal =
      () => {
        setSelectedStep(
          null
        );

        setModalMode(
          "add"
        );

        setAddEditOpen(
          true
        );
      };

    // =================================================
    // EDIT
    // =================================================

    const openEditModal =
      (
        step: GrowthStep
      ) => {
        setSelectedStep(
          step
        );

        setModalMode(
          "edit"
        );

        setAddEditOpen(
          true
        );
      };

    // =================================================
    // SAVE
    // =================================================

    const handleSave =
      async (
        payload: GrowthStepPayload
      ) => {
        try {
          setSaveLoading(
            true
          );

          if (
            modalMode ===
              "edit" &&
            selectedStep?.id
          ) {
            const response =
              await growthStepsApi.update(
                selectedStep.id,
                payload
              );

            if (
              response.data
                .success
            ) {
              toast.success(
                response.data
                  .message ||
                  "Growth step updated successfully."
              );

              setAddEditOpen(
                false
              );

              setSelectedStep(
                null
              );

              await fetchGrowthSteps();
            } else {
              toast.error(
                response.data
                  .message ||
                  "Unable to update growth step."
              );
            }
          } else {
            const response =
              await growthStepsApi.create(
                payload
              );

            if (
              response.data
                .success
            ) {
              toast.success(
                response.data
                  .message ||
                  "Growth step created successfully."
              );

              setAddEditOpen(
                false
              );

              await fetchGrowthSteps();
            } else {
              toast.error(
                response.data
                  .message ||
                  "Unable to create growth step."
              );
            }
          }
        } catch (error: any) {
          console.error(
            "Save growth step error:",
            error
          );

          toast.error(
            error?.response
              ?.data?.message ||
              "Unable to save growth step."
          );
        } finally {
          setSaveLoading(
            false
          );
        }
      };

    // =================================================
    // DELETE OPEN
    // =================================================

    const openDeleteModal =
      (
        step: GrowthStep
      ) => {
        setSelectedStep(
          step
        );

        setDeleteOpen(
          true
        );
      };

    // =================================================
    // DELETE
    // =================================================

    const handleDelete =
      async () => {
        if (
          !selectedStep?.id
        ) {
          return;
        }

        try {
          setDeleteLoading(
            true
          );

          const response =
            await growthStepsApi.delete(
              selectedStep.id
            );

          if (
            response.data
              .success
          ) {
            toast.success(
              response.data
                .message ||
                "Growth step deleted successfully."
            );

            setDeleteOpen(
              false
            );

            setSelectedStep(
              null
            );

            await fetchGrowthSteps();
          } else {
            toast.error(
              response.data
                .message ||
                "Unable to delete growth step."
            );
          }
        } catch (error: any) {
          console.error(
            "Delete growth step error:",
            error
          );

          toast.error(
            error?.response
              ?.data?.message ||
              "Unable to delete growth step."
          );
        } finally {
          setDeleteLoading(
            false
          );
        }
      };

    // =================================================
    // LOADING
    // =================================================

    if (
      loading &&
      growthSteps.length ===
        0
    ) {
      return (
        <div className="min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-6">
          <div className="flex min-h-[450px] items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
                <FiRefreshCw
                  size={23}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#29251f]">
                Loading growth steps...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // =================================================
    // UI
    // =================================================

    return (
      <>
        <motion.div
          variants={
            containerVariants
          }
          initial="hidden"
          animate="visible"
          className="min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-6"
        >
          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <motion.div
            variants={
              itemVariants
            }
            className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
                  Content Management
                </span>
              </div>

              <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#29251f] sm:text-[32px]">
                Our Leaders
              </h1>

              <p className="mt-1.5 text-xs leading-5 text-[#8d8372]">
                Manage leadership growth steps and their
                display order.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  fetchGrowthSteps
                }
                disabled={
                  loading
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={15}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openAddModal
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a98227] hover:to-[#7e6017]"
              >
                <FiPlus
                  size={15}
                />

                Add Leaders
              </button>
            </div>
          </motion.div>

          {/* =================================================
              MAIN TABLE CARD
          ================================================= */}

          <motion.div
            variants={
              itemVariants
            }
            className="relative overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
          >
            {/* GOLD LINE */}

            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* LEFT */}

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#a8841c]">
                    <FiList
                      size={18}
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#29251f]">
                      Growth Step Directory
                    </h2>

                    <p className="mt-0.5 text-[10px] text-[#a19583]">
                      {filteredSteps.length}{" "}
                      {filteredSteps.length ===
                      1
                        ? "step"
                        : "steps"}{" "}
                      found
                    </p>
                  </div>
                </div>

                {/* SEARCH */}

                <div className="relative w-full md:max-w-[360px]">
                  <FiList
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                  />

                  <input
                    type="text"
                    value={
                      search
                    }
                    onChange={(e) => {
                      setSearch(
                        e.target.value
                      );
                      setCurrentPage(1);
                    }}
                    placeholder="Search growth steps..."
                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-4 text-xs text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="bg-[#2f2a22]">
                    <th className="w-[70px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      S.No.
                    </th>

                    <th className="w-[120px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Step
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Growth Level
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Description
                    </th>

                    <th className="w-[110px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Order
                    </th>

                    <th className="w-[120px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Status
                    </th>

                    <th className="w-[130px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSteps.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={
                          7
                        }
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                            <FiList
                              size={
                                24
                              }
                            />
                          </div>

                          <p className="mt-4 text-sm font-bold text-[#29251f]">
                            No growth steps found
                          </p>

                          <p className="mt-1 text-xs text-[#a89a83]">
                            Try another search or add a
                            new growth step.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSteps.map(
                      (
                        step,
                        index
                      ) => (
                        <motion.tr
                          key={
                            step.id ??
                            `${step.number}-${step.order}`
                          }
                          initial={{
                            opacity: 0,
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay:
                              index *
                              0.03,
                          }}
                          className="border-b border-[#b8902e]/10 bg-white transition hover:bg-[#fcfaf5]"
                        >
                          {/* SERIAL */}

                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          {/* STEP */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white shadow-sm">
                                {padNumber(
                                  step.number
                                )}
                              </div>

                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a19583]">
                                  Step
                                </p>

                                <p className="mt-0.5 text-xs font-bold text-[#29251f]">
                                  #{step.id ??
                                    index +
                                      1}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* GROWTH LEVEL */}

                          <td className="px-5 py-4">
                            <div className="max-w-[200px]">
                              <p className="text-sm font-bold text-[#29251f]">
                                {
                                  step.subtitle
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-[#a19583]">
                                Leadership growth level
                              </p>
                            </div>
                          </td>

                          {/* DESCRIPTION */}

                          <td className="px-5 py-4">
                            <p className="max-w-[430px] line-clamp-2 text-xs leading-5 text-[#786f60]">
                              {
                                step.description
                              }
                            </p>
                          </td>

                          {/* ORDER */}

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#faf8f3] px-2.5 text-xs font-bold text-[#8f6d1d]">
                              {
                                step.order
                              }
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">
                            <StatusBadge
                              active={
                                Boolean(
                                  step.is_active
                                )
                              }
                            />
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* VIEW */}

                              <button
                                type="button"
                                title="View"
                                onClick={() =>
                                  openViewModal(
                                    step
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiEye
                                  size={
                                    15
                                  }
                                />
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                title="Edit"
                                onClick={() =>
                                  openEditModal(
                                    step
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiEdit2
                                  size={
                                    15
                                  }
                                />
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                title="Delete"
                                onClick={() =>
                                  openDeleteModal(
                                    step
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:border-[#b46055] hover:bg-[#b46055] hover:text-white"
                              >
                                <FiTrash2
                                  size={
                                    15
                                  }
                                />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                MOBILE CARDS
            ================================================= */}

            <div className="block lg:hidden">
              {paginatedSteps.length >
              0 ? (
                paginatedSteps.map(
                  (
                    step,
                    index
                  ) => (
                    <motion.div
                      key={
                        step.id ??
                        `${step.number}-${step.order}`
                      }
                      variants={
                        itemVariants
                      }
                      className="border-b border-[#b8902e]/10 p-4"
                    >
                      {/* TOP */}

                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white">
                          {padNumber(
                            step.number
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-[#29251f]">
                                {
                                  step.subtitle
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-[#a19583]">
                                Step{" "}
                                {startIndex +
                                  index +
                                  1}{" "}
                                • Order{" "}
                                {
                                  step.order
                                }
                              </p>
                            </div>

                            <StatusBadge
                              active={
                                Boolean(
                                  step.is_active
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* DESCRIPTION */}

                      <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Description
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#786f60]">
                          {
                            step.description
                          }
                        </p>
                      </div>

                      {/* ACTIONS */}

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openViewModal(
                              step
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d]"
                          title="View"
                        >
                          <FiEye
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              step
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d]"
                          title="Edit"
                        >
                          <FiEdit2
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteModal(
                              step
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055]"
                          title="Delete"
                        >
                          <FiTrash2
                            size={
                              14
                            }
                          />
                        </button>
                      </div>
                    </motion.div>
                  )
                )
              ) : (
                <div className="flex flex-col items-center px-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                    <FiList
                      size={24}
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold text-[#29251f]">
                    No growth steps found
                  </p>

                  <p className="mt-1 text-xs text-[#a19583]">
                    Try another search.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {filteredSteps.length >
              0 && (
              <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-[#8b8171]">
                    Showing{" "}
                    <span className="font-bold text-[#4a4436]">
                      {
                        startEntry
                      }
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-[#4a4436]">
                      {
                        endEntry
                      }
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#4a4436]">
                      {
                        filteredSteps.length
                      }
                    </span>{" "}
                    entries
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1
                            )
                        )
                      }
                      disabled={
                        currentPage ===
                        1
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronLeft
                        size={
                          17
                        }
                      />
                    </button>

                    {paginationPages.map(
                      (
                        page
                      ) => (
                        <button
                          key={
                            page
                          }
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              Math.min(
                                totalPages,
                                Math.max(
                                  1,
                                  page
                                )
                              )
                            )
                          }
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                            currentPage ===
                            page
                              ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                              : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                          }`}
                        >
                          {
                            page
                          }
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronRight
                        size={
                          17
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <div className="h-5" />
        </motion.div>

        {/* =================================================
            ADD / EDIT
        ================================================= */}

        <GrowthStepModal
          open={
            addEditOpen
          }
          loading={
            saveLoading
          }
          mode={
            modalMode
          }
          initialStep={
            selectedStep
          }
          sectionTitle={
            sectionTitle
          }
          onClose={() => {
            if (
              !saveLoading
            ) {
              setAddEditOpen(
                false
              );

              setSelectedStep(
                null
              );
            }
          }}
          onSubmit={
            handleSave
          }
        />

        {/* =================================================
            VIEW
        ================================================= */}

        <ViewGrowthStepModal
          open={viewOpen}
          step={selectedStep}
          onClose={() => {
            setViewOpen(false);
            setSelectedStep(null);
          }}
        />

        {/* =================================================
            DELETE
        ================================================= */}

        <DeleteGrowthStepModal
          open={
            deleteOpen
          }
          loading={
            deleteLoading
          }
          step={
            selectedStep
          }
          onClose={() => {
            if (
              !deleteLoading
            ) {
              setDeleteOpen(
                false
              );

              setSelectedStep(
                null
              );
            }
          }}
          onConfirm={
            handleDelete
          }
        />
      </>
    );
  };

export default GrowthSteps;