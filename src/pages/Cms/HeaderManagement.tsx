import React, {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    FiAlertTriangle,
    FiChevronLeft,
    FiChevronRight,
    FiEdit3,
    FiEye,
    FiGlobe,
    FiImage,
    FiLink,
    FiMenu,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiUploadCloud,
    FiX,
  } from "react-icons/fi";
  
  import { motion } from "framer-motion";
  import toast from "react-hot-toast";
  
  import GlobalModal from "@/components/common/GlobalModal";
  
  import headerApi, {
    HeaderMenu,
  } from "../../api/endpoints/header";
  
  // =====================================================
  // THEME
  // =====================================================
  
  const bgColor = "#f7f5ef";
  const gold = "#b8902e";
  const darkGold = "#8f6d1d";
  const cream = "#faf8f3";
  const darkText = "#29251f";
  const mutedText = "#8d8372";
  
  // =====================================================
  // TYPES
  // =====================================================
  
  interface MenuForm {
    title: string;
    status: boolean;
    type: string;
  }
  
  interface BrandingForm {
    logo: File | null;
    favicon: File | null;
  }
  
  // =====================================================
  // ANIMATION
  // =====================================================
  
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
  
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 12,
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
  
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  
  const getStatusClass = (
    status: boolean
  ) =>
    status
      ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]"
      : "border-[#d8d1c4] bg-[#f5f2eb] text-[#786f60]";
  
  // =====================================================
  // IMAGE SELECTOR
  // =====================================================
  
  interface ImageSelectorProps {
    label: string;
    file: File | null;
    existingUrl: string | null;
    icon: React.ReactNode;
    compact?: boolean;
    onChange: (
      file: File | null
    ) => void;
  }
  
  const ImageSelector: React.FC<
    ImageSelectorProps
  > = ({
    label,
    file,
    existingUrl,
    icon,
    compact = false,
    onChange,
  }) => {
    const [preview, setPreview] =
      useState<string | null>(null);
  
    useEffect(() => {
      if (!file) {
        setPreview(null);
        return;
      }
  
      const url =
        URL.createObjectURL(file);
  
      setPreview(url);
  
      return () => {
        URL.revokeObjectURL(url);
      };
    }, [file]);
  
    const imageUrl =
      preview || existingUrl;
  
    return (
      <div
        className={`rounded-xl border border-[#b8902e]/10 bg-[#fbfaf7] ${
          compact ? "p-3" : "p-4"
        }`}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#b8902e] shadow-sm">
              {icon}
            </div>
  
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                {label}
              </p>
  
              <p className="text-xs font-bold text-[#403a30]">
                {file
                  ? "New image selected"
                  : existingUrl
                  ? "Current image"
                  : "No image"}
              </p>
            </div>
          </div>
  
          {file && (
            <button
              type="button"
              onClick={() =>
                onChange(null)
              }
              className="text-[#a45e52] hover:text-[#8f4238]"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
  
        <div
          className={`flex items-center justify-center overflow-hidden rounded-xl border border-[#b8902e]/10 bg-white ${
            compact
              ? "h-[96px] p-3"
              : "h-[120px] p-4"
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className={
                label === "Favicon"
                  ? "h-16 w-16 object-contain"
                  : "max-h-full max-w-full object-contain"
              }
            />
          ) : (
            <div className="flex flex-col items-center text-center text-[#aaa08e]">
              <FiImage size={24} />
  
              <span className="mt-2 text-[10px]">
                Not uploaded
              </span>
            </div>
          )}
        </div>
  
        <label className="mt-2.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#b8902e]/15 bg-white px-3 py-2 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#faf8f3]">
          <FiUploadCloud size={14} />
  
          {file
            ? "Change Image"
            : "Choose Image"}
  
          <input
            type="file"
            accept={
              label === "Favicon"
                ? "image/png,image/jpeg,image/jpg,image/webp,image/x-icon"
                : "image/png,image/jpeg,image/jpg,image/webp"
            }
            className="hidden"
            onChange={(event) =>
              onChange(
                event.target.files?.[0] ||
                  null
              )
            }
          />
        </label>
      </div>
    );
  };
  
  // =====================================================
  // BRANDING UPDATE MODAL
  // =====================================================
  
  interface BrandingModalProps {
    open: boolean;
    loading: boolean;
    logoUrl: string | null;
    faviconUrl: string | null;
    onClose: () => void;
    onSubmit: (
      payload: BrandingForm
    ) => void;
  }
  
  const BrandingModal: React.FC<
    BrandingModalProps
  > = ({
    open,
    loading,
    logoUrl,
    faviconUrl,
    onClose,
    onSubmit,
  }) => {
    const [logo, setLogo] =
      useState<File | null>(null);
  
    const [favicon, setFavicon] =
      useState<File | null>(null);
  
    useEffect(() => {
      if (open) {
        setLogo(null);
        setFavicon(null);
      }
    }, [open]);
  
    if (!open) {
      return null;
    }
  
    const handleSubmit = (
      event: React.FormEvent
    ) => {
      event.preventDefault();
  
      if (!logo && !favicon) {
        toast.error(
          "Please select logo or favicon to update."
        );
        return;
      }
  
      onSubmit({
        logo,
        favicon,
      });
    };
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
          <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e]">
                  <FiImage size={16} />
                </div>
  
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a741b]">
                  Header Branding
                </span>
              </div>
  
              <h2 className="mt-1 text-lg font-bold text-[#29251f]">
                Update Logo & Favicon
              </h2>
  
              <p className="mt-0.5 text-[11px] text-[#a19583]">
                Update the branding used by the Home header.
              </p>
            </div>
  
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
            >
              <FiX size={16} />
            </button>
          </div>
  
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <ImageSelector
                label="Logo"
                file={logo}
                existingUrl={logoUrl}
                icon={<FiImage size={15} />}
                onChange={setLogo}
              />
  
              <ImageSelector
                label="Favicon"
                file={favicon}
                existingUrl={faviconUrl}
                icon={<FiGlobe size={15} />}
                compact
                onChange={setFavicon}
              />
            </div>
  
            <div className="flex flex-col-reverse gap-2 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] hover:bg-[#faf8f3] disabled:opacity-50"
              >
                Cancel
              </button>
  
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 hover:from-[#a98227] hover:to-[#7e6017] disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiUploadCloud size={15} />
                )}
  
                {loading
                  ? "Updating..."
                  : "Update Branding"}
              </button>
            </div>
          </form>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // MENU ADD / EDIT MODAL
  // =====================================================
  
  interface MenuModalProps {
    open: boolean;
    editingMenu: HeaderMenu | null;
    loading: boolean;
    onClose: () => void;
    onSubmit: (
      payload: MenuForm
    ) => void;
  }
  
  const MenuModal: React.FC<
    MenuModalProps
  > = ({
    open,
    editingMenu,
    loading,
    onClose,
    onSubmit,
  }) => {
    const [title, setTitle] =
      useState("");
  
    const [status, setStatus] =
      useState(true);
  
    const [type, setType] =
      useState("menu");
  
    useEffect(() => {
      if (!open) return;
  
      setTitle(
        editingMenu?.title || ""
      );
  
      setStatus(
        editingMenu?.status ?? true
      );
  
      setType("menu");
    }, [open, editingMenu]);
  
    if (!open) return null;
  
    const handleSubmit = (
      event: React.FormEvent
    ) => {
      event.preventDefault();
  
      if (!title.trim()) {
        toast.error(
          "Menu title is required."
        );
        return;
      }
  
      onSubmit({
        title: title.trim(),
        status,
        type,
      });
    };
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[480px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
          <div className="flex items-start justify-between border-b border-[#b8902e]/10 px-5 py-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e]">
                  {editingMenu ? (
                    <FiEdit3 size={15} />
                  ) : (
                    <FiPlus size={15} />
                  )}
                </div>
  
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9a741b]">
                  Header Menu
                </span>
              </div>
  
              <h2 className="text-lg font-bold text-[#29251f]">
                {editingMenu
                  ? "Edit Menu"
                  : "Add Menu"}
              </h2>
            </div>
  
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
            >
              <FiX size={16} />
            </button>
          </div>
  
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Menu Title *
                </label>
  
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Contact Us"
                  className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm font-medium text-[#29251f] outline-none focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />
              </div>
  
              <div className="rounded-xl border border-[#b8902e]/10 bg-[#fbfaf7] p-3">
                <div className="flex items-center gap-2">
                  <FiLink
                    size={14}
                    className="text-[#b8902e]"
                  />
  
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                    Generated Slug
                  </span>
                </div>
  
                <div className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-xs font-semibold text-[#8f6d1d]">
                  {slugify(title) ||
                    "menu-slug"}
                </div>
              </div>
  
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Type
                </label>
  
                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm font-medium text-[#29251f] outline-none focus:border-[#b8902e] focus:bg-white"
                >
                  <option value="menu">
                    Menu
                  </option>
  
                  <option value="link">
                    Link
                  </option>
  
                  <option value="dropdown">
                    Dropdown
                  </option>
                </select>
              </div>
  
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Status
                </label>
  
                <button
                  type="button"
                  onClick={() =>
                    setStatus(
                      (current) =>
                        !current
                    )
                  }
                  className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 ${
                    status
                      ? "border-[#b8902e]/25 bg-[#f8f3e5]"
                      : "border-[#d8d0c0] bg-[#faf8f3]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        status
                          ? "bg-[#b8902e]"
                          : "bg-[#999080]"
                      }`}
                    />
  
                    <span className="text-sm font-semibold text-[#4d463b]">
                      {status
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
  
                  <span className="text-[9px] font-bold uppercase text-[#8f6d1d]">
                    {status
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </button>
              </div>
            </div>
  
            <div className="flex flex-col-reverse gap-2 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] hover:bg-[#faf8f3]"
              >
                Cancel
              </button>
  
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : editingMenu ? (
                  <FiEdit3 size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
  
                {loading
                  ? "Saving..."
                  : editingMenu
                  ? "Update Menu"
                  : "Add Menu"}
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
  
  interface DeleteModalProps {
    open: boolean;
    loading: boolean;
    menu: HeaderMenu | null;
    onClose: () => void;
    onConfirm: () => void;
  }
  
  const DeleteMenuModal: React.FC<
    DeleteModalProps
  > = ({
    open,
    loading,
    menu,
    onClose,
    onConfirm,
  }) => {
    if (!open || !menu) {
      return null;
    }
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] to-[#8a6c1f]" />
  
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff8f6] text-[#b46055]">
                <FiAlertTriangle
                  size={20}
                />
              </div>
  
              <div>
                <h2 className="text-lg font-bold text-[#29251f]">
                  Delete Menu
                </h2>
  
                <p className="mt-1 text-sm leading-6 text-[#786f60]">
                  Are you sure you want to delete{" "}
                  <strong>
                    {menu.title}
                  </strong>
                  ?
                </p>
              </div>
            </div>
  
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60]"
              >
                Cancel
              </button>
  
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[#a85348] px-5 py-2.5 text-sm font-bold text-white"
              >
                {loading ? (
                  <FiRefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <FiTrash2 size={14} />
                )}
  
                {loading
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // MAIN
  // =====================================================
  
  const HeaderManagement: React.FC =
    () => {
      const [menus, setMenus] =
        useState<HeaderMenu[]>([]);
  
      const [logoUrl, setLogoUrl] =
        useState<string | null>(null);
  
      const [faviconUrl, setFaviconUrl] =
        useState<string | null>(null);
  
      const [logoId, setLogoId] =
        useState<number | null>(null);
  
      const [loading, setLoading] =
        useState(false);
  
      const [search, setSearch] =
        useState("");
  
      const [
        statusFilter,
        setStatusFilter,
      ] = useState<
        "all" | "active" | "inactive"
      >("all");
  
      const [
        currentPage,
        setCurrentPage,
      ] = useState(1);
  
      const [
        menuModalOpen,
        setMenuModalOpen,
      ] = useState(false);
  
      const [
        editingMenu,
        setEditingMenu,
      ] =
        useState<HeaderMenu | null>(
          null
        );
  
      const [savingMenu, setSavingMenu] =
        useState(false);
  
      const [
        brandingModalOpen,
        setBrandingModalOpen,
      ] = useState(false);
  
      const [
        brandingLoading,
        setBrandingLoading,
      ] = useState(false);
  
      const [
        deleteOpen,
        setDeleteOpen,
      ] = useState(false);
  
      const [
        deleteLoading,
        setDeleteLoading,
      ] = useState(false);
  
      const [
        selectedMenu,
        setSelectedMenu,
      ] =
        useState<HeaderMenu | null>(
          null
        );
  
      const ITEMS_PER_PAGE = 7;
  
      // =================================================
      // GET HEADER
      // =================================================
  
      const fetchHeader = async () => {
        try {
          setLoading(true);
  
          const response =
            await headerApi.getAll();
  
          if (response.data.success) {
            const header =
              response.data.data;
  
            setMenus(
              header?.menus || []
            );
  
            setLogoUrl(
              header?.logo?.logo ||
                null
            );
  
            setFaviconUrl(
              header?.logo
                ?.favicon || null
            );
  
            setLogoId(
              header?.logo?.id ?? null
            );
          } else {
            toast.error(
              response.data.message ||
                "Unable to fetch header."
            );
          }
        } catch (error: any) {
          console.error(
            "Fetch header error:",
            error
          );
  
          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to fetch header."
          );
        } finally {
          setLoading(false);
        }
      };
  
      useEffect(() => {
        fetchHeader();
      }, []);
  
      // =================================================
      // HOME
      // =================================================
  
      const homeMenu = useMemo(
        () =>
          menus.find(
            (menu) =>
              menu.title
                .trim()
                .toLowerCase() ===
              "home"
          ),
        [menus]
      );
  
      const otherMenus = useMemo(
        () =>
          menus.filter(
            (menu) =>
              menu.id !==
              homeMenu?.id
          ),
        [menus, homeMenu]
      );
  
      // =================================================
      // FILTER
      // =================================================
  
      const filteredMenus =
        useMemo(() => {
          const query =
            search
              .trim()
              .toLowerCase();
  
          return otherMenus
            .filter((menu) => {
              const matchesSearch =
                !query ||
                [
                  menu.title,
                  menu.slug,
                  String(menu.id),
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(query);
  
              if (!matchesSearch) {
                return false;
              }
  
              if (
                statusFilter ===
                "active"
              ) {
                return menu.status;
              }
  
              if (
                statusFilter ===
                "inactive"
              ) {
                return !menu.status;
              }
  
              return true;
            })
            .sort(
              (a, b) =>
                a.sort_order -
                b.sort_order
            );
        }, [
          otherMenus,
          search,
          statusFilter,
        ]);
  
      // =================================================
      // PAGINATION
      // =================================================
  
      const totalPages = Math.max(
        1,
        Math.ceil(
          filteredMenus.length /
            ITEMS_PER_PAGE
        )
      );
  
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;
  
      const paginatedMenus =
        filteredMenus.slice(
          startIndex,
          startIndex +
            ITEMS_PER_PAGE
        );
  
      const startEntry =
        filteredMenus.length === 0
          ? 0
          : startIndex + 1;
  
      const endEntry = Math.min(
        startIndex +
          ITEMS_PER_PAGE,
        filteredMenus.length
      );
  
      useEffect(() => {
        if (
          currentPage >
          totalPages
        ) {
          setCurrentPage(totalPages);
        }
      }, [
        currentPage,
        totalPages,
      ]);
  
      const paginationPages =
        useMemo(() => {
          if (totalPages <= 5) {
            return Array.from(
              {
                length: totalPages,
              },
              (_, index) =>
                index + 1
            );
          }
  
          if (currentPage <= 3) {
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
      // ADD
      // =================================================
  
      const openAddMenu =
        () => {
          setEditingMenu(null);
          setMenuModalOpen(true);
        };
  
      // =================================================
      // EDIT OTHER MENU
      // =================================================
  
      const openEditMenu = (
        menu: HeaderMenu
      ) => {
        // Home is permanent
        if (
          menu.title
            .trim()
            .toLowerCase() ===
          "home"
        ) {
          setBrandingModalOpen(
            true
          );
          return;
        }
  
        setEditingMenu(menu);
        setMenuModalOpen(true);
      };
  
      // =================================================
      // ADD / UPDATE MENU
      // =================================================
  
      const handleSaveMenu =
        async (
          payload: MenuForm
        ) => {
          try {
            setSavingMenu(true);
  
            const response =
              editingMenu
                ? await headerApi.updateMenu(
                    editingMenu.id,
                    payload
                  )
                : await headerApi.addMenu(
                    payload
                  );
  
            if (
              response.data.success
            ) {
              toast.success(
                response.data.message ||
                  (editingMenu
                    ? "Menu updated successfully."
                    : "Menu added successfully.")
              );
  
              setMenuModalOpen(
                false
              );
  
              setEditingMenu(null);
  
              await fetchHeader();
            } else {
              toast.error(
                response.data.message ||
                  "Unable to save menu."
              );
            }
          } catch (error: any) {
            console.error(
              "Save menu error:",
              error
            );
  
            toast.error(
              error?.response?.data
                ?.message ||
                "Unable to save menu."
            );
          } finally {
            setSavingMenu(false);
          }
        };
  
      // =================================================
      // UPDATE BRANDING
      // =================================================
  
      const handleBrandingUpdate =
        async (
          payload: BrandingForm
        ) => {
          if (!logoId) {
            toast.error(
              "Header branding ID not found."
            );
            return;
          }
  
          try {
            setBrandingLoading(
              true
            );
  
            const response =
              await headerApi.updateBranding(
                logoId,
                {
                  logo: payload.logo,
                  favicon:
                    payload.favicon,
                }
              );
  
            if (
              response.data.success
            ) {
              toast.success(
                response.data.message ||
                  "Header branding updated successfully."
              );
  
              setBrandingModalOpen(
                false
              );
  
              await fetchHeader();
            } else {
              toast.error(
                response.data.message ||
                  "Unable to update branding."
              );
            }
          } catch (error: any) {
            console.error(
              "Branding update error:",
              error
            );
  
            toast.error(
              error?.response?.data
                ?.message ||
                "Unable to update branding."
            );
          } finally {
            setBrandingLoading(
              false
            );
          }
        };
  
      // =================================================
      // DELETE
      // =================================================
  
      const openDelete =
        (menu: HeaderMenu) => {
          // Home cannot be deleted
          if (
            menu.title
              .trim()
              .toLowerCase() ===
            "home"
          ) {
            toast.error(
              "Home menu is permanent and cannot be deleted."
            );
            return;
          }
  
          setSelectedMenu(menu);
          setDeleteOpen(true);
        };
  
      const handleDelete =
        async () => {
          if (!selectedMenu) {
            return;
          }
  
          try {
            setDeleteLoading(
              true
            );
  
            const response =
              await headerApi.deleteMenu(
                selectedMenu.id
              );
  
            if (
              response.data.success
            ) {
              toast.success(
                response.data.message ||
                  "Menu deleted successfully."
              );
  
              setMenus((current) =>
                current.filter(
                  (menu) =>
                    menu.id !==
                    selectedMenu.id
                )
              );
  
              setDeleteOpen(false);
              setSelectedMenu(null);
            } else {
              toast.error(
                response.data.message ||
                  "Unable to delete menu."
              );
            }
          } catch (error: any) {
            console.error(
              "Delete menu error:",
              error
            );
  
            toast.error(
              error?.response?.data
                ?.message ||
                "Unable to delete menu."
            );
          } finally {
            setDeleteLoading(
              false
            );
          }
        };
  

      return (
        <>
          <motion.div
            variants={
              containerVariants
            }
            initial="hidden"
            animate="visible"
            className={`min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-6`}
          >
            {/* HEADER */}
  
            <motion.div
              variants={
                itemVariants
              }
              className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center"
            >
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
  
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
                    Website Configuration
                  </span>
                </div>
  
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-[27px] font-bold tracking-tight text-[#29251f] sm:text-[30px]">
                    Header Management
                  </h1>
  
                  <span className="rounded-full border border-[#b8902e]/15 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                    Home + Navigation
                  </span>
                </div>
  
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#8d8372]">
                  Manage your permanent Home header,
                  website branding and navigation menus.
                </p>
              </div>
  
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    fetchHeader
                  }
                  disabled={loading}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] shadow-sm hover:bg-[#faf8f3] disabled:opacity-50"
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
                    openAddMenu
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 hover:from-[#a98227] hover:to-[#7e6017]"
                >
                  <FiPlus size={15} />
  
                  Add Menu
                </button>
              </div>
            </motion.div>
  
            {/* BRANDING */}
  
            <motion.div
              variants={
                itemVariants
              }
              className="mb-5 overflow-hidden rounded-[20px] border border-[#b8902e]/12 bg-white shadow-[0_6px_24px_rgba(70,55,20,0.035)]"
            >
              <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                    <FiImage size={17} />
                  </div>
  
                  <div>
                    <h2 className="text-sm font-bold text-[#29251f]">
                      Header Branding
                    </h2>
  
                    <p className="text-[10px] text-[#a19583]">
                      Current website logo and favicon
                    </p>
                  </div>
                </div>
  
                <button
                  type="button"
                  onClick={() =>
                    setBrandingModalOpen(
                      true
                    )
                  }
                  className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] px-4 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                >
                  <FiEdit3 size={13} />
  
                  Update Branding
                </button>
              </div>
  
              <div className="grid grid-cols-1 gap-3 border-t border-[#b8902e]/10 bg-[#fbfaf7] p-3 sm:grid-cols-2">
                {/* LOGO */}
  
                <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                  <div className="flex h-[70px] w-[130px] items-center justify-center overflow-hidden rounded-lg border border-[#b8902e]/10 bg-[#faf8f3] p-2">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Website Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <FiImage
                        size={22}
                        className="text-[#b9ae99]"
                      />
                    )}
                  </div>
  
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                      Website Logo
                    </p>
  
                    <p className="mt-1 text-xs font-bold text-[#403a30]">
                      Main Header Logo
                    </p>
  
                    <span className="mt-2 inline-flex rounded-full bg-[#faf8f3] px-2 py-1 text-[8px] font-bold text-[#8f6d1d]">
                      Active
                    </span>
                  </div>
                </div>
  
                {/* FAVICON */}
  
                <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                  <div className="flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-lg border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt="Website Favicon"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <FiGlobe
                        size={22}
                        className="text-[#b9ae99]"
                      />
                    )}
                  </div>
  
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                      Website Favicon
                    </p>
  
                    <p className="mt-1 text-xs font-bold text-[#403a30]">
                      Browser Tab Icon
                    </p>
  
                    <span className="mt-2 inline-flex rounded-full bg-[#faf8f3] px-2 py-1 text-[8px] font-bold text-[#8f6d1d]">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
  
            {/* MENU CARD */}
  
            <motion.div
              variants={
                itemVariants
              }
              className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
            >
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
  
              {/* TOOLBAR */}
  
              <div className="border-b border-[#b8902e]/10 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-[480px]">
                    <FiSearch
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                    />
  
                    <input
                      type="text"
                      value={search}
                      onChange={(
                        event
                      ) => {
                        setSearch(
                          event.target
                            .value
                        );
  
                        setCurrentPage(
                          1
                        );
                      }}
                      placeholder="Search menu title, slug or ID..."
                      className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-xs text-[#29251f] outline-none placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                    />
                  </div>
  
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        key: "all" as const,
                        label: "All",
                      },
                      {
                        key: "active" as const,
                        label: "Active",
                      },
                      {
                        key: "inactive" as const,
                        label: "Inactive",
                      },
                    ].map(
                      (item) => (
                        <button
                          key={
                            item.key
                          }
                          type="button"
                          onClick={() => {
                            setStatusFilter(
                              item.key
                            );
                            setCurrentPage(
                              1
                            );
                          }}
                          className={`rounded-xl px-4 py-2.5 text-[10px] font-bold ${
                            statusFilter ===
                            item.key
                              ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md"
                              : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10"
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
  

              {/* DESKTOP */}
  
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead>
                    <tr className="bg-[#2f2a22]">
                      <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        #
                      </th>
  
                      <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Menu
                      </th>
  
                      <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Slug
                      </th>
  
                      <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Status
                      </th>
  
                      <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Actions
                      </th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {/* HOME FIRST */}
  
                    {homeMenu && (
                      <motion.tr
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="border-b border-[#b8902e]/10 bg-[#fffaf0]"
                      >
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4e8c7] text-xs font-bold text-[#8f6d1d]">
                            1
                          </span>
                        </td>
  
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                              <FiMenu
                                size={17}
                              />
                            </div>
  
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-[#29251f]">
                                  Home
                                </p>
  
                                <span className="rounded-full bg-[#f2e4bc] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#806319]">
                                  Permanent
                                </span>
                              </div>
  
                              <p className="mt-1 text-[10px] text-[#a89a7d]">
                                Main website home navigation
                              </p>
                            </div>
                          </div>
                        </td>
  
                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-white px-3 py-2 font-mono text-xs font-semibold text-[#4d463b]">
                            {homeMenu.slug}
                          </span>
                        </td>
  
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                              true
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            Active
                          </span>
                        </td>
  
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              title="Update Home Branding"
                              onClick={() =>
                                setBrandingModalOpen(
                                  true
                                )
                              }
                              className="flex h-9 items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-[#fffdf5] px-3 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                            >
                              <FiEdit3
                                size={14}
                              />
                              Update Branding
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )}
  
                    {/* OTHER MENUS */}
  
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-14 text-center"
                        >
                          <FiRefreshCw
                            size={22}
                            className="mx-auto animate-spin text-[#b8902e]"
                          />
  
                          <p className="mt-3 text-sm font-bold text-[#29251f]">
                            Loading menus...
                          </p>
                        </td>
                      </tr>
                    ) : paginatedMenus.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-14 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                              <FiMenu size={21} />
                            </div>
  
                            <p className="mt-3 text-sm font-bold text-[#29251f]">
                              No other menus found
                            </p>
  
                            <p className="mt-1 text-[10px] text-[#a89a7d]">
                              Add a new header menu to get started.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedMenus.map(
                        (
                          menu,
                          index
                        ) => (
                          <motion.tr
                            key={
                              menu.id
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
                            <td className="px-5 py-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                                {startIndex +
                                  index +
                                  2}
                              </span>
                            </td>
  
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#a47b20]">
                                  <FiMenu
                                    size={17}
                                  />
                                </div>
  
                                <div>
                                  <p className="text-sm font-bold text-[#29251f]">
                                    {
                                      menu.title
                                    }
                                  </p>
  
                                  <p className="mt-1 text-[10px] text-[#a89a7d]">
                                    Menu #
                                    {
                                      menu.id
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>
  
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <FiLink
                                  size={14}
                                  className="text-[#b8902e]"
                                />
  
                                <span className="rounded-lg bg-[#faf8f3] px-3 py-2 font-mono text-xs font-semibold text-[#4d463b]">
                                  {
                                    menu.slug
                                  }
                                </span>
                              </div>
                            </td>
  
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                                  menu.status
                                )}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
  
                                {menu.status
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
  
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* EDIT */}
  
                                <button
                                  type="button"
                                  title="Edit menu"
                                  onClick={() =>
                                    openEditMenu(
                                      menu
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#fffaf0] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                >
                                  <FiEdit3
                                    size={15}
                                  />
                                </button>
  
                                {/* DELETE */}
  
                                <button
                                  type="button"
                                  title="Delete menu"
                                  onClick={() =>
                                    openDelete(
                                      menu
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:border-[#b46055]/40 hover:bg-[#b46055] hover:text-white"
                                >
                                  <FiTrash2
                                    size={15}
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
  
              {/* MOBILE */}
  
              <div className="block lg:hidden">
                {/* HOME */}
  
                {homeMenu && (
                  <div className="border-b border-[#b8902e]/10 bg-[#fffaf0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                          <FiMenu
                            size={17}
                          />
                        </div>
  
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[#29251f]">
                              Home
                            </p>
  
                            <span className="rounded-full bg-[#f2e4bc] px-2 py-0.5 text-[8px] font-bold uppercase text-[#806319]">
                              Permanent
                            </span>
                          </div>
  
                          <p className="mt-1 font-mono text-[10px] text-[#a89a7d]">
                            {homeMenu.slug}
                          </p>
                        </div>
                      </div>
                    </div>
  
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8902e]/25 bg-[#f8f3e5] px-3 py-1.5 text-[10px] font-bold text-[#806319]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                        Active
                      </span>
  
                      <button
                        type="button"
                        onClick={() =>
                          setBrandingModalOpen(
                            true
                          )
                        }
                        className="flex h-9 items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-3 text-[10px] font-bold text-[#8f6d1d]"
                      >
                        <FiEdit3
                          size={14}
                        />
                        Update Branding
                      </button>
                    </div>
                  </div>
                )}
  
                {/* OTHER MENUS */}
  
                {paginatedMenus.length >
                0 ? (
                  paginatedMenus.map(
                    (
                      menu,
                      index
                    ) => (
                      <motion.div
                        key={
                          menu.id
                        }
                        variants={
                          itemVariants
                        }
                        className="border-b border-[#b8902e]/10 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf8f3] text-[#a47b20]">
                              <FiMenu
                                size={17}
                              />
                            </div>
  
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#29251f]">
                                {
                                  menu.title
                                }
                              </p>
  
                              <p className="mt-1 truncate font-mono text-[10px] text-[#a89a7d]">
                                {
                                  menu.slug
                                }
                              </p>
                            </div>
                          </div>
  
                          <span className="text-[9px] font-bold text-[#a89a7d]">
                            #
                            {startIndex +
                              index +
                              2}
                          </span>
                        </div>
  
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                              menu.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
  
                            {menu.status
                              ? "Active"
                              : "Inactive"}
                          </span>
  
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditMenu(
                                  menu
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#fffaf0] text-[#8f6d1d]"
                            >
                              <FiEdit3
                                size={14}
                              />
                            </button>
  
                            <button
                              type="button"
                              onClick={() =>
                                openDelete(
                                  menu
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055]"
                            >
                              <FiTrash2
                                size={14}
                              />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  )
                ) : (
                  <div className="flex flex-col items-center px-5 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                      <FiMenu size={22} />
                    </div>
  
                    <p className="mt-3 text-sm font-bold text-[#29251f]">
                      No other menus found
                    </p>
  
                    <p className="mt-1 text-[10px] text-[#a89a7d]">
                      Add a menu from the button above.
                    </p>
                  </div>
                )}
              </div>
  
              {/* PAGINATION */}
  
              {filteredMenus.length >
                0 && (
                <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4">
                  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p className="text-[10px] text-[#8b8171]">
                      Showing{" "}
                      <strong className="text-[#4a4436]">
                        {startEntry}
                      </strong>{" "}
                      to{" "}
                      <strong className="text-[#4a4436]">
                        {endEntry}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-[#4a4436]">
                        {
                          filteredMenus.length
                        }
                      </strong>
                    </p>
  
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (
                              page
                            ) =>
                              page -
                              1
                          )
                        }
                        disabled={
                          currentPage ===
                          1
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:opacity-30"
                      >
                        <FiChevronLeft
                          size={15}
                        />
                      </button>
  
                      {paginationPages.map(
                        (page) => (
                          <button
                            key={
                              page
                            }
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-[10px] font-bold ${
                              currentPage ===
                              page
                                ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white"
                                : "text-[#786f60] hover:bg-[#faf8f3]"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
  
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (
                              page
                            ) =>
                              page +
                              1
                          )
                        }
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:opacity-30"
                      >
                        <FiChevronRight
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
  
            <div className="h-4" />
          </motion.div>
  
          {/* BRANDING MODAL */}
  
          <BrandingModal
            open={
              brandingModalOpen
            }
            loading={
              brandingLoading
            }
            logoUrl={logoUrl}
            faviconUrl={
              faviconUrl
            }
            onClose={() => {
              if (
                brandingLoading
              )
                return;
  
              setBrandingModalOpen(
                false
              );
            }}
            onSubmit={
              handleBrandingUpdate
            }
          />
  
          {/* MENU MODAL */}
  
          <MenuModal
            open={
              menuModalOpen
            }
            editingMenu={
              editingMenu
            }
            loading={
              savingMenu
            }
            onClose={() => {
              if (savingMenu)
                return;
  
              setMenuModalOpen(
                false
              );
  
              setEditingMenu(null);
            }}
            onSubmit={
              handleSaveMenu
            }
          />
  
          {/* DELETE MODAL */}
  
          <DeleteMenuModal
            open={deleteOpen}
            loading={
              deleteLoading
            }
            menu={
              selectedMenu
            }
            onClose={() => {
              if (
                deleteLoading
              )
                return;
  
              setDeleteOpen(false);
              setSelectedMenu(
                null
              );
            }}
            onConfirm={
              handleDelete
            }
          />
        </>
      );
    };
  
  export default HeaderManagement;