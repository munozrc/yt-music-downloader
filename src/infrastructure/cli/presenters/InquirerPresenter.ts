import inquirer from "inquirer";

import type {
  Presenter,
  TrackSelectionOption,
} from "../../../application/ports/Presenter.js";

export class InquirerPresenter implements Presenter {
  /**
   * Shows a list of tracks and lets the user select one
   * @returns The selected track or null if cancelled
   */
  async selectTrack(
    options: TrackSelectionOption[]
  ): Promise<TrackSelectionOption | null> {
    if (options.length === 0) {
      return null;
    }

    const choices = options.map((track, idx) => ({
      name: `${track.title} - ${track.artists}`,
      value: idx,
    }));

    const { selected } = await inquirer.prompt([
      {
        type: "rawlist",
        name: "selected",
        message: "Select a track to download:",
        choices,
      },
    ]);

    return options[selected] ?? null;
  }
}
