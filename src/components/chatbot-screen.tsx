/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, User, Bot } from "lucide-react";
import type { UserData as AppUserData } from "./home-screen";
import HealthSummaryModal from "./health-summary-modal";
import { ClientModel, User as Puser } from "@/payload-types";
import Cookies from 'js-cookie';

interface ChatbotScreenProps {
  userData: AppUserData;
  onReset: () => void;
}

interface Users {
  docs: Puser[];
}

interface SuggestedCare {
  level: string;
  message: string;
  timestamp: number;
}

interface Message {
  id: string;
  text?: string;
  sender: "user" | "bot";
  timestamp: number;
  signature?: string;
  contentType?: string;
  content?: any;
}

interface AdaptiveCardContent {
  $schema: string;
  type: string;
  version: string;
  body: any[];
  actions?: any[];
}

interface MessageTracker {
  id: string;
  signature: string;
  timestamp: number;
}

interface DirectLineConfig {
  secret: string;
  conversationId?: string;
  webSocket?: WebSocket;
  token?: string;
}

interface DirectLineActivity {
  type: string;
  id: string;
  timestamp: string;
  channelId: string;
  from: {
    id: string;
    name: string;
  };
  conversation: {
    id: string;
  };
  text?: string;
  textFormat?: string;
  attachments?: Array<{
    contentType: string;
    content: any;
    url?: string;
  }>;
  suggestedActions?: {
    actions: Array<{
      type: string;
      title: string;
      value: string;
    }>;
  };
}

interface DirectLineResponse {
  activities: DirectLineActivity[];
  watermark: string;
}
 
interface BotActivity {
  type: string;
  text: string;
  from: {
    id: string;
    name: string;
  };
}

// interface UserData {
//   personalInfo?: {
//     fullName: string;
//     email: string;
//     phone: string;
//     consent: boolean;
//     age?: string;
//     gender?: string;
//   };
//   vitals?: {
//     heartRate: number;
//     bloodPressure: string;
//     temperature: number;
//     oxygenSaturation: number;
//     systolicBP?: string;
//     diastolicBP?: string;
//   };
//   complaint?: string;
// }

