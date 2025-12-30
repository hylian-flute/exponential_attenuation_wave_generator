import { createSignal, For, Show } from "solid-js";
import { generateWaveFile } from "./services/wave";

function App() {
  const MAX_LOWEST_OVERTONE = 6;

  const [urls, setUrls] = createSignal<Map<string, string>>(new Map());

  const fileName = (lowestOvertone: number, onlyOddOvertone: boolean) => {
    return `exp_attenuation-${lowestOvertone}${
      onlyOddOvertone ? "-odd" : ""
    }.wav`;
  };

  const onClickGenerate = () => {
    const newMap: Map<string, string> = new Map();
    for (
      let lowestOvertone = 1;
      lowestOvertone <= MAX_LOWEST_OVERTONE;
      ++lowestOvertone
    ) {
      for (let onlyOddOvertone of [false, true]) {
        const name = fileName(lowestOvertone, onlyOddOvertone);
        if (onlyOddOvertone && lowestOvertone % 2 === 0) {
          continue;
        }
        const waveFile = generateWaveFile(lowestOvertone, onlyOddOvertone);
        const blob = new Blob([waveFile], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        newMap.set(name, url);
      }
    }
    setUrls(newMap);
  };

  return (
    <>
      <button onClick={onClickGenerate}>生成</button>
      <Show when={urls().size > 0}>
        <table>
          <thead>
            <tr>
              <th>最低倍音</th>
              <th>偶数倍音あり</th>
              <th>奇数倍音のみ</th>
            </tr>
          </thead>
          <tbody>
            <For
              each={Array.from({ length: MAX_LOWEST_OVERTONE }).map(
                (_, i) => i
              )}
            >
              {(i) => (
                <tr>
                  <th>{i + 1}</th>
                  <For each={[false, true]}>
                    {(onlyOddOvertone) => (
                      <td>
                        {urls().has(fileName(i + 1, onlyOddOvertone)) ? (
                          <a
                            href={urls().get(fileName(i + 1, onlyOddOvertone))}
                            download={fileName(i + 1, onlyOddOvertone)}
                          >
                            {fileName(i + 1, onlyOddOvertone)}
                          </a>
                        ) : (
                          <></>
                        )}
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </>
  );
}

export default App;
