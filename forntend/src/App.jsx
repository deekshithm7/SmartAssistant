import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Bot, User } from "lucide-react";

const App = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format message text with basic markdown-like formatting
  const formatMessage = (text) => {
    // Split text into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Handle headers (text starting with **)
      if (paragraph.startsWith('**') && paragraph.includes('**')) {
        const headerMatch = paragraph.match(/^\*\*(.*?)\*\*/);
        if (headerMatch) {
          const headerText = headerMatch[1];
          const remainingText = paragraph.replace(/^\*\*.*?\*\*\s*/, '');
          return (
            <div key={index} className="mb-3">
              <h3 className="font-semibold text-blue-200 mb-2">{headerText}</h3>
              {remainingText && <p>{formatInlineText(remainingText)}</p>}
            </div>
          );
        }
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(paragraph.trim())) {
        const listItems = paragraph.split(/\n(?=\d+\.)/);
        return (
          <ol key={index} className="list-decimal list-inside space-y-1 mb-3 ml-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">
                {formatInlineText(item.replace(/^\d+\.\s*/, ''))}
              </li>
            ))}
          </ol>
        );
      }
      
      // Handle bullet points
      if (paragraph.includes('•') || paragraph.includes('-')) {
        const listItems = paragraph.split(/\n(?=[•-])/);
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-3 ml-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">
                {formatInlineText(item.replace(/^[•-]\s*/, ''))}
              </li>
            ))}
          </ul>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-2">
          {formatInlineText(paragraph)}
        </p>
      );
    });
  };

  // Format inline text (bold, italic, etc.)
  const formatInlineText = (text) => {
    // Handle bold text (**text**)
    return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const speak = (message) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    synth.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setText(voiceText);
      sendMessage(voiceText, true); // true = from voice
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const sendMessage = async (msg, isVoice = false) => {
    if (!msg.trim()) return;

    const userMessage = { sender: "user", text: msg };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: msg,
          conversation_history: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply;

      setIsTyping(false);
      const assistantMessage = { sender: "assistant", text: reply };
      setMessages((prev) => [...prev, assistantMessage]);

      if (isVoice) speak(reply);
    } catch (err) {
      console.error("Error talking to backend:", err);
      setIsTyping(false);
      const errorReply = {
        sender: "assistant",
        text: "Oops! Something went wrong trying to reach the assistant. Please check if the backend server is running.",
      };
      setMessages((prev) => [...prev, errorReply]);
    }

    setText("");
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
            Smart Voice Assistant
          </h1>
          <p className="text-slate-300">Speak or type to start a conversation</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-300">
            <Bot className="w-20 h-20 mb-6 text-purple-400" />
            <p className="text-xl">Start a conversation by typing or using voice input</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-purple-500 text-white"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white rounded-tr-md"
                      : "bg-white/20 text-white border border-white/10 rounded-tl-md backdrop-blur-sm"
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {msg.sender === "assistant" ? formatMessage(msg.text) : msg.text}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500 text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl bg-white/20 text-white border border-white/10 rounded-tl-md backdrop-blur-sm">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-slate-300 ml-2">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(text)}
              placeholder="Type your message here..."
            />
          </div>

          {/* Send Button */}
          <button
            className="bg-blue-500 hover:bg-blue-600  p-3 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            onClick={() => sendMessage(text)}
            disabled={!text.trim()}
          >
            <Send className="w-5 h-5" />
          </button>

          {/* Voice Button */}
          <button
            className={` p-3 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2  ${
              isListening
                ? "bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse"
                : "bg-purple-500 hover:bg-purple-600 focus:ring-purple-400"
            }`}
            onClick={handleVoiceInput}
            disabled={isListening}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Listening...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;