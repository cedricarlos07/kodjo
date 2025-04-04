import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";

interface UserRanking {
  id: number;
  userId: number;
  attendancePoints: number;
  messagePoints: number;
  totalPoints: number;
  lastActivity: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  userName: string;
  userAvatar: string | null;
  courseName: string;
}

type PeriodType = "daily" | "weekly" | "monthly";

export function UserRankings() {
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const { isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  const { data: rankings, isLoading } = useQuery<UserRanking[]>({
    queryKey: [`/api/rankings/${period}`, { limit: 5 }],
    enabled: isAuthenticated,
  });

  return (
    <>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Top Utilisateurs</h3>
          <p className="mt-1 text-sm text-gray-500">Par points de participation</p>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={period === "daily" ? "default" : "secondary"}
            onClick={() => setPeriod("daily")}
            className={period === "daily" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700"}
          >
            Quotidien
          </Button>
          <Button
            size="sm"
            variant={period === "weekly" ? "default" : "secondary"}
            onClick={() => setPeriod("weekly")}
            className={period === "weekly" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700"}
          >
            Hebdomadaire
          </Button>
          <Button
            size="sm"
            variant={period === "monthly" ? "default" : "secondary"}
            onClick={() => setPeriod("monthly")}
            className={period === "monthly" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700"}
          >
            Mensuel
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-gray-200 overflow-hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="px-4 py-4 flex items-center">
              <span className="w-6 text-center font-semibold text-gray-500">#{i + 1}</span>
              <Skeleton className="ml-4 h-10 w-10 rounded-full" />
              <div className="ml-3 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
              <Skeleton className="h-5 w-16" />
            </li>
          ))
        ) : rankings && rankings.length > 0 ? (
          rankings.map((ranking, index) => (
            <li key={ranking.id} className="px-4 py-4 flex items-center">
              <span className="w-6 text-center font-semibold text-gray-500">#{index + 1}</span>
              <Avatar className="ml-4 h-10 w-10">
                <AvatarImage src={ranking.userAvatar || ""} alt={ranking.userName} />
                <AvatarFallback className="bg-primary-100 text-primary-600">
                  {ranking.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{ranking.userName}</p>
                <p className="text-sm text-gray-500">{ranking.courseName}</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-900">{ranking.totalPoints}</span>
                <span className="ml-1 text-xs text-gray-500">pts</span>
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-gray-500">
            Aucun classement d'utilisateurs disponible pour cette période.
          </li>
        )}
      </ul>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Button onClick={() => navigate("/rankings")}>
          Voir tous les classements
        </Button>
      </div>
    </>
  );
}