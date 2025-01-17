import { GithubSignIn } from "@/components/github-sign-in";
import Link from "next/link";

const Error = async () => {
  return (
    <>
      <div
        className=" items-start justify-between"
        style={{ textAlign: "center" }}
      >
        <h1 className="font-bold"> 404 </h1>
        <h3> User not found! </h3>
        <small className="font-bold">
          {" "}
          Did you forget your password chielf?{" "}
        </small>
        <small className="font-bold">
          ...we do not support password resets yet
        </small>
        <GithubSignIn />
        <Link
          href="/"
          className="inline-block bg-gray-100 hover:bg-gray-800 text-black py-1 px-4 rounded transition duration-300"
        >
          Back
        </Link>
      </div>
    </>
  );
};

export default Error;
