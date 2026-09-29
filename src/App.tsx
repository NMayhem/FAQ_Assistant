import { useState } from "react";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { Character } from "./components/Character";
import { faq } from "./data/knowledge";
import { findAnswer } from "./utils/findAnswer";

import "./App.css";

const COLLAPSED_SIZE = new LogicalSize(360, 360);
const EXPANDED_SIZE = new LogicalSize(460, 520);

function App() {
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(faq.CONFIG.welcome);
  const [animation, setAnimation] = useState<
    "idle" | "talking" | "error"
  >("idle");

  async function toggleExpanded() {
    const nextExpanded = !expanded;

    if (nextExpanded) {
      // Mount the expanded UI first.
      setExpanded(true);

      // Give React one frame to render the bubble.
      await new Promise((resolve) =>
        requestAnimationFrame(resolve),
      );

      // Now resize the native window.
      await getCurrentWindow().setSize(EXPANDED_SIZE);
    } else {
      // Resize first, then remove the expanded UI.
      await getCurrentWindow().setSize(COLLAPSED_SIZE);

      setExpanded(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = findAnswer(question, faq.KNOWLEDGE);

    if (result) {
      setAnswer(result);
      setAnimation("talking");
    } else {
      setAnswer(faq.CONFIG.invalid);
      setAnimation("error");
    }

    setQuestion("");
  }

  return (
    <main className={`app ${expanded ? "expanded" : "collapsed"}`}>
      {expanded && (
        <div className="speech-bubble">
          <p>{answer}</p>

          <form onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Escribe tu pregunta..."
              autoFocus
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
