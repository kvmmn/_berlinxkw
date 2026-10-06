/** Reels container still processing when polling deadline is reached (avoid duplicate publish). */

export class ReelsStillProcessingError extends Error {
  readonly containerId: string;

  constructor(containerId: string) {
    super(
      `Reels container ${containerId} is still processing on Instagram. Retry the same publish with this containerId when status is FINISHED or PUBLISHED — do not create a new container.`,
    );
    this.name = "ReelsStillProcessingError";
    this.containerId = containerId;
  }
}
