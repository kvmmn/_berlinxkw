/** Segments keep phrases intact; middots stay at segment ends so lines never start with · */
export function LandingTagline() {
  return (
    <p className="bk-meta bk-landing-tagline">
      <span className="bk-tagline-chunk">50×70&nbsp;cm frame ·</span>{" "}
      <span className="bk-tagline-chunk">portrait or landscape ·</span>{" "}
      <span className="bk-tagline-chunk">brass, matte black or brushed steel</span>
    </p>
  );
}
