export interface AudioConvertParams {
  inputFilePath: string;
  outputFilePath: string;
  bitrate?: string;
  channels?: number;
  sampleRate?: number;
  format?: string;
}

export interface AudioConverter {
  convert(params: AudioConvertParams): Promise<void>;
}
