import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Target, Plus, Calendar, CheckCircle2, Clock, 
  Sparkles, CheckSquare, Square, Flag, X, ArrowRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal, Task, BusinessPlan } from '../../types';

export const GoalsPlansView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, createGoal, 
    updateGoalProgress, createTask, updateTaskStatus 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'goals' | 'tasks'>('goals');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // New Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTarget, setGoalTarget] = useState(100);
  const [goalUnit, setGoalUnit] = useState('Orders');
  const [goalDeadline, setGoalDeadline] = useState('');

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskAssignee, setTaskAssignee] = useState(currentUser.id);

  const goals = useMemo(() => {
    return state.goals.filter(g => g.companyId === currentCompany.id);
  }, [state.goals, currentCompany.id]);

  const tasks = useMemo(() => {
    return state.tasks.filter(t => t.companyId === currentCompany.id);
  }, [state.tasks, currentCompany.id]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    createGoal({
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      type: 'Custom',
      target: goalTarget,
      unit: goalUnit,
      deadline: goalDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'Active'
    });
    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalDescription('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const assigneeUser = state.users.find(u => u.id === taskAssignee);
    createTask({
      title: taskTitle.trim(),
      description: '',
      assignedMemberId: taskAssignee,
      assignedMemberName: assigneeUser ? assigneeUser.name : currentUser.name,
      assignedTo: taskAssignee,
      assignedToName: assigneeUser ? assigneeUser.name : currentUser.name,
      deadline: taskDueDate || new Date().toISOString().split('T')[0],
      dueDate: taskDueDate || new Date().toISOString().split('T')[0],
      priority: taskPriority,
      status: 'To Do'
    });
    setIsTaskModalOpen(false);
    setTaskTitle('');
  };

  const handleIncrementGoal = (goal: Goal, amount: number) => {
    const nextVal = Math.max(0, goal.current + amount);
    updateGoalProgress(goal.id, nextVal);
    if (nextVal >= goal.target && goal.current < goal.target) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-600" />
            <span>Goals, Roadmaps & Team Execution</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Set quarterly milestones, track completion rates, and assign team action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'goals' ? (
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Goal</span>
            </button>
          ) : (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white rounded-2xl border border-rose-100 w-fit">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'goals' ? 'bg-rose-500 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Milestone Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tasks' ? 'bg-rose-500 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Team Tasks ({tasks.length})
        </button>
      </div>

      {/* GOALS TAB */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const isDone = pct >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{goal.title}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{goal.description}</p>
                    </div>
                    {isDone ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Reached!
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                        {pct}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-rose-50 overflow-hidden p-0.5 border border-rose-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                      <span>Target Date: {goal.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="pt-3 border-t border-rose-50 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-stone-400">Quick adjust:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleIncrementGoal(goal, -5)}
                      className="px-2.5 py-1 rounded-lg border border-rose-100 hover:bg-rose-50 text-xs text-stone-600 font-bold"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleIncrementGoal(goal, 1)}
                      className="px-2.5 py-1 rounded-lg border border-rose-100 hover:bg-rose-50 text-xs text-stone-600 font-bold"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleIncrementGoal(goal, 5)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs text-rose-700 font-bold"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Task Checklist</h3>

          <div className="divide-y divide-rose-50 text-xs">
            {tasks.map(task => {
              const isCompleted = task.status === 'Completed';

              return (
                <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateTaskStatus(task.id, isCompleted ? 'To Do' : 'Completed')}
                      className={`p-1 rounded-lg transition-colors ${
                        isCompleted ? 'text-emerald-600' : 'text-stone-300 hover:text-stone-500'
                      }`}
                    >
                      {isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>

                    <div>
                      <p className={`font-semibold ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] text-stone-400">
                        Assigned to: <strong className="text-stone-600">{task.assignedMemberName || task.assignedToName || 'Unassigned'}</strong> • Due: {task.deadline || task.dueDate}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Create New Milestone Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g. Reach 200 Atelier Glow Orders"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={goalDescription}
                  onChange={e => setGoalDescription(e.target.value)}
                  placeholder="Strategy or context for the team..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Target Number *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={goalTarget}
                    onChange={e => setGoalTarget(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    value={goalUnit}
                    onChange={e => setGoalUnit(e.target.value)}
                    placeholder="Orders, MAD, Clients..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Deadline</label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Assign Team Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit low-stock serums and contact supplier"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Assign To</label>
                  <select
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                  >
                    {state.users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
