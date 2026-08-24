/**
 * Static data source for the "Neighborhood signals" card — weather and local
 * demand cues the shop can act on today.
 */

export type NeighborhoodSignal = {
  key: string;
  emoji: string;
  /** "4-7 PM — heavy rain likely." */
  text: string;
};

export type NeighborhoodSignalsData = {
  heading: string;
  temperature: number;
  /** "Light rain forecast · Kumbalgudu" */
  condition: string;
  signals: NeighborhoodSignal[];
  /** Highlighted call-out at the foot of the card. */
  tip: string;
};

export const emptyNeighborhoodSignals = (): NeighborhoodSignalsData => ({
  heading: "",
  temperature: 0,
  condition: "",
  signals: [],
  tip: "",
});

export const getNeighborhoodSignals =
  async (): Promise<NeighborhoodSignalsData> =>
    Promise.resolve({
      heading: "Neighborhood signals",
      temperature: 28,
      condition: "Light rain forecast · Kumbalgudu",
      signals: [
        { key: "rain", emoji: "🌧️", text: "4-7 PM — heavy rain likely." },
        {
          key: "clubEvents",
          emoji: "🎉",
          text: "3 CLUB events near your shop tonight — more foot traffic 6-9 PM.",
        },
      ],
      tip: "⚡ Runner surge on after 3 PM — dispatch orders early for base rates.",
    });
