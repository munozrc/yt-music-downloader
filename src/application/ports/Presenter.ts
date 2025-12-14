export interface TrackSelectionOption {
  videoId: string;
  title: string;
  artists: string;
}

export interface Presenter {
  /**
   * Shows a list of tracks and lets the user select one
   * @returns The selected track or null if cancelled
   */
  selectTrack(
    options: TrackSelectionOption[]
  ): Promise<TrackSelectionOption | null>;
}
