import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RankingItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { User } from "lucide-react";

type RankingPeriod = "daily" | "weekly" | "monthly";

export default function StudentRankings() {
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>("weekly");
  
  const { data: rankings, isLoading, error } = useQuery({
    queryKey: [`/api/rankings/${rankingPeriod}`],
  });
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Top Students</h3>
          <p className="mt-1 text-sm text-gray-500">By participation points</p>
        </div>
        <div className="flex space-x-2">
          <RankingButton 
            period="daily"
            currentPeriod={rankingPeriod}
            onClick={() => setRankingPeriod("daily")}
          />
          <RankingButton 
            period="weekly"
            currentPeriod={rankingPeriod}
            onClick={() => setRankingPeriod("weekly")}
          />
          <RankingButton 
            period="monthly"
            currentPeriod={rankingPeriod}
            onClick={() => setRankingPeriod("monthly")}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center">Loading rankings...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">Failed to load rankings</div>
      ) : rankings?.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No ranking data available</div>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden">
          {rankings?.map((item: RankingItem, index: number) => (
            <li key={item.ranking.id} className="px-4 py-4 flex items-center">
              <span className="w-6 text-center font-semibold text-gray-500">#{index + 1}</span>
              <div className="ml-4 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                {item.user.avatarUrl ? (
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={item.user.avatarUrl} 
                    alt={`${item.user.fullName}'s profile`}
                  />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{item.user.fullName}</p>
                <p className="text-sm text-gray-500">{item.user.username}</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-900">{item.ranking.totalPoints}</span>
                <span className="ml-1 text-xs text-gray-500">pts</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Link href="/rankings">
          <Button className="bg-primary-600 hover:bg-primary-700">
            View Full Rankings
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface RankingButtonProps {
  period: RankingPeriod;
  currentPeriod: RankingPeriod;
  onClick: () => void;
}

function RankingButton({ period, currentPeriod, onClick }: RankingButtonProps) {
  const isActive = period === currentPeriod;
  
  return (
    <button
      className={`px-3 py-1 ${
        isActive 
          ? "bg-primary-100 text-xs font-medium text-primary-700" 
          : "bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200"
      } rounded-md focus:outline-none`}
      onClick={onClick}
    >
      {period.charAt(0).toUpperCase() + period.slice(1)}
    </button>
  );
}
