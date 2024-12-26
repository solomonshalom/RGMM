import React, { useState, useEffect } from 'react';
import { Mod, Group } from '../db';
import { Groq } from 'groq-sdk';

interface ChatProps {
  mods: Mod[];
  groups: Group[];
  onDelete: (id: number) => Promise<void>;
  onEdit: () => void;
  onSave: (modData: Omit<Mod, 'id'>) => Promise<void>;
}

const Chat: React.FC<ChatProps> = ({ mods, groups, onDelete, onEdit, onSave }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Please set your Groq API key in the settings first.' }]);
      setIsLoading(false);
      return;
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant named Evan for a Game Mod Manager application. You have access to the following mods and groups:
            
            Mods: ${JSON.stringify(mods)}
            Groups: ${JSON.stringify(groups)}
            
            You can perform the following actions:
            1. Delete a mod: Call onDelete(modId)
            2. Edit a mod: Call onEdit()
            3. Save a mod: Call onSave(modData)
            
            When conversing, keep your conversations short and sweet - be effective while also being very nice!
            
            When giving instructions, do so in bullet points.
            
            Overall, your goal is to keep your answers and responses super short and only go long, if necessary.

            You can help the user in searching, filtering, and providing information about specific mods. You can also perform actions like deleting or editing mods when requested.
            `
          },
          ...messages,
          userMessage
        ],
        model: 'llama3-8b-8192',
      });

      const assistantMessage = { role: 'assistant' as const, content: completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that request.' };
      setMessages(prev => [...prev, assistantMessage]);

      // Process AI actions
      const aiResponse = assistantMessage.content.toLowerCase();
      if (aiResponse.includes('delete') && aiResponse.includes('mod')) {
        const modIdMatch = aiResponse.match(/mod (\d+)/);
        if (modIdMatch) {
          const modId = parseInt(modIdMatch[1]);
          await onDelete(modId);
          setMessages(prev => [...prev, { role: 'assistant', content: `Mod ${modId} has been deleted.` }]);
        }
      } else if (aiResponse.includes('edit') && aiResponse.includes('mod')) {
        onEdit();
        setMessages(prev => [...prev, { role: 'assistant', content: 'The mod edit form has been opened.' }]);
      }
      // Add more action processing as needed

    } catch (error) {
      console.error('Error processing with AI:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred while processing your request. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportChat = () => {
    const chatContent = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_history.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chat">
      <div className="chat-messages" style={{ height: '300px', overflowY: 'auto', marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'You' : 'Evan'}:</strong> {message.content}
          </div>
        ))}
        {isLoading && <div className="message assistant"><em>Evan is thinking...</em></div>}
      </div>
      <div className="chat-input" style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your mods..."
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
        <button onClick={handleSend} disabled={isLoading}>Send</button>
        <button onClick={handleExportChat}>Export Chat</button>
      </div>
    </div>
  );
};

export default Chat;