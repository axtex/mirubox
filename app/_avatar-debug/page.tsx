import { AvatarGlyph } from "@/components/avatar/AvatarGlyph";

export default function AvatarDebugPage() {
  return (
    <div style={{ background: "#0f0f12", minHeight: "100vh", padding: 40 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 2,
          border: "2px solid #2a2a2d",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <AvatarGlyph seed="test-seed" size={56} />
      </div>
    </div>
  );
}
