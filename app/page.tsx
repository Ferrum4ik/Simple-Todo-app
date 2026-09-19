"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos");
      if (!response.ok) {
        setTodos([]);
        return;
      }

      const data = await response.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load todos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [user]);

  const remaining = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  );

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: authMode === "signup" ? name : undefined,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    await fetchUser();
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    setTodos([]);
  };

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

  if (!user) {
    return (
      <div className={styles.page}>
        <main className={styles.authCard}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={authMode === "signup" ? styles.activeTab : ""}
              onClick={() => setAuthMode("signup")}
            >
              Sign up
            </button>
            <button
              type="button"
              className={authMode === "signin" ? styles.activeTab : ""}
              onClick={() => setAuthMode("signin")}
            >
              Sign in
            </button>
          </div>

          <form className={styles.authForm} onSubmit={handleAuth}>
            {authMode === "signup" && (
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                aria-label="Full name"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              aria-label="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              aria-label="Password"
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.primaryButton}>
              {authMode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Daily focus</p>
            <h1>Todo list</h1>
          </div>
          <div className={styles.userRow}>
            <span className={styles.username}>{user.name}</span>
            <button type="button" className={styles.signOutButton} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <div className={styles.summaryRow}>
          <span className={styles.badge}>{remaining} left</span>
          <span className={styles.userEmail}>{user.email}</span>
        </div>

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
