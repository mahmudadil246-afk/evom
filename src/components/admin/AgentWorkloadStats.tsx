import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MessageSquare, 
  Tag, 
  CheckCircle, 
  Circle,
  TrendingUp,
} from "lucide-react";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";

export function AgentWorkloadStats() {
  const { agentMetrics, summary, isLoading } = useAgentMetrics();

  if (isLoading) {
    return (
      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const maxAssigned = Math.max(...agentMetrics.map((a) => a.totalAssigned), 1);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Agents", value: summary.totalAgents, icon: Users, bg: "bg-primary/10", color: "text-primary" },
          { label: "Online", value: summary.onlineAgents, icon: Circle, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600", fill: "fill-green-600" },
          { label: "Total Assigned", value: summary.totalAssigned, icon: Tag, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600" },
          { label: "Resolved Today", value: summary.resolvedToday, icon: TrendingUp, bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color} ${stat.fill || ""}`} />
              </div>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Workload</CardTitle>
          <CardDescription>
            Assigned chats and tickets per agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No agents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agentMetrics.map((agent) => {
                const workloadPercent = (agent.totalAssigned / maxAssigned) * 100;
                
                return (
                  <div key={agent.user_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={agent.avatar_url || undefined} />
                            <AvatarFallback>
                              {(agent.full_name || agent.email || "A").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span 
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                              agent.isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {agent.full_name || agent.email || "Agent"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {agent.assignedChats} chats
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {agent.assignedTickets} tickets
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {agent.totalAssigned} assigned
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs text-emerald-600 border-emerald-300"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {agent.resolvedToday} today
                        </Badge>
                      </div>
                    </div>
                    <Progress value={workloadPercent} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
