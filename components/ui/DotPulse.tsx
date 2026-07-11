/** Three-dot loading indicator — pairs with `.status-notice`. */
export function DotPulse(): React.JSX.Element {
  return (
    <span className="dot-pulse" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
