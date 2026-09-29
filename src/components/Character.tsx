import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { getCurrentWindow } from "@tauri-apps/api/window";

import idleAnimation from "../assets/anim/idle.json";
import talkingAnimation from "../assets/anim/hablando.json";
import errorAnimation from "../assets/anim/sin-respuesta.json";

interface CharacterProps {
  animation?: "idle" | "talking" | "error";
  onClick?: () => void;
}

const animations = {
  idle: idleAnimation,
  talking: talkingAnimation,
  error: errorAnimation,
};

export function Character({
  animation = "idle",
  onClick,
}: CharacterProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    animationRef.current?.destroy();

    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: animation !== "error",
      autoplay: true,
      animationData: animations[animation],
    });

    return () => {
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [animation]);

  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  function handleMouseDown(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (event.button !== 0) {
      return;
    }

    pointerStart.current = {
      x: event.screenX,
      y: event.screenY,
    };

    dragged.current = false;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  async function handleMouseMove(event: MouseEvent) {
    if (!pointerStart.current) {
      return;
    }

    const dx = event.screenX - pointerStart.current.x;
    const dy = event.screenY - pointerStart.current.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5 && !dragged.current) {
      dragged.current = true;

      await getCurrentWindow().startDragging();
    }
  }

  function handleMouseUp() {
    const wasDragged = dragged.current;

    pointerStart.current = null;
    dragged.current = false;

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    if (!wasDragged) {
      onClick?.();
    }
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
