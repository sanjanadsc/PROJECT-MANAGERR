import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'

const StatusBadge = ({ status, dueDate }) => {
  const isOverdue = dueDate && isPast(new Date(dueDate)) && status !== 'DONE'
  if (isOverdue) return <span className="badge-overdue">Overdue</span>
  if (status === 'TODO') return <span className="badge-todo">To Do</span>
  if (status === 'IN_PROGRESS') return <span className="badge-in-progress">In Progress</span>
  if (status === 'DONE') return <span className="badge-done">Done</span>
  return null
}

const PriorityBadge = ({ priority }) => {
  if (priority === 'HIGH') return <span className="badge-high">High</span>
  if (priority === 'MEDIUM') return <span className="badge-medium">Medium</span>
  return <span className="badge-low">Low</span>
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks/my')
      setTasks(res.data.tasks)
    } catch (err) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      toast.success('Status updated')
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  const filtered = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-800 rounded w-32 animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-800" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {/* filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">All Priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {(filterStatus || filterPriority) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterPriority('') }}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-slate-400 font-medium">
            {tasks.length === 0 ? 'No tasks assigned to you yet' : 'No tasks match your filters'}
          </p>
          {tasks.length === 0 && (
            <Link to="/projects" className="text-sky-400 text-sm hover:text-sky-300 mt-2 inline-block">
              Browse projects →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'
            return (
              <div key={task.id} className={`card hover:border-slate-600 transition-colors ${isOverdue ? 'border-red-500/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-medium ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </h4>
                      <StatusBadge status={task.status} dueDate={task.dueDate} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <Link to={`/projects/${task.project?.id}`} className="flex items-center gap-1 hover:text-sky-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {task.project?.name}
                      </Link>
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 flex-shrink-0"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}