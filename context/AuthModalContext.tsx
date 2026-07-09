"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface AuthModalOptions {
  reason?: string;
  callbackUrl?: string;
}

interface AuthModalContextValue {
  isOpen: boolean;
  options: AuthModalOptions;
  openAuthModal: (opts: AuthModalOptions) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AuthModalOptions>({});

  const value = useMemo<AuthModalContextValue>(
    () => ({
      isOpen,
      options,
      openAuthModal: (opts) => {
        setOptions(opts);
        setIsOpen(true);
      },
      closeAuthModal: () => setIsOpen(false),
    }),
    [isOpen, options]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return {
    openAuthModal: ctx.openAuthModal,
    closeAuthModal: ctx.closeAuthModal,
    isOpen: ctx.isOpen,
  };
}

export function useAuthModalState() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModalState must be used within an AuthModalProvider");
  return ctx;
}
