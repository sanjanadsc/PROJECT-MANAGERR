import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import { format, isPast } from 'date-fns'

const StatCard = ({ label, value, color, icon }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  </div>
)

const StatusBadge = ({ status, dueDate }) => {
  const isOverdue = dueDate && isPast(new Date(dueDate)) && status !== 'DONE'
  if (isOverdue) return <span className="badge-overdue">Overdue</span>
  if (status === 'TODO') return <span className="badge-todo">To Do</span>
  if (status === 'IN_PROGRESS') return <span className="badge-in-progress">In Progress</span>
  if (status === 'DONE') return <span className="badge-done">Done</span>
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/tasks/dashboard')
        setStats(res.data.stats)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  const completionRate = stats?.totalTasks > 0
    ? Math.round((stats.doneCount / stats.totalTasks) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Here's what's happening with your tasks today.</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats?.totalTasks || 0}
          color="bg-sky-500/10"
          icon={<svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgressCount || 0}
          color="bg-amber-500/10"
          icon={<svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Completed"
          value={stats?.doneCount || 0}
          color="bg-emerald-500/10"
          icon={<svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Overdue"
          value={stats?.overdueTasks || 0}
          color="bg-red-500/10"
          icon={<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Overall Completion</h3>
          <span className="text-sm font-bold text-sky-400">{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{stats?.todoCount || 0} to do</span>
          <span>{stats?.inProgressCount || 0} in progress</span>
          <span>{stats?.doneCount || 0} done</span>
        </div>
      </div>

      {/* recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recent Tasks</h3>
          <Link to="/my-tasks" className="text-sm text-sky-400 hover:text-sky-300">
            View all →
          </Link>
        </div>

        {!stats?.recentTasks?.length ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 text-sm">No tasks yet</p>
            <Link to="/projects" className="text-sky-400 text-sm hover:text-sky-300 mt-1 inline-block">
              Go to projects →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {task.dueDate && (
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  <StatusBadge status={task.status} dueDate={task.dueDate} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}