// ============================================================
// MARKETING SCHEDULER UI — Task management & execution dashboard
// ============================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Play, Square, RefreshCw, Clock, CheckCircle2, XCircle,
  Zap, Calendar, Mail, TrendingUp, Plus, Trash2, Settings,
} from "lucide-react";
import {
  getScheduledTasks,
  saveScheduledTask,
  deleteScheduledTask,
  getTaskExecutions,
  executeTask,
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  cronToReadable,
  calculateNextRun,
  type ScheduledTask,
  type TaskExecution,
} from "@/services/marketingScheduler";

export default function MarketingSchedulerUI() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [running, setRunning] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);

  // New task form
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskType, setNewTaskType] = useState<ScheduledTask["type"]>("social_post");
  const [newTaskCron, setNewTaskCron] = useState("0 10 * * *");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  useEffect(() => {
    refreshData();
    setRunning(isSchedulerRunning());
  }, []);

  const refreshData = () => {
    setTasks(getScheduledTasks());
    setExecutions(getTaskExecutions().slice(-20).reverse());
  };

  const handleToggleScheduler = () => {
    if (running) {
      stopScheduler();
      setRunning(false);
    } else {
      startScheduler();
      setRunning(true);
    }
  };

  const handleToggleTask = (task: ScheduledTask) => {
    task.enabled = !task.enabled;
    task.updated_at = new Date().toISOString();
    if (task.enabled) {
      task.next_run = calculateNextRun(task.cron_expression);
    }
    saveScheduledTask(task);
    refreshData();
  };

  const handleRunNow = async (task: ScheduledTask) => {
    setExecutingTaskId(task.id);
    try {
      await executeTask(task);
    } catch (error) {
      console.error("Task execution failed:", error);
    }
    setExecutingTaskId(null);
    refreshData();
  };

  const handleDeleteTask = (taskId: string) => {
    deleteScheduledTask(taskId);
    refreshData();
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;

    const task: ScheduledTask = {
      id: `task-${Date.now()}`,
      type: newTaskType,
      name: newTaskName,
      description: newTaskDescription || `Custom ${newTaskType} task`,
      cron_expression: newTaskCron,
      cron_readable: cronToReadable(newTaskCron),
      enabled: true,
      run_count: 0,
      error_count: 0,
      next_run: calculateNextRun(newTaskCron),
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveScheduledTask(task);
    setShowNewTask(false);
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskCron("0 10 * * *");
    refreshData();
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "social_post": return <Calendar className="h-4 w-4 text-blue-400" />;
      case "email_digest": return <Mail className="h-4 w-4 text-green-400" />;
      case "engagement_refresh": return <TrendingUp className="h-4 w-4 text-purple-400" />;
      case "review_auto_post": return <Zap className="h-4 w-4 text-yellow-400" />;
      default: return <Settings className="h-4 w-4 text-gray-400" />;
    }
  };

  const getExecutionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="text-green-400 border-green-400/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-red-400 border-red-400/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "running":
        return <Badge variant="outline" className="text-blue-400 border-blue-400/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scheduler Control */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Marketing Scheduler
              </CardTitle>
              <CardDescription>Automated marketing tasks running on schedule</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={running ? "default" : "secondary"} className={running ? "bg-green-600" : ""}>
                {running ? "Running" : "Stopped"}
              </Badge>
              <Button
                onClick={handleToggleScheduler}
                variant={running ? "destructive" : "default"}
                size="sm"
              >
                {running ? (
                  <><Square className="h-4 w-4 mr-1" /> Stop</>
                ) : (
                  <><Play className="h-4 w-4 mr-1" /> Start</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Task List */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Scheduled Tasks</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNewTask(!showNewTask)}>
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* New Task Form */}
          {showNewTask && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-purple-500/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Task Name</Label>
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="e.g., Daily Product Spotlight"
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <Label>Task Type</Label>
                  <Select value={newTaskType} onValueChange={(v) => setNewTaskType(v as ScheduledTask["type"])}>
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_post">Social Post</SelectItem>
                      <SelectItem value="email_digest">Email Digest</SelectItem>
                      <SelectItem value="engagement_refresh">Engagement Refresh</SelectItem>
                      <SelectItem value="review_auto_post">Review Auto-Post</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Cron Expression</Label>
                <Input
                  value={newTaskCron}
                  onChange={(e) => setNewTaskCron(e.target.value)}
                  placeholder="0 10 * * *"
                  className="bg-slate-700 border-purple-500/30 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">{cronToReadable(newTaskCron)}</p>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="What does this task do?"
                  className="bg-slate-700 border-purple-500/30 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateTask} className="gradient-steel">
                  Create Task
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewTask(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Task Items */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-lg bg-slate-800/50 border border-transparent hover:border-purple-500/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getTaskIcon(task.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{task.name}</h4>
                      <Badge variant="outline" className="text-xs">{task.type.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-sm text-gray-400">{task.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {task.cron_readable}
                      </span>
                      <span>Runs: {task.run_count}</span>
                      {task.error_count > 0 && (
                        <span className="text-red-400">Errors: {task.error_count}</span>
                      )}
                      {task.last_run && (
                        <span>Last: {new Date(task.last_run).toLocaleString()}</span>
                      )}
                      {task.next_run && task.enabled && (
                        <span className="text-blue-400">
                          Next: {new Date(task.next_run).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {task.last_error && (
                      <p className="text-xs text-red-400 mt-1">Last error: {task.last_error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={task.enabled}
                    onCheckedChange={() => handleToggleTask(task)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRunNow(task)}
                    disabled={executingTaskId === task.id}
                    title="Run Now"
                  >
                    {executingTaskId === task.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Execution History</CardTitle>
            <Button size="sm" variant="ghost" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No executions yet</p>
              <p className="text-xs text-gray-500 mt-1">Run a task or start the scheduler to see history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {executions.map((exec) => (
                <div key={exec.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{exec.task_name}</span>
                      {getExecutionStatusBadge(exec.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(exec.started_at).toLocaleString()}</span>
                      {exec.duration_ms !== undefined && (
                        <span>{exec.duration_ms < 1000 ? `${exec.duration_ms}ms` : `${(exec.duration_ms / 1000).toFixed(1)}s`}</span>
                      )}
                    </div>
                    {exec.result && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{exec.result}</p>
                    )}
                    {exec.error && (
                      <p className="text-xs text-red-400 mt-1 truncate">{exec.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
