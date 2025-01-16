"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer
      className="bg-black text-white"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        padding: "1rem", // Optional: Adjust spacing
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Optional: Adds a shadow
      }}
    >
      <Link
        href="https://github.com/iminparallel"
        className="inline-block bg-gray-300 hover:bg-blue-600 text-black font-semibold py-2 px-4 rounded transition duration-300"
      >
        Harit Chowdhury
      </Link>
    </footer>
  );
};

export { Footer };
