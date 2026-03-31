import { useState } from 'react'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'
import TodoFilter from './components/TodoFilter'
import './App.css'

function App() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all')

  const addTodo = (text) => {
    setTodos([{ id: Date.now(), text: text.trim(), completed: false }, ...todos])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length

  return (
    <div className="app">
      <h1 className="title">todos</h1>
      <div className="card">
        <TodoInput onAdd={addTodo} />
        {todos.length > 0 && (
          <>
            <TodoList todos={filteredTodos} onToggle={toggleTodo} onDelete={deleteTodo} />
            <TodoFilter
              filter={filter}
              onFilterChange={setFilter}
              activeCount={activeCount}
              onClearCompleted={clearCompleted}
              hasCompleted={todos.some(t => t.completed)}
            />
          </>
        )}
        {todos.length === 0 && (
          <p className="empty-hint">No tasks yet — add one above!</p>
        )}
      </div>
    </div>
  )
}

export default App
