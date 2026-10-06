/** Reels container still processing when polling deadline is reached (avoid duplicate publish). */

export class ReelsStillProcessingError extends Error {
  readonly containerId: string;

  constructor(containerId: string) {
    super(
      `Reels container ${containerId} is still processing on Instagram. Check status later; do not create a duplicate publish.`,
    );
    this.name = "ReelsStillProcessingError";
    this.containerId = containerId;
  }
}
