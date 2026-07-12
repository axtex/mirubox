function SectionLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 9,
        color: "#5a5a65",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: "0 0 8px",
      }}
    >
      {children}
    </p>
  );
}

export { SectionLabel };
