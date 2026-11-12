
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Character } from "./components/Character";

import {
  bundledKnowledge,
  loadKnowledge,
} from "./data/loadKnowledge";

import type { Knowledge } from "./utils/types";

import { findAnswer } from "./utils/findAnswer";

import "./App.css";

function App() {
  // Dialog visibility.
  const [expanded, setExpanded] = useState(false);
  const [visibleBubble, setVisibleBubble] = useState(false);

  // Keep the current state accessible inside callbacks.
  const expandedRef = useRef(false);

  // Fade-out timer.
  const bubbleTimer = useRef<number | null>(null);

  // Knowledge database.
  const [knowledge, setKnowledge] = useState<Knowledge>(
    bundledKnowledge
  );

  // Chat state.
  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState(
    bundledKnowledge.CONFIG.welcome
  );

  const [animation, setAnimation] = useState<
    "idle" | "talking" | "error"
  >("idle");

  // Load external knowledge on startup.
  useEffect(() => {
    let active = true;

    async function initializeKnowledge() {
      try {
        const data = await loadKnowledge();

        if (!active) return;

        setKnowledge(data);
        setAnswer(data.CONFIG.welcome);

        console.log("EDI knowledge loaded successfully.");

      } catch (error) {
        console.error(
          "Could not load external knowledge:",
          error
        );

        if (!active) return;

        // Use bundled knowledge as fallback.
        setKnowledge(bundledKnowledge);
        setAnswer(bundledKnowledge.CONFIG.welcome);
      }
    }

    initializeKnowledge();

    return () => {
      active = false;
    };
  }, []);

  // Clean up pending timers.
  useEffect(() => {
    return () => {
      if (bubbleTimer.current !== null) {
        window.clearTimeout(bubbleTimer.current);
      }
    };
  }, []);

  // Toggle speech bubble.
  const toggleExpanded = useCallback(() => {
    // Cancel any pending fade-out.
    if (bubbleTimer.current !== null) {
      window.clearTimeout(bubbleTimer.current);
      bubbleTimer.current = null;
    }

    const nextExpanded = !expandedRef.current;

    expandedRef.current = nextExpanded;
    setExpanded(nextExpanded);

    if (nextExpanded) {
      // Show bubble.
      setVisibleBubble(true);
    } else {
      // Wait for fade-out before unmounting.
      bubbleTimer.current = window.setTimeout(() => {
        setVisibleBubble(false);
        bubbleTimer.current = null;
      }, 250);
    }
  }, []);

  // Process submitted questions.
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const result = findAnswer(
      question,
      knowledge.KNOWLEDGE
    );

    if (result) {
      setAnswer(result);
      setAnimation("talking");
    } else {
      setAnswer(knowledge.CONFIG.invalid);
      setAnimation("error");
    }

    setQuestion("");
  }

  return (
    <main
      className={`app ${
        expanded ? "expanded" : "collapsed"
      }`}
    >
      {visibleBubble && (
        <div className={`speech-bubble ${
            expanded ? "bubble-enter" : "bubble-exit"
          }`}>
          <p>{answer}</p>

          <form onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Escribe tu pregunta..."
              autoFocus={expanded}
            />
          </form>
        </div>
      )}

      <div className="character">
        <Character
          animation={animation}
          onClick={toggleExpanded}
        />
      </div>
    </main>
  );
}

export default App;
