/** Segments keep phrases intact; middots stay at segment ends so lines never start with · */
export function LandingTagline({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <p id={id} className={`bk-meta bk-landing-tagline ${className}`.trim()}>
      <span className="bk-tagline-chunk">50×70&nbsp;cm frame ·</span>{" "}
      <span className="bk-tagline-chunk">portrait or landscape ·</span>{" "}
      <span className="bk-tagline-chunk">brass, matte black or brushed steel</span>
    </p>
  );
}
