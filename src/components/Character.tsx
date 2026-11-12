
import { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { getCurrentWindow } from "@tauri-apps/api/window";

import idleAnimation from "../assets/anim/idle.json";
import talkingAnimation from "../assets/anim/hablando.json";
import errorAnimation from "../assets/anim/error.json";
import restingAnimation from "../assets/anim/reposo.json";
import sleepingAnimation from "../assets/anim/zzz.json";
import wakingAnimation from "../assets/anim/despertar.json";

interface CharacterProps {
  animation?: "idle" | "talking" | "error";
  onClick?: () => void;
}

type ActivityState = "idle" | "reposo" | "zzz" | "despertar";

const IDLE_TIMEOUT = 80_000;

const animations = {
  idle: idleAnimation,
  talking: talkingAnimation,
  error: errorAnimation,
  reposo: restingAnimation,
  zzz: sleepingAnimation,
  despertar: wakingAnimation,
};

export function Character({
  animation = "idle",
  onClick,
}: CharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  const [activity, setActivity] = useState<ActivityState>("idle");
  const [externalFinished, setExternalFinished] = useState(false);

  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const pendingClick = useRef(false);

  // Reset internal activity when App requests a new animation.
  useEffect(() => {
    setActivity("idle");
    setExternalFinished(false);
    pendingClick.current = false;
  }, [animation]);

  // Determine which animation should be displayed.
  const isExternalActive =
    animation !== "idle" && !externalFinished;

  const currentAnimation = isExternalActive
    ? animation
    : activity;

  // Idle -> Rest after 90 seconds.
  useEffect(() => {
    if (isExternalActive || activity !== "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActivity("reposo");
    }, IDLE_TIMEOUT);

    return () => window.clearTimeout(timeout);
  }, [activity, isExternalActive]);

  // Load and manage the current Lottie animation.
  useEffect(() => {
    if (!containerRef.current) return;

    animationRef.current?.destroy();

    const instance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: !["talking", "error", "reposo", "despertar"].includes(
        currentAnimation,
      ),
      autoplay: true,
      animationData: animations[currentAnimation],
    });

    animationRef.current = instance;

    instance.addEventListener("complete", () => {
      if (currentAnimation === "reposo") {
        setActivity("zzz");
      }

      if (currentAnimation === "despertar") {
        setActivity("idle");

        if (pendingClick.current) {
          pendingClick.current = false;
          onClick?.();
        }
      }

      if (
        currentAnimation === "talking" ||
        currentAnimation === "error"
      ) {
        setExternalFinished(true);
      }
    });

    return () => {
      instance.destroy();

      if (animationRef.current === instance) {
        animationRef.current = null;
      }
    };
  }, [currentAnimation, onClick]);

  function handleMouseDown(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (event.button !== 0) return;

    pointerStart.current = {
      x: event.screenX,
      y: event.screenY,
    };

    dragged.current = false;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  async function handleMouseMove(event: MouseEvent) {
    if (!pointerStart.current) return;

    const dx = event.screenX - pointerStart.current.x;
    const dy = event.screenY - pointerStart.current.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5 && !dragged.current) {
      dragged.current = true;

      try {
        await getCurrentWindow().startDragging();
      } catch (error) {
        console.error("Could not drag window:", error);
      }
    }
  }

  function handleMouseUp() {
    const wasDragged = dragged.current;
    const wasSleeping = currentAnimation === "zzz";

    pointerStart.current = null;
    dragged.current = false;

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    // Do not interrupt the waking animation.
    if (currentAnimation === "despertar") {
      return;
    }

    if (wasDragged) {
      if (!wasSleeping && animation === "idle") {
        setActivity("idle");
      }

      return;
    }

    // Wake up first, then notify App.
    if (wasSleeping) {
      pendingClick.current = true;
      setActivity("despertar");
      console.log("CHARACTER WAKE CLICK");
      return;
    }

    // Reset inactivity when clicking during idle or rest.
    if (animation === "idle") {
      setActivity("idle");
    }

    console.log("CHARACTER CLICK");
    onClick?.();
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: "grab",
      }}
    />
  );
}
