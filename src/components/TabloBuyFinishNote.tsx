import type { ReactNode } from "react";
import { FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import type { FrameFinish, Tablo } from "@/lib/types";

export function TabloBuyFinishNote({
  tablo,
  finish,
  external,
}: {
  tablo: Tablo;
  finish: FrameFinish;
  external: boolean;
}) {
  const label = FRAME_FINISH_LABELS[finish];

  let body: ReactNode;
  if (external) {
    body = (
      <>
        If the shop link omits finish, choose {label.en} at checkout.
      </>
    );
  } else if (tablo.marketplaceUrl?.trim()) {
    body = <>Finish is in the link when supported — else note {label.en}.</>;
  } else {
    body = (
      <>
        DM @berlinxkw — finish: {label.en} (
        <span className="bk-text-fa" lang="fa">
          {label.fa}
        </span>
        ).
      </>
    );
  }

  return (
    <p className="bk-tablo-buy-note" aria-live="polite">
      {body}
    </p>
  );
}
