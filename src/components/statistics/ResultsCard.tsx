import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LucideLayoutDashboard } from "lucide-react";

type Props = { accuracy: number };

const ResultsCard = ({ accuracy }: Props) => {
  return (
    <Card className="md:col-span-7 border-none p-3 mb-2 bg-black text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <Award />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-3/5">
        {accuracy > 75 ? (
          <>
            <Trophy className="mr-4 w-6 h-6" stroke="gold" size={50} />
            <div className="flex flex-col text-lg font-semibold text-yellow-400">
              <span className="">Impressive!</span>
              <span className="text-sm text-center opacity-50">
                {"> 75% accuracy"}
              </span>
            </div>
          </>
        ) : accuracy > 25 ? (
          <>
            <Trophy className="mr-4 w-6 h-6" stroke="silver" size={50} />
            <div className="flex flex-col text-lg font-semibold text-stone-400">
              <span className="">Good job!</span>
              <span className="text-sm text-center  opacity-50">
                {"> 25% accuracy"}
              </span>
            </div>
          </>
        ) : (
          <>
            <Trophy className="mr-4 w-6 h-6" stroke="brown" size={50} />
            <div className="flex flex-col text-lg font-semibold text-yellow-800">
              <span className="">Nice try!</span>
              <span className="text-sm text-center opacity-50">
                {"< 25% accuracy"}
              </span>
            </div>
          </>
        )}
      </CardContent>
      <CardContent>
        <Link href="/" className={buttonVariants()}>
          <LucideLayoutDashboard className="mr-2" />
          Home
        </Link>
      </CardContent>
    </Card>
  );
};

export default ResultsCard;
