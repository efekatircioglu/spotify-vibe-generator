"use client";
import { useEffect, useState, useRef } from "react";

export default function AdminFeedbackPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/me")
      .then((res) => {
        if (!res.ok) throw new Error("User not logged in");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (user && user.id) {
      fetch("http://127.0.0.1:8000/api/admin/feedbacks", {
        headers: { "x-spotify-user-id": user.id },
      })
        .then((res) => {
          if (res.status === 401) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => setFeedbacks(data))
        .catch((err) => setError(err.message));
    }
  }, [user]);

  if (loading) return <main style={{ padding: 32 }}>Loading...</main>;
  if (!user) return <main style={{ padding: 32 }}>Please log in as admin.</main>;
  if (error) return <main style={{ padding: 32, color: "red" }}>{error}</main>;

  return (
    <main style={{ padding: 32 }}>
      <h1>Admin Feedback Table</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #888", padding: 8 }}>ID</th>
            <th style={{ border: "1px solid #888", padding: 8 }}>Username</th>
            <th style={{ border: "1px solid #888", padding: 8 }}>Emoji</th>
            <th style={{ border: "1px solid #888", padding: 8 }}>Text</th>
            <th style={{ border: "1px solid #888", padding: 8 }}>Created At</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((fb) => (
            <tr key={fb.id}>
              <td style={{ border: "1px solid #888", padding: 8 }}>{fb.id}</td>
              <td style={{ border: "1px solid #888", padding: 8 }}>{fb.username}</td>
              <td style={{ border: "1px solid #888", padding: 8, fontSize: 24 }}>{fb.emoji}</td>
              <td style={{ border: "1px solid #888", padding: 8 }}>{fb.text}</td>
              <td style={{ border: "1px solid #888", padding: 8 }}>{new Date(fb.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
} 