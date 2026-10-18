/** Segments keep phrases intact; middots stay at segment ends so lines never start with · */
export function LandingTagline({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <p id={id} className={`bk-meta bk-landing-tagline ${className}`.trim()}>
      <span className="bk-tagline-chunk">two sizes: 70×50 with mat · 40×30 ·</span>{" "}
      <span className="bk-tagline-chunk">portrait or landscape ·</span>{" "}
      <span className="bk-tagline-chunk">brass frame</span>
    </p>
  );
}
