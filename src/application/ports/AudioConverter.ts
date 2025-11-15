export interface AudioConvertParams {
  bitrate?: string;
  channels?: number;
  inputFilePath: string;
  outputFilePath: string;
  sampleRate?: number;
  format?: string;
}

export interface AudioConverter {
  convert(params: AudioConvertParams): Promise<void>;
}
