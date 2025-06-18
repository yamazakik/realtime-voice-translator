import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./components/Button";
import { TextAreaDisplay } from "./components/TextAreaDisplay";
import { Spinner } from "./components/Spinner";
import { translateText } from "./services/geminiService";

// SpeechRecognition API type definitions
declare global {
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  type SpeechRecognitionErrorCode =
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }
  interface SpeechGrammar {
    src: string;
    weight: number;
  }
  var SpeechGrammar: {
    prototype: SpeechGrammar;
    new (): SpeechGrammar;
  };
  interface SpeechGrammarList {
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
  }
  var SpeechGrammarList: {
    prototype: SpeechGrammarList;
    new (): SpeechGrammarList;
  };
  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror:
      | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
      | null;
    onnomatch:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
      | null;
    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
      | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  }
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

const MAX_TEXT_ITEMS_FOR_DISPLAY = 3;
const DEBOUNCE_DELAY_MS = 750; // milliseconds for debounce

const MIN_TEXT_AREA_HEIGHT = 128; // Tailwind h-32 (128px)
const MAX_TEXT_AREA_HEIGHT = 512; // Tailwind h-128 (512px) - custom value
const HEIGHT_STEP = 32; // Approx h-8

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const FONT_STEP = 2;

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-6 h-6 ${className}`}
  >
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.041h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.041a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-6 h-6 ${className}`}
  >
    <path
      fillRule="evenodd"
      d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
      clipRule="evenodd"
    />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path
      fillRule="evenodd"
      d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"
      clipRule="evenodd"
    />
  </svg>
);

const splitIntoSentences = (text: string): string[] => {
  if (!text || !text.trim()) return [];
  const sentences = text.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g);
  return sentences
    ? sentences.map((s) => s.trim()).filter((s) => s.length > 0)
    : [text.trim()].filter((t) => t.length > 0);
};