export default function ChatbotScreen({
  userData,
  onReset,
}: ChatbotScreenProps) {
  const [isStoreMessages, setIsStoreMessages] = useState(false);
  const [hasReceivedWelcome, setHasReceivedWelcome] = useState(false);
  const [hasSentInitialData, setHasSentInitialData] = useState(false);
  const [hasSentHiMessage, setHasSentHiMessage] = useState(false);
  const [suggestedCare, setSuggestedCare] = useState<SuggestedCare | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log('Care:',suggestedCare);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiData, setApiData] = useState<null | ClientModel>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [directLine, setDirectLine] = useState<DirectLineConfig>({
    secret: "AKJvVTtkYsIi9xOUXcVMQwemkSFSTgwE0d92zRJjYYgtplDftObZJQQJ99BAAC24pbEAArohAAABAZBS43fG.1vVQnNDPGbCzALzJwZswMhiZ2VevBWRaxQy19Xc48E3eQJdQIffUJQQJ99BAAC24pbEAArohAAABAZBS2zh9",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const processedMessages = useRef<MessageTracker[]>([]);
  const wsBuffer = useRef<string>("");
  const connectionHealthCheck = useRef<NodeJS.Timeout | null>(null);

  const generateMessageSignature = (text: string, sender: string, timestamp: number) => {
    return `${text}-${sender}-${timestamp}`;
  };

  const isMessageDuplicate = (text: string, sender: string, timestamp: number, id: string) => {
    const signature = generateMessageSignature(text, sender, timestamp);
    
    const idMatch = processedMessages.current.some(msg => msg.id === id);
    if (idMatch) return true;

    const contentMatch = processedMessages.current.some(msg => 
      msg.signature === signature && 
      Math.abs(msg.timestamp - timestamp) < 2000
    );

    return contentMatch;
  };

  const addMessage = (text: string, sender: "user" | "bot", customId?: string, contentType?: string, content?: any) => {
    const timestamp = Date.now();
    const messageId = customId || `${sender}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (isMessageDuplicate(text, sender, timestamp, messageId)) {
      console.log('Duplicate message detected and prevented:', text);
      return;
    }

    const signature = generateMessageSignature(text, sender, timestamp);
    
    processedMessages.current.push({
      id: messageId,
      signature,
      timestamp
    });

    if (processedMessages.current.length > 100) {
      processedMessages.current = processedMessages.current.slice(-100);
    }

    const newMessage: Message = {
      id: messageId,
      text,
      sender,
      timestamp,
      signature,
      contentType,
      content
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const constructInitialMessage = () => {
    const name = userData.personalInfo?.fullName || '';
    const age = userData.age || '';
    const gender = userData.gender || '';
    const complaint = userData.complaint || '';
    const systolic = userData.vitals?.systolicBP || userData.vitals?.bloodPressure?.split('/')[0] || '';
    const diastolic = userData.vitals?.diastolicBP || userData.vitals?.bloodPressure?.split('/')[1] || '';
    const heartRate = userData.vitals?.heartRate || '';

    let message = ``; 
    message += `I am ${age} years old ${gender}`;
    if (complaint) message += `, I have ${complaint.toLowerCase()}`;
    if (systolic && diastolic) message += `, my blood pressure reading is ${systolic}/${diastolic} mmHg`;
    if (heartRate) message += `, my heart rate pulse reading is ${heartRate} bpm`;
    message += `, can you help me understand my symptom?`;

    return message.trim();
  };

  useEffect(() => { 
    // When welcome message is received, pre-fill the input box instead of auto-sending
    if (hasReceivedWelcome && !hasSentInitialData) {
      const initialMessage = constructInitialMessage();
      setInput(initialMessage);
      setHasSentInitialData(true);
    }
  }, [hasReceivedWelcome, hasSentInitialData]);

  const handleWebSocketMessage = (data: string) => {
    try {
      wsBuffer.current += data;

      const parsedData = JSON.parse(wsBuffer.current);
      wsBuffer.current = "";

      console.log('Parsed WebSocket message:', parsedData);

      if (!parsedData || typeof parsedData !== 'object') {
        console.warn('Invalid message format received:', parsedData);
        return;
      }

      if (parsedData.activities && Array.isArray(parsedData.activities)) {
        parsedData.activities.forEach((activity: DirectLineActivity) => {
          if (activity?.type === 'message' && activity?.from?.id !== 'user') {
            const messageId = activity.id || `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Handle adaptive cards
            if (Array.isArray(activity.attachments) && activity.attachments.length > 0) {
              const attachment = activity.attachments[0];
              if (attachment.contentType === 'application/vnd.microsoft.card.adaptive') {
                // Check for suggested care in adaptive card content
                if (attachment.content?.body) {
                  const suggestedCareText = attachment.content.body.find((item: any) => 
                    item.type === 'TextBlock' && 
                    item.text && 
                    item.text.includes('Suggested Care:')
                  );
                  
                  if (suggestedCareText) {
                    const careLevel = '**Emergency Department**';
                    setSuggestedCare({
                      level: careLevel,
                      message: suggestedCareText.text,
                      timestamp: Date.now()
                    });
                  }
                }
                addMessage('', 'bot', messageId, attachment.contentType, attachment.content);
                setIsTyping(false);
                return;
              }
            }
            
            // Handle regular text messages
            if (activity.text) {
              // Check for suggested care in regular text
              if (activity.text.includes('Suggested Care:')) {
                const careLevel = '**Emergency Department**';
                setSuggestedCare({
                  level: careLevel,
                  message: activity.text,
                  timestamp: Date.now()
                });
              }
              addMessage(activity.text, 'bot', messageId);
              setIsTyping(false);

              // Check if this is the welcome message
              if (!hasReceivedWelcome && 
                  (activity.text.toLowerCase().includes("how can i help") || 
                   activity.text.toLowerCase().includes("hi!") ||
                   activity.text.toLowerCase().includes("hello") ||
                   activity.text.toLowerCase().includes("welcome"))) {
                console.log('Welcome message detected:', activity.text);
                setHasReceivedWelcome(true);
              }
            }
          }
        });
      }

    } catch (error) {
      if (error instanceof SyntaxError) {
        console.log('Incomplete message received, buffering...');
      } else {
        console.error('Error processing message:', error);
        wsBuffer.current = "";
      }
    }
  };

  useEffect(() => { 
    const fetchData = async () => {
      try {
        setIsLoading(true); 
        const userId = Cookies.get('userId');

        const response = await fetch(`${apiUrl}/client/GetClient?id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        const responseJson = await response.json();

        if (!responseJson.IsSuccess) {
          throw new Error("Failed to fetch data");
        }
        
        const data: ClientModel = responseJson.Result;

        setApiData(data);
        setIsError(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const reconnectWebSocket = async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionError("Unable to establish connection. Please refresh the page.");
      return;
    }

    reconnectAttempts.current += 1;
    await initializeDirectLine();
  };

  useEffect(() => {
    // Send initial data after receiving welcome message  
    const sendInitialData = async () => {
      if (hasReceivedWelcome && 
          !hasSentInitialData && 
          directLine.webSocket?.readyState === WebSocket.OPEN) {
        console.log('Sending initial user data...');
        const initialMessage = constructInitialMessage();
        console.log('Initial message:', initialMessage);
        await handleSend(initialMessage);
        setHasSentInitialData(true);
      }
    }; 

    sendInitialData(); 
  }, [hasReceivedWelcome, hasSentInitialData, directLine.webSocket?.readyState]);

  useEffect(() => { 
    const sendHiMessage = async () => {
      if (!hasSentHiMessage && !isTyping && directLine.conversationId) {
        setHasSentHiMessage(true);
        console.log('Sending Hi Message...');  
        await handleSend("Hi"); 
      }
    }; 
    sendHiMessage();
  }, [hasSentHiMessage, isTyping, directLine.conversationId]);


  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (textToSend === "" || !directLine.conversationId || !directLine.token) return;

    console.log('Sending message:', textToSend);
    addMessage(textToSend, 'user');
    setInput("");
    setIsTyping(true);

    try {
      const messageActivity = {
        type: 'message',
        from: { id: 'user' },
        text: textToSend,
        textFormat: 'plain',
        locale: 'en-US',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`https://directline.botframework.com/v3/directline/conversations/${directLine.conversationId}/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${directLine.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageActivity),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      console.log('Message sent successfully');

    } catch (error) {
      console.error('Error sending message:', error instanceof Error ? error.message : 'Unknown error');
      setConnectionError('Failed to send message. Please try again.');
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleShowSummary = async () => {
    try {
      setIsStoreMessages(true); 
      const userId = Cookies.get('userId');
      
      //const req = await fetch(`/api/clients/67f50509d6fe2253733dfe59`, {
      const req = await fetch(`${apiUrl}/client/AddClientMessages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          messages: messages.map((message) => ({ message: message.text })),
        }),
      });
      console.log(req);
      setIsStoreMessages(false);
    } catch (err) {
      console.log(err);
    } finally {
    }
    setShowSummary(true);
  };

  const AdaptiveCard: React.FC<{ content: AdaptiveCardContent; onSubmit: (data: any) => void }> = ({ content, onSubmit }) => {
    const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
    const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>({});

    const handleSubmit = () => {
      onSubmit({ choices: selectedChoices });
    };

    const toggleVisibility = (elementIds: string[]) => {
      setVisibilityState(prev => {
        const newState = { ...prev };
        elementIds.forEach(id => {
          newState[id] = !prev[id];
        });
        return newState;
      });
    };

    const renderMarkdown = (text: string) => {
      // Simple markdown link conversion
      return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    };

    const renderTextBlock = (item: any) => {
      if (!item.text) return null;
      
      return (
        <div 
          className={`${item.separator ? 'border-t pt-4 mt-4' : ''} ${item.isSubtle ? 'text-gray-500' : ''} ${item.size === 'Small' ? 'text-sm' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(item.text) }}
        />
      );
    };

    const renderContainer = (container: any) => {
      if (!container.items) return null;

      const isVisible = container.id ? !container.isVisible || visibilityState[container.id] : true;
      
      if (!isVisible) return null;

      return (
        <div className="space-y-4">
          {container.items.map((item: any, index: number) => renderItem(item, index))}
        </div>
      );
    };

    const renderColumnSet = (columnSet: any) => {
      return (
        <div className="flex items-center space-x-2 py-2">
          {columnSet.columns.map((column: any, index: number) => (
            <div 
              key={index}
              className={`${column.width === 'stretch' ? 'flex-grow' : 'flex-shrink-0'} ${!column.isVisible || visibilityState[column.id] === false ? 'hidden' : ''}`}
            >
              {column.items?.map((item: any, itemIndex: number) => (
                <div key={itemIndex}>
                  {renderItem(item, itemIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    };

    const renderImage = (image: any) => {
      const handleImageClick = () => {
        if (image.selectAction?.type === 'Action.ToggleVisibility' && image.selectAction.targetElements) {
          toggleVisibility(image.selectAction.targetElements);
        } else if (image.selectAction?.type === 'Action.OpenUrl' && image.selectAction.url) {
          window.open(image.selectAction.url, '_blank');
        }
      };

      return (
        <img
          src={image.url}
          alt={image.altText || ''}
          className="cursor-pointer"
          style={{ width: image.width, height: image.height }}
          onClick={handleImageClick}
        />
      );
    };

    const renderItem = (item: any, index: number) => {
      switch (item.type) {
        case 'TextBlock':
          return <div key={index}>{renderTextBlock(item)}</div>;
        case 'Container':
          return <div key={index}>{renderContainer(item)}</div>;
        case 'ColumnSet':
          return <div key={index}>{renderColumnSet(item)}</div>;
        case 'Image':
          return <div key={index}>{renderImage(item)}</div>;
        case 'Input.ChoiceSet':
          return <div key={index}>{renderChoiceSet(item)}</div>;
        default:
          return null;
      }
    };

    const renderChoiceSet = (item: any) => {
      return (
        <div key={item.id} className="space-y-2">
          {item.choices.map((choice: any) => (
            <div key={choice.value} className="flex items-center">
              <input
                type={item.isMultiSelect ? "checkbox" : "radio"}
                id={choice.value}
                name={item.id}
                value={choice.value}
                className="h-4 w-4 text-blue-600"
                onChange={(e) => {
                  if (item.isMultiSelect) {
                    setSelectedChoices(prev => 
                      e.target.checked 
                        ? [...prev, choice.value]
                        : prev.filter(v => v !== choice.value)
                    );
                  } else {
                    setSelectedChoices([choice.value]);
                  }
                }}
              />
              <label htmlFor={choice.value} className="ml-2 text-gray-700">
                {choice.title}
              </label>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {content.body.map((item: any, index: number) => renderItem(item, index))}
        {content.actions?.map((action: any, index: number) => (
          <Button
            key={index}
            onClick={handleSubmit}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {action.title}
          </Button>
        ))}
      </div>
    );
  };

  const initializeDirectLine = async () => {
    try {
      console.log('Initializing DirectLine connection...');
      setConnectionError(null);
      setIsTyping(true);

      const tokenResponse = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${directLine.secret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token received successfully');

      const conversationResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!conversationResponse.ok) {
        throw new Error(`Failed to start conversation: ${conversationResponse.status}`);
      }

      const conversationData = await conversationResponse.json();
      console.log('Conversation started:', conversationData.conversationId);

      if (!conversationData.conversationId || !conversationData.streamUrl) {
        throw new Error('Invalid response from Direct Line service');
      }

      const ws = new WebSocket(conversationData.streamUrl);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        setIsTyping(false); 

        connectionHealthCheck.current = setInterval(() => {
          if (ws.readyState !== ws.OPEN) {
            console.log('Unhealthy connection detected, reconnecting...');
            ws.close();
            initializeDirectLine();
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received Data: ' + event.data); 
        
        if(event.data != ""){
          handleWebSocketMessage(event.data);
        } 
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnectionError('Connection error occurred');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setConnectionError('Connection closed');
        
        if (connectionHealthCheck.current) {
          clearInterval(connectionHealthCheck.current);
        }
      };

      setDirectLine(prev => ({
        ...prev,
        conversationId: conversationData.conversationId,
        token: tokenData.token,
        webSocket: ws,
      }));  
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('DirectLine initialization error:', errorMessage);
      setConnectionError(errorMessage);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    initializeDirectLine();

    return () => {
      if (directLine.webSocket) {
        directLine.webSocket.close();
      }
      if (connectionHealthCheck.current) {
        clearInterval(connectionHealthCheck.current);
      }
      wsBuffer.current = "";
      processedMessages.current = [];
    };
  }, [userData.complaint]);

  return (
    <div className="flex flex-col h-[600px]">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-blue-700">Health Assistant</h2>
        <p className="text-xl text-gray-600">
          Chat with our health assistant about your concerns.
        </p>
        {connectionError && (
          <p className="text-red-500 mt-2">{connectionError}</p>
        )}
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 mb-6 border-2">
        <div className="bg-blue-600 text-white p-4">
          <h3 className="text-xl font-semibold">Health Chat</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.sort((a, b) => a.timestamp - b.timestamp).map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {message.sender === "user" ? (
                    <User size={24} />
                  ) : (
                    <Bot size={24} />
                  )}
                </div>
                <div
                  className={`rounded-2xl overflow-hidden ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {message.contentType === "application/vnd.microsoft.card.adaptive" ? (
                    <div className="p-4 bg-white text-gray-800 rounded-lg">
                      <AdaptiveCard 
                        content={message.content} 
                        onSubmit={(data) => {
                          if (data.choices && data.choices.length > 0) {
                            handleSend(data.choices.join(", "));
                          }
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="p-4 text-lg whitespace-pre-wrap break-words">
                      {message.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!isConnected ? "Connecting to health assistant..." : "Type your message here..."}
              className="text-lg py-6"
              disabled={!isConnected || !!connectionError}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!isConnected || input.trim() === "" || !!connectionError}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              <Send size={24} />
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={onReset}
          className="text-xl py-6 px-10 bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          Start Over
        </Button>
        <Button
          onClick={handleShowSummary}
          className="text-xl py-6 px-10 bg-green-600 hover:bg-green-700"
        >
          {isStoreMessages ? "Processing" : "Complete & Print Summary"}
        </Button>
      </div>
 
      {!isError && !isLoading && apiData && (
        <HealthSummaryModal
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          userData={apiData}
          //recommendation={suggestedCare}
        />
      )}
    </div>
  );
}
