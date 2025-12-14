import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import * as signalR from '@microsoft/signalr'
import '../styles/Chatbot.css'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  // Load messages from localStorage if available
  const defaultGreeting = { id: 1, text: 'Sveiki! Aš esu VetKlinika asistentas. Kuo galiu padėti?', sender: 'bot' }
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chatbot_messages')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {}
    return [defaultGreeting]
  })
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentBotMessage, setCurrentBotMessage] = useState('')
  const messagesEndRef = useRef(null)
  const connectionRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Save messages to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages))
    } catch {}
    scrollToBottom()
  }, [messages, currentBotMessage])

  // Initialize SignalR connection
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5068/chathub')
      .withAutomaticReconnect()
      .build()

    connection.on('ReceiveTyping', (isTyping) => {
      setIsLoading(isTyping)
    })

    connection.on('ReceiveMessageChunk', (chunk) => {
      setCurrentBotMessage(prev => prev + chunk)
    })

    connection.on('ReceiveMessageComplete', (fullMessage) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: fullMessage,
        sender: 'bot'
      }])
      setCurrentBotMessage('')
      setIsLoading(false)
    })

    connection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.error('SignalR Connection Error:', err))

    connectionRef.current = connection

    return () => {
      connection.stop()
    }
  }, [])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user'
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputValue
    setInputValue('')
    setIsLoading(true)

    // Prepare history
    const history = messages
      .filter(m => m.id !== 1) // Exclude initial greeting
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

    try {
      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        await connectionRef.current.invoke('SendMessage', messageToSend, history)
      } else {
        // Fallback to HTTP if SignalR not connected
        const response = await fetch('http://localhost:5068/api/Product/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageToSend, history })
        })
        const data = await response.json()
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.reply || 'Atsiprašau, įvyko klaida.',
          sender: 'bot'
        }])
        setIsLoading(false)
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Nepavyko prisijungti prie serverio. Bandykite vėliau.',
        sender: 'bot'
      }])
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-avatar">🐾</span>
              <div>
                <h4>VetKlinika Asistentas</h4>
                <span className="status">Online</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbot-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.sender}`}>
                {message.sender === 'bot' && <span className="bot-icon">🐾</span>}
                <div className="message-content">
                  {message.sender === 'bot' ? (
                    <ReactMarkdown
                      components={{
                        img: ({node, ...props}) => (
                          <img
                            {...props}
                            style={{cursor: 'pointer'}}
                            onClick={() => window.open(props.src, '_blank')}
                            onLoad={e => { e.target.style.opacity = 1; }}
                            onError={e => { e.target.style.opacity = 0.2; e.target.alt = 'Nepavyko įkelti nuotraukos'; }}
                          />
                        )
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {/* Streaming message */}
            {currentBotMessage && (
              <div className="message bot">
                <span className="bot-icon">🐾</span>
                <div className="message-content">
                  <ReactMarkdown
                    components={{
                      img: ({node, ...props}) => (
                        <img
                          {...props}
                          style={{cursor: 'pointer'}}
                          onClick={() => window.open(props.src, '_blank')}
                          onLoad={e => { e.target.style.opacity = 1; }}
                          onError={e => { e.target.style.opacity = 0.2; e.target.alt = 'Nepavyko įkelti nuotraukos'; }}
                        />
                      )
                    }}
                  >
                    {currentBotMessage}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {isLoading && !currentBotMessage && (
              <div className="message bot">
                <span className="bot-icon">🐾</span>
                <div className="message-content typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Rašykite žinutę..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  )
}

export default Chatbot