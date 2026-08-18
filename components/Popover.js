"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Renders its children into document.body instead of in place. A dropdown
// or calendar positioned inside a card that also uses backdrop-blur can
// never visually appear above a LATER card on the page — backdrop-blur
// creates its own stacking context, so z-index only wins within that one
// card. Escaping to the body sidesteps the whole problem.
export default function Popover({ open, onClose, anchorRef, matchWidth, children }) {
  const [rect, setRect] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined;
    function updateRect() {
      setRect(anchorRef.current.getBoundingClientRect());
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(e) {
      if (
        anchorRef.current &&
        !anchorRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !rect || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: matchWidth ? rect.width : undefined,
      }}
      className="z-50"
    >
      {children}
    </div>,
    document.body
  );
}
