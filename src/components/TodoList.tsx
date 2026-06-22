import { useState } from 'react';
import { useStore } from '../store';

export default function TodoList() {
  const todos = useStore((s) => s.todos);
  const addTodo = useStore((s) => s.addTodo);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');

  const sorted = [...todos].sort((a, b) => Number(a.done) - Number(b.done));

  function submit() {
    if (!text.trim()) return;
    void addTodo(text.trim(), due || undefined);
    setText('');
    setDue('');
  }

  return (
    <section className="panel card">
      <h3 className="panel-title t-title">To-do</h3>
      <div className="todo-add">
        <input
          className="input"
          placeholder="Add a task…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <input
          className="input todo-due"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
        />
        <button className="btn btn-primary btn-pill" onClick={submit}>
          Add
        </button>
      </div>
      <ul className="todo-list">
        {sorted.length === 0 && <li className="muted t-body-sm">No tasks yet.</li>}
        {sorted.map((t) => (
          <li key={t.id} className={`todo-item ${t.done ? 'is-done' : ''}`}>
            <label className="todo-check">
              <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
              <span>{t.text}</span>
            </label>
            <div className="todo-meta">
              {t.dueDate && <span className="t-caption-sm muted">{t.dueDate}</span>}
              <button className="todo-del" onClick={() => deleteTodo(t.id)} aria-label="Delete task">
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
