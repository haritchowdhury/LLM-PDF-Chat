"use client";
//import { Button } from "@/components/ui/button";
import { FaXTwitter } from "react-icons/fa6";

import Link from "next/link";

const Footer = () => {
  return (
    <footer
      className="bg-white gap-4  text-white flex justify-center border-t border-gray-200"
      style={{
        position: "relative",
        bottom: 0,
        left: 0,
        width: "100%",
        padding: "1rem", // Optional: Adjust spacing
        //boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Optional: Adds a shadow
      }}
    >
      <small className="inline-block bg-gray-300 hover:bg-gray-800 text-black font-semibold px-4 py-1 rounded transition duration-300">
        <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfGNiD5AspNDsQIoUHhWDjDGH6qlmMtwqWiPhPgOwkEikIyew/viewform?usp=header">
          Join Aiversity-beta
        </Link>
      </small>
      <Link href="https://x.com/Ainiversity">
        <FaXTwitter className="text-xl text-gray-900" />
      </Link>
    </footer>
  );
};

export { Footer };
