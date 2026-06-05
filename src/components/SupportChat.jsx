import { Headphones, Send, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { advisorReply } from "../lib/advisor";
import { askSupport } from "../lib/api";
import { useFinance } from "../lib/financeContext";

export default function SupportChat() {
  const { userId, model } = useFinance();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help with tax savings, GST ITC, portfolio impact, and app support.",
    },
  ]);

  async function submit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    setSending(true);
    setMessages((current) => [...current, { role: "user", text: question }]);
    try {
      const response = await askSupport(userId, location.pathname, question);
      setMessages((current) => [...current, { role: "assistant", text: response.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: advisorReply(question, model) },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="support-widget" aria-label="AI customer support">
      <button className="support-toggle" type="button" onClick={() => setOpen(true)}>
        <Headphones size={18} />
        AI Support
      </button>

      {open && (
        <div className="support-panel">
          <div className="support-header">
            <div>
              <strong>Customer Support</strong>
              <span>Tax-aware assistant</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close support chat">
              <X size={18} />
            </button>
          </div>
          <div className="support-log">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form className="support-form" onSubmit={submit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about tax, GST, portfolio..."
            />
            <button type="submit" aria-label="Send message" disabled={sending}>
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
