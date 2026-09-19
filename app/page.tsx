"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos");
      const data = await response.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load todos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const remaining = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  );

  const addTodo = async (event: FormEvent) => {
    event.preventDefault();
    const value = newTodo.trim();

    if (!value) {
      return;
    }

    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value }),
    });

    if (response.ok) {
      setNewTodo("");
      fetchTodos();
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });

    if (response.ok) {
      fetchTodos();
    }
  };

  const removeTodo = async (id: number) => {
    const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });

    if (response.ok) {
      fetchTodos();
    }
  };

  const clearCompleted = async () => {
    const response = await fetch("/api/todos", { method: "DELETE" });

    if (response.ok) {
      fetchTodos();
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Daily focus</p>
            <h1>Todo list</h1>
          </div>
          <span className={styles.badge}>{remaining} left</span>
        </header>

        <form className={styles.form} onSubmit={addTodo}>
          <input
            type="text"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Add a new task"
            aria-label="Add a new todo"
          />
          <button type="submit">Add</button>
        </form>

        <ul className={styles.list}>
          {loading ? (
            <li className={styles.empty}>Loading tasks...</li>
          ) : todos.length === 0 ? (
            <li className={styles.empty}>No tasks yet. Add one above.</li>
          ) : (
            todos.map((todo) => (
              <li key={todo.id} className={styles.todoItem}>
                <label className={styles.todoLabel}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                  />
                  <span className={todo.completed ? styles.completed : ""}>
                    {todo.text}
                  </span>
                </label>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => removeTodo(todo.id)}
                  aria-label={`Remove ${todo.text}`}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>

        <footer className={styles.footer}>
          <span>{todos.length} total</span>
          <button type="button" onClick={clearCompleted}>
            Clear completed
          </button>
        </footer>
      </main>
    </div>
  );
}
