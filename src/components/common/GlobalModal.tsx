import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GlobalModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
}

const GlobalModal: React.FC<GlobalModalProps> = ({
  isOpen,
  children,
  onClose,
  closeOnOverlayClick = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Prevent click propagation from child elements to overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && onClose) {
      onClose();
    }
  };

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
      }}
      onClick={handleOverlayClick}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        className="relative z-[1000000] flex w-full items-center justify-center pointer-events-none"
        style={{
          maxHeight: "100vh",
          padding: "1rem",
        }}
      >
        <div className="pointer-events-auto w-full max-w-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GlobalModal;