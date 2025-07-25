import React from "react";

export const GridBackground = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-slate-950">
      {/* Radial gradient for the central glow */}
      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e52,transparent)]"></div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundImage:
            "linear-gradient(to right, #2d2d3a 1px, transparent 1px), linear-gradient(to bottom, #2d2d3a 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      ></div>
    </div>
  );
};
