function TodoFilter({ filter, onFilterChange, activeCount, onClearCompleted, hasCompleted }) {
  const filters = ['all', 'active', 'completed']

  return (
    <div className="todo-filter">
      <span className="item-count">
        {activeCount} item{activeCount !== 1 ? 's' : ''} left
      </span>
      <div className="filter-buttons">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {hasCompleted && (
        <button className="clear-btn" onClick={onClearCompleted}>
          Clear completed
        </button>
      )}
    </div>
  )
}

export default TodoFilter
