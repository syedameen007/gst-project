import { Send } from "lucide-react";
import { useState } from "react";
import { advisorReply } from "../lib/advisor";
import { askSupport } from "../lib/api";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

export default function AdvisorChat({ model, large = false }) {
  const { userId } = useFinance();
  const [input, setInput] = useState("How can I reduce my tax this year?");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `You can combine ${money(model.itcGap)} of eligible ITC with ${money(model.allocate80c + model.allocateNps)} in tax-saving investments. Modeled reduction: ${money(model.totalSaved)}.`,
    },
  ]);

  async function submit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setSending(true);
    setMessages((current) => [
      ...current,
      { role: "user", text: question },
    ]);
    setInput("");
    try {
      const response = await askSupport(userId, "advisor", question);
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

  async function quickAsk(prompt) {
    setInput(prompt);
    setSending(true);
    setMessages((current) => [...current, { role: "user", text: prompt }]);
    try {
      const response = await askSupport(userId, "advisor", prompt);
      setMessages((current) => [...current, { role: "assistant", text: response.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: advisorReply(prompt, model) },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`advisor-chat ${large ? "large" : ""}`}>
      <div className="chat-log">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="prompt-row">
        {["What if I invest ₹20,000?", "How much ITC can I claim?", "Which regime is better?"].map(
          (prompt) => (
            <button key={prompt} type="button" onClick={() => quickAsk(prompt)}>
              {prompt}
            </button>
          ),
        )}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} />
        <button type="submit" disabled={sending}>
          <Send size={17} />
          Send
        </button>
      </form>
    </div>
  );
}
