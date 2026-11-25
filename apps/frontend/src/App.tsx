import { useState, useRef } from 'react';
import { parse } from 'partial-json';

export interface FashionItem {
  category?: string;
  description?: string;
  color?: string;
}

export interface PartialFashionCoordinate {
  title?: string;
  concept?: string;
  items?: FashionItem[];
  advice?: string;
}

// 動的プロンプト生成用の選択肢定義
const OPTIONS = {
  gender: [
    { label: "Men's", value: 'メンズ' },
    { label: "Women's", value: 'ウィメンズ' },
    { label: 'Unisex', value: 'ユニセックス' },
  ],
  season: ['春 (Spring)', '夏 (Summer)', '秋 (Autumn)', '冬 (Winter)'],
  scene: ['休日デート', 'オフィスカジュアル', '友達とカフェ・街歩き', 'ビジネスカジュアル', '旅行・アウトドア', '結婚式二次会・パーティー'],
  budget: ['1万円以内 (プチプラ)', '2〜3万円程度', '5万円前後', '上限なし (質重視)'],
  style: ['きれいめ・スマート', 'カジュアル', 'ストリート・オーバーサイズ', 'ミニマル・シンプル', 'トラッド・クラシック'],
};

export function App() {
  // 条件タグの状態管理
  const [selectedGender, setSelectedGender] = useState('メンズ');
  const [selectedSeason, setSelectedSeason] = useState('秋 (Autumn)');
  const [selectedScene, setSelectedScene] = useState('オフィスカジュアル');
  const [selectedBudget, setSelectedBudget] = useState('2〜3万円程度');
  const [selectedStyle, setSelectedStyle] = useState('きれいめ・スマート');
  
  // 自由記述用の追加リクエスト
  const [freeInput, setFreeInput] = useState('');

  const [coordinate, setCoordinate] = useState<PartialFashionCoordinate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);

  // 選択タグと自由記述からプロンプトを自動組み立て
  const buildPrompt = () => {
    let prompt = `対象: ${selectedGender}
季節: ${selectedSeason}
着用シーン: ${selectedScene}
テイスト: ${selectedStyle}
予算感: ${selectedBudget}`;

    if (freeInput.trim()) {
      prompt += `\n追加のご要望: ${freeInput.trim()}`;
    }

    return prompt;
  };

  const handleStartStream = () => {
    if (isGenerating) return;

    const fullPrompt = buildPrompt();

    setCoordinate(null);
    setErrorMessage('');
    setIsGenerating(true);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `http://127.0.0.1:3000/ai/coordinate-stream?prompt=${encodeURIComponent(fullPrompt)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    let accumulatedJsonText = '';

    es.onmessage = (event) => {
      try {
        const parsedEvent = JSON.parse(event.data);

        if (parsedEvent.error) {
          setErrorMessage(parsedEvent.error);
          es.close();
          setIsGenerating(false);
          return;
        }

        if (parsedEvent.chunk) {
          accumulatedJsonText += parsedEvent.chunk;
          try {
            const partialParsed = parse(accumulatedJsonText) as PartialFashionCoordinate;
            setCoordinate(partialParsed);
          } catch {
            // 受信初期などパースできない極小チャンクは待機
          }
        }
      } catch (err) {
        console.error('SSE Message Processing Error:', err);
      }
    };

    es.onerror = () => {
      es.close();
      setIsGenerating(false);
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-transparent blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 text-center md:text-left border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              Dynamic Prompt Builder
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              AI Fashion Stylist
            </h1>
          </div>
          <span className="text-xs text-slate-500 font-mono">v1.2.0 / Tag Selector</span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 左カラム: 条件選択フォーム */}
          <div className="lg:col-span-5 space-y-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
            {/* 1. 性別 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                カテゴリー
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
                {OPTIONS.gender.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setSelectedGender(g.value)}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedGender === g.value
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 季節 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                季節
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONS.season.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      selectedSeason === s
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 利用シーン */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                着用シーン
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONS.scene.map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setSelectedScene(sc)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      selectedScene === sc
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. スタイルテイスト */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                テイスト
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONS.style.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStyle(st)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      selectedStyle === st
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. 予算 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                予算感
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONS.budget.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBudget(b)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      selectedBudget === b
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 補足入力（任意） */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                細かいご要望・NG条件（任意）
              </label>
              <input
                type="text"
                value={freeInput}
                onChange={(e) => setFreeInput(e.target.value)}
                placeholder="例: スニーカー指定、黒ベースでまとめたい、など"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
              />
            </div>

            {/* 生成されるプロンプトのプレビュー表示 */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400">
              <span className="text-slate-600 block mb-1 font-sans font-semibold">生成プロンプトプレビュー:</span>
              <p className="whitespace-pre-line leading-relaxed text-indigo-200/80">{buildPrompt()}</p>
            </div>

            <button
              onClick={handleStartStream}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>コーデ案を生成中...</span>
                </>
              ) : (
                <span>設定条件で生成する</span>
              )}
            </button>
          </div>

          {/* 右カラム: カード表示エリア */}
          <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 min-h-[500px] shadow-xl relative">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-red-400 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={handleStartStream}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs font-semibold text-red-300 transition"
                >
                  再試行
                </button>
              </div>
            )}

            {coordinate ? (
              <div className="space-y-6">
                {coordinate.title && (
                  <div className="border-b border-slate-800/80 pb-5">
                    <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                      Suggested Look
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-3">{coordinate.title}</h2>
                    {coordinate.concept && (
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">{coordinate.concept}</p>
                    )}
                  </div>
                )}

                {coordinate.items && coordinate.items.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      構成アイテム
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {coordinate.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="group bg-slate-950/80 hover:bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 transition duration-200 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                                {item.category || 'アイテム'}
                              </span>
                              {item.color && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                  <span className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-indigo-400 transition" />
                                  {item.color}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-200 leading-snug">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {coordinate.advice && (
                  <div className="bg-gradient-to-r from-indigo-950/40 to-slate-950 p-4 rounded-xl border border-indigo-500/20">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>着こなしのアドバイス</span>
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{coordinate.advice}</p>
                  </div>
                )}
              </div>
            ) : isGenerating ? (
              <div className="space-y-6 animate-pulse">
                <div className="space-y-3 border-b border-slate-800 pb-5">
                  <div className="h-5 bg-slate-800 rounded w-1/5" />
                  <div className="h-8 bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-800/60 rounded w-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800/40 rounded w-1/6" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-24 bg-slate-950 rounded-xl border border-slate-800/50" />
                    <div className="h-24 bg-slate-950 rounded-xl border border-slate-800/50" />
                    <div className="h-24 bg-slate-950 rounded-xl border border-slate-800/50" />
                    <div className="h-24 bg-slate-950 rounded-xl border border-slate-800/50" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
                  👔
                </div>
                <h3 className="text-slate-300 font-semibold mb-1">条件を選択してください</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  左のパネルで季節・シーン・予算を選択してボタンを押すと、AIが最適なコーデをリアルタイム生成します。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}