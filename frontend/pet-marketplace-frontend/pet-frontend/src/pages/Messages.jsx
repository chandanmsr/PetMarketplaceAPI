import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getConversations, getMessages, sendMessage as sendRest } from "../api/chat";
import { useAuth } from "../context/AuthContext.jsx";
import { getHubConnection, startHubConnection } from "../api/signalr";
import Loading from "../components/Loading.jsx";
import "./Messages.css";

export default function Messages() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // { otherUserId, petId, otherUserName }
  const [thread, setThread] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  function loadConversations() {
    getConversations()
      .then((data) => {
        setConversations(data);
        const withParam = params.get("with");
        if (withParam && !active) {
          const petParam = params.get("pet");
          const existing = data.find(
            (c) => String(c.otherUserId) === withParam && String(c.petId || "") === (petParam || "")
          );
          setActive({
            otherUserId: Number(withParam),
            petId: petParam ? Number(petParam) : null,
            otherUserName: existing?.otherUserName || "New conversation",
          });
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadConversations, []);

  useEffect(() => {
    if (!active) return;
    getMessages(active.otherUserId, active.petId).then(setThread);
  }, [active?.otherUserId, active?.petId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  // Real-time incoming messages
  useEffect(() => {
    let mounted = true;
    startHubConnection().then(() => {
      if (!mounted) return;
      const conn = getHubConnection();
      conn.on("ReceiveMessage", (msg) => {
        if (
          active &&
          (msg.senderId === active.otherUserId || msg.receiverId === active.otherUserId) &&
          (msg.petId || null) === (active.petId || null)
        ) {
          setThread((t) => [...t, msg]);
        }
        loadConversations();
      });
    });
    return () => {
      mounted = false;
      try {
        getHubConnection().off("ReceiveMessage");
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.otherUserId, active?.petId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const content = text.trim();
    setText("");
    try {
      const conn = getHubConnection();
      if (conn.state === "Connected") {
        await conn.invoke("SendMessage", active.otherUserId, content, active.petId ?? null);
      } else {
        await sendRest(active.otherUserId, content, active.petId);
      }
    } catch {
      await sendRest(active.otherUserId, content, active.petId);
    }
    setThread((t) => [
      ...t,
      { id: `tmp-${Date.now()}`, content, senderId: user.id, receiverId: active.otherUserId, sentAt: new Date().toISOString() },
    ]);
    loadConversations();
  }

  return (
    <div className="msg-layout">
      <div className={`msg-list${active ? " hide-mobile" : ""}`}>
        {loading ? (
          <Loading />
        ) : conversations.length === 0 && !active ? (
          <div className="empty"><h3>No conversations</h3><p>Message a seller from a pet's page to start.</p></div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.conversationKey}
              className={`msg-list-item${active?.otherUserId === c.otherUserId && active?.petId === c.petId ? " active" : ""}`}
              onClick={() => setActive({ otherUserId: c.otherUserId, petId: c.petId, otherUserName: c.otherUserName })}
            >
              <div className="msg-avatar">{c.otherUserName?.[0] || "?"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="msg-list-name">
                  <span>{c.otherUserName}</span>
                  {c.unreadCount > 0 && <span className="pill pill-pending">{c.unreadCount}</span>}
                </div>
                {c.petName && <div className="msg-list-pet">Re: {c.petName}</div>}
                <div className="msg-list-preview">{c.lastMessage}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`msg-thread${!active ? " hide-mobile" : ""}`}>
        {active ? (
          <>
            <div className="msg-thread-head">
              <button className="btn btn-ghost btn-sm back-btn" onClick={() => setActive(null)}>← Back</button>
              <h3>{active.otherUserName}</h3>
            </div>
            <div className="msg-bubbles">
              {thread.map((m) => (
                <div key={m.id} className={`bubble ${String(m.senderId) === String(user.id) ? "bubble-mine" : "bubble-theirs"}`}>
                  <div>{m.content}</div>
                  <div className="bubble-time">{new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form className="msg-composer" onSubmit={handleSend}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" />
              <button className="btn btn-primary btn-sm" disabled={!text.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="empty" style={{ margin: "auto" }}>
            <h3>Select a conversation</h3>
          </div>
        )}
      </div>
    </div>
  );
}
