import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
        <h3 className="font-semibold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
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

const PriorityBadge = ({ priority }) => {
  if (priority === 'HIGH') return <span className="badge-high">High</span>
  if (priority === 'MEDIUM') return <span className="badge-medium">Medium</span>
  return <span className="badge-low">Low</span>
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'TODO',
    priority: 'MEDIUM', dueDate: '', assigneeId: ''
  })
  const [memberEmail, setMemberEmail] = useState('')

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`)
      setProject(res.data.project)
    } catch (err) {
      toast.error('Failed to load project')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProject() }, [id])

  const isOwner = project?.ownerId === user?.id
  const canManage = isAdmin || isOwner

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) return toast.error('Task title is required')

    setSubmitting(true)
    try {
      const payload = { ...taskForm, projectId: id }
      if (!payload.assigneeId) delete payload.assigneeId
      if (!payload.dueDate) delete payload.dueDate

      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, payload)
        toast.success('Task updated!')
      } else {
        await api.post('/tasks', payload)
        toast.success('Task created!')
      }

      setShowTaskModal(false)
      setEditTask(null)
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
      fetchProject()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      toast.success('Task deleted')
      fetchProject()
    } catch (err) {
      toast.error('Failed to delete task')
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
      fetchProject()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) return toast.error('Email is required')

    setSubmitting(true)
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail })
      toast.success('Member added!')
      setMemberEmail('')
      setShowMemberModal(false)
      fetchProject()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${id}/members/${memberId}`)
      toast.success('Member removed')
      fetchProject()
    } catch (err) {
      toast.error('Failed to remove member')
    }
  }

  const openEditTask = (task) => {
    setEditTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || ''
    })
    setShowTaskModal(true)
  }

  const allMembers = project ? [
    { id: project.ownerId, name: project.owner.name, email: project.owner.email, isOwner: true },
    ...project.members.map(m => ({ id: m.userId, name: m.user.name, email: m.user.email, memberId: m.id }))
  ] : []

  const filteredTasks = project?.tasks?.filter(t => !filterStatus || t.status === filterStatus) || []

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-800 rounded w-48 animate-pulse" />
        <div className="h-40 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </button>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-slate-400 text-sm mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canManage && (
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Member
            </button>
          )}
          <button onClick={() => { setEditTask(null); setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' }); setShowTaskModal(true) }} className="btn-primary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* members */}
      <div className="card">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Team Members</h3>
        <div className="flex flex-wrap gap-2">
          {allMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-semibold">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{m.name}</span>
              {m.isOwner && <span className="text-xs text-purple-400">Owner</span>}
              {canManage && !m.isOwner && (
                <button onClick={() => handleRemoveMember(m.id)} className="text-slate-500 hover:text-red-400 ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Tasks ({filteredTasks.length})</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 text-sm">No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="card hover:border-slate-600 transition-colors">
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
                      <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isPast(new Date(task.dueDate)) && task.status !== 'DONE' ? 'text-red-400' : ''}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    {canManage && (
                      <>
                        <button onClick={() => openEditTask(task)} className="text-slate-400 hover:text-sky-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* task modal */}
      {showTaskModal && (
        <Modal title={editTask ? 'Edit Task' : 'Create Task'} onClose={() => { setShowTaskModal(false); setEditTask(null) }}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="input"
                placeholder="Task title"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="input resize-none"
                rows={2}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="input">
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="input">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="input"
              />
            </div>
            {canManage && (
              <div>
                <label className="label">Assign To</label>
                <select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })} className="input">
                  <option value="">Unassigned</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowTaskModal(false); setEditTask(null) }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* member modal */}
      {showMemberModal && (
        <Modal title="Add Team Member" onClose={() => setShowMemberModal(false)}>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="label">Member email</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="input"
                placeholder="colleague@example.com"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1.5">The user must already have an account</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}