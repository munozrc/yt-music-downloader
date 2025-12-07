export interface AudioConvertParams {
  filename: string;
  inputFilePath: string;
  outputFolder: string;
  bitrate?: string;
  channels?: number;
  sampleRate?: number;
  format?: string;
}

export interface AudioConverter {
  convert(params: AudioConvertParams): Promise<string>;
  deleteTemporaryFile(filePath: string): Promise<void>;
}
