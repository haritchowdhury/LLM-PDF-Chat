import { SignOut } from "@/components/sign-out";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
const Header = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <header
      className="bg-black text-white"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000, // Ensures it stays on top of other elements
        //borderBottom: "1px solid #ddd", // Optional: Adds a subtle border
        padding: "1rem", // Optional: Adjust spacing
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Optional: Adds a shadow
      }}
    >
      <SignOut />
    </header>
  );
};
export { Header };
