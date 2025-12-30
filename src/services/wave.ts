const SAMPLE_RATE = 44100;
const WINDOW_SIZE = 2048;
const KEYFRAME_COUNTS = 64;
const MAX_OVERTONE = 1000; // 20Hzで鳴らしたとき1000倍音が20kHzなのでこれ以上は意味がない

/** 与えられた波形データからwavファイルを生成する */
function writeWaveFile(audioData: number[]) {
  const numChannels = 1; // モノラル
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = audioData.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  // RIFFヘッダー
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmtチャンク
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmtチャンクサイズ
  view.setUint16(20, 1, true); // PCMフォーマット
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // dataチャンク
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // 音声データの書き込み
  let offset = 44;
  for (const sample of audioData) {
    view.setInt16(offset, sample * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function generateAudioData(lowestOvertone: number, onlyOddOvertone: boolean) {
  const audioData: number[] = [];
  for (let keyframeIdx = 1; keyframeIdx <= KEYFRAME_COUNTS; ++keyframeIdx) {
    const param = keyframeIdx / KEYFRAME_COUNTS;
    const window = Array.from({ length: WINDOW_SIZE }).map(() => 0);
    for (let overtoneIdx = 1; overtoneIdx <= MAX_OVERTONE; ++overtoneIdx) {
      const amplitude =
        overtoneIdx >= lowestOvertone &&
        (overtoneIdx % 2 === 1 || !onlyOddOvertone)
          ? 1 / (-Math.log(-param + 1) + 1) ** (overtoneIdx - lowestOvertone)
          : 0;
      for (let t = 0; t < WINDOW_SIZE; ++t) {
        window[t] +=
          amplitude * Math.sin((2 * Math.PI * overtoneIdx * t) / WINDOW_SIZE);
      }
    }
    const maxAbs = window.reduce((max, cur) => Math.max(max, Math.abs(cur)), 0);
    for (let t = 0; t < WINDOW_SIZE; ++t) {
      audioData.push(window[t] / maxAbs);
    }
  }
  return audioData;
}

export function generateWaveFile(
  lowestOvertone: number,
  onlyOddOvertone: boolean
) {
  const audioData = generateAudioData(lowestOvertone, onlyOddOvertone);
  return writeWaveFile(audioData);
}