const App: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isLoadingTranslation, setIsLoadingTranslation] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentSessionFinalTranscriptRef = useRef<string>("");
  const lastSubmittedTextForTranslationRef = useRef<string>("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayedJapaneseSegments, setDisplayedJapaneseSegments] = useState<
    string[]
  >([]);
  const [fullEnglishTranslation, setFullEnglishTranslation] =
    useState<string>("");
  const [displayedEnglishSentences, setDisplayedEnglishSentences] = useState<
    string[]
  >([]);

  const [textAreaHeight, setTextAreaHeight] = useState<number>(256);
  const [fontSize, setFontSize] = useState<number>(16);

  const increaseHeight = () =>
    setTextAreaHeight((h) => Math.min(MAX_TEXT_AREA_HEIGHT, h + HEIGHT_STEP));
  const decreaseHeight = () =>
    setTextAreaHeight((h) => Math.max(MIN_TEXT_AREA_HEIGHT, h - HEIGHT_STEP));
  const increaseFontSize = () =>
    setFontSize((s) => Math.min(MAX_FONT_SIZE, s + FONT_STEP));
  const decreaseFontSize = () =>
    setFontSize((s) => Math.max(MIN_FONT_SIZE, s - FONT_STEP));

  const executeTranslation = useCallback(async (textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      if (
        lastSubmittedTextForTranslationRef.current === textToTranslate ||
        !lastSubmittedTextForTranslationRef.current
      ) {
        setFullEnglishTranslation("");
        setIsLoadingTranslation(false); // Ensure loading is stopped
      }
      return;
    }

    lastSubmittedTextForTranslationRef.current = textToTranslate;
    setIsLoadingTranslation(true);
    setError(null); // Clear previous errors before new attempt

    try {
      const translation = await translateText(
        textToTranslate,
        "English",
        "日本語",
      );
      if (lastSubmittedTextForTranslationRef.current === textToTranslate) {
        setFullEnglishTranslation(translation);
        setError(null);
      }
    } catch (err: any) {
      console.error("翻訳エラー:", err);
      if (lastSubmittedTextForTranslationRef.current === textToTranslate) {
        setError(err.message || "翻訳中にエラーが発生しました。");
      }
    } finally {
      if (lastSubmittedTextForTranslationRef.current === textToTranslate) {
        setIsLoadingTranslation(false);
      }
    }
  }, []); // Dependencies: setFullEnglishTranslation, setError, setIsLoadingTranslation

  const triggerTranslationDebounced = useCallback(
    (textToTranslate: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (!textToTranslate.trim()) {
        // If there's truly no text to translate (final is empty, interim is empty)
        // clear translation display and any loading state.
        if (
          !currentSessionFinalTranscriptRef.current.trim() &&
          !interimTranscript.trim()
        ) {
          setFullEnglishTranslation("");
          setIsLoadingTranslation(false);
        }
        return;
      }
      debounceTimerRef.current = setTimeout(() => {
        executeTranslation(textToTranslate);
      }, DEBOUNCE_DELAY_MS);
    },
    [executeTranslation, interimTranscript],
  );

  useEffect(() => {
    if (!fullEnglishTranslation.trim()) {
      setDisplayedEnglishSentences([]);
      return;
    }
    const sentences = splitIntoSentences(fullEnglishTranslation);
    setDisplayedEnglishSentences(sentences.slice(-MAX_TEXT_ITEMS_FOR_DISPLAY));
  }, [fullEnglishTranslation]);

  const handleStartListening = useCallback(() => {
    if (
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      setError(
        "お使いのブラウザは音声認識をサポートしていません。Chromeの使用をお勧めします。",
      );
      return;
    }
    setDisplayedJapaneseSegments([]);
    setFullEnglishTranslation("");
    setInterimTranscript("");
    setError(null);
    currentSessionFinalTranscriptRef.current = "";
    lastSubmittedTextForTranslationRef.current = "";
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja-JP";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterimFromEvent = "";
      let newFinalPieceFromEvent = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const segmentTranscript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalPieceFromEvent += segmentTranscript;
        } else {
          currentInterimFromEvent += segmentTranscript;
        }
      }
      const trimmedInterim = currentInterimFromEvent.trim();
      setInterimTranscript(trimmedInterim);

      if (newFinalPieceFromEvent) {
        const newFinalSegment = newFinalPieceFromEvent.trim();
        if (newFinalSegment) {
          currentSessionFinalTranscriptRef.current += newFinalSegment + " ";
          setDisplayedJapaneseSegments((prevSegments) => {
            const updatedSegments = [...prevSegments, newFinalSegment];
            return updatedSegments.slice(-MAX_TEXT_ITEMS_FOR_DISPLAY);
          });
        }
      }
      const fullFinalTranscriptForTranslation =
        currentSessionFinalTranscriptRef.current.trim();
      const textToTranslate = (
        fullFinalTranscriptForTranslation +
        (trimmedInterim
          ? (fullFinalTranscriptForTranslation ? " " : "") + trimmedInterim
          : "")
      ).trim();

      if (textToTranslate) {
        triggerTranslationDebounced(textToTranslate);
      } else {
        // If textToTranslate is empty (e.g. only silence detected and finalized)
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        setFullEnglishTranslation("");
        setIsLoadingTranslation(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript(""); // Clear interim transcript on stop
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const finalTranscriptForSession =
        currentSessionFinalTranscriptRef.current.trim();
      if (
        finalTranscriptForSession &&
        finalTranscriptForSession !== lastSubmittedTextForTranslationRef.current
      ) {
        executeTranslation(finalTranscriptForSession);
      } else if (!finalTranscriptForSession) {
        setFullEnglishTranslation("");
        setIsLoadingTranslation(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("音声認識エラー:", event.error, event.message);
      let errorMessage = `音声認識エラー: ${event.error}.`;
      if (event.error === "network")
        errorMessage = "ネットワークエラー。接続を確認してください。";
      else if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      )
        errorMessage = "マイクアクセスが許可されていません。";
      else if (event.error === "no-speech")
        errorMessage = "音声が検出されませんでした。";
      setError(errorMessage);
      setIsListening(false);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setIsLoadingTranslation(false); // Stop loading if error occurs
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    recognition.start();
  }, [executeTranslation, triggerTranslationDebounced]); // Added triggerTranslationDebounced

  const handleStopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // This will trigger 'onend'
    }
    // 'onend' handles clearing debounce and final translation
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const japaneseTextForDisplay =
    displayedJapaneseSegments.join(" ") +
    (interimTranscript
      ? (displayedJapaneseSegments.length > 0 ? " " : "") + interimTranscript
      : "");
  const englishTextForDisplay = displayedEnglishSentences.join(" ");
  const currentDynamicStyle = {
    height: `${textAreaHeight}px`,
    fontSize: `${fontSize}px`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-100 flex flex-col items-center p-4 selection:bg-indigo-500 selection:text-white">
      <header className="w-full max-w-4xl text-center my-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          リアルタイム音声翻訳
        </h1>
        <p className="text-slate-400 mt-2">
          日本語の音声を文字起こしし、英語に翻訳します。（直近 約
          {MAX_TEXT_ITEMS_FOR_DISPLAY}文表示）
        </p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center space-y-6">
        <div className="w-full flex justify-center">
          <Button
            onClick={isListening ? handleStopListening : handleStartListening}
            variant={isListening ? "secondary" : "primary"}
            className="px-8 py-4 text-lg font-semibold shadow-xl transform transition-transform hover:scale-105"
            icon={
              isListening ? (
                <StopIcon className="mr-2" />
              ) : (
                <MicIcon className="mr-2" />
              )
            }
            disabled={isListening && isLoadingTranslation && !interimTranscript} // Allow stopping even if loading, unless actively transcribing
          >
            {isListening
              ? isLoadingTranslation
                ? "翻訳中..."
                : "翻訳停止"
              : "翻訳開始"}
          </Button>
        </div>

        {error && (
          <div
            className="w-full bg-red-700/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg shadow-md"
            role="alert"
          >
            <strong className="font-bold">エラー: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="w-full max-w-2xl flex flex-col sm:flex-row justify-around items-center space-y-4 sm:space-y-0 sm:space-x-2 my-2 p-4 bg-slate-800/60 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium text-sm">
              表示枠の高さ:
            </span>
            <Button
              onClick={decreaseHeight}
              className="p-1.5"
              aria-label="表示枠を縮小"
              disabled={textAreaHeight <= MIN_TEXT_AREA_HEIGHT}
              variant="secondary"
            >
              <MinusIcon />
            </Button>
            <span className="text-slate-200 w-12 text-center text-sm tabular-nums">
              {Math.round(textAreaHeight / 16)} rem
            </span>
            <Button
              onClick={increaseHeight}
              className="p-1.5"
              aria-label="表示枠を拡大"
              disabled={textAreaHeight >= MAX_TEXT_AREA_HEIGHT}
              variant="secondary"
            >
              <PlusIcon />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium text-sm">
              文字の大きさ:
            </span>
            <Button
              onClick={decreaseFontSize}
              className="p-1.5"
              aria-label="文字を縮小"
              disabled={fontSize <= MIN_FONT_SIZE}
              variant="secondary"
            >
              <MinusIcon />
            </Button>
            <span className="text-slate-200 w-12 text-center text-sm tabular-nums">
              {fontSize}px
            </span>
            <Button
              onClick={increaseFontSize}
              className="p-1.5"
              aria-label="文字を拡大"
              disabled={fontSize >= MAX_FONT_SIZE}
              variant="secondary"
            >
              <PlusIcon />
            </Button>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextAreaDisplay
            label="日本語の文字起こし"
            text={japaneseTextForDisplay}
            placeholder="ここに日本語の文字起こし結果が表示されます..."
            dynamicStyle={currentDynamicStyle}
          />
          <div className="relative">
            <TextAreaDisplay
              label="英語への翻訳結果"
              text={englishTextForDisplay}
              placeholder="ここに英語への翻訳結果が表示されます..."
              dynamicStyle={currentDynamicStyle}
            />
            {isLoadingTranslation && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/70 rounded-lg">
                <Spinner />
                <span className="ml-3 text-slate-300">翻訳中...</span>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="w-full max-w-4xl text-center text-slate-500 mt-12 pb-8">
        <p>
          &copy; {new Date().getFullYear()} 音声翻訳アプリ. Powered by Gemini
          API & Web Speech API.
        </p>
      </footer>
    </div>
  );
};

export default App;
