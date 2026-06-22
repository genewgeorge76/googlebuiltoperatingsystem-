import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../context/OSContext';

export default function JarvisOrb({ setTab }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { trucks, jobs, dispatchTruck, addJob } = useOS();
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("JARVIS HEARD: ", transcript);
      await processCommand(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a British or deep polished voice
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel')) || voices[0];
    if (jarvisVoice) utterance.voice = jarvisVoice;
    
    utterance.pitch = 0.9;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const processCommand = async (text) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          systemState: { trucks, jobs } // Send context so Jarvis knows what's available
        })
      });

      const data = await response.json();
      
      if (data.response) {
        speak(data.response);
      }

      if (data.toolCall) {
        const { action, payload } = data.toolCall;
        console.log("JARVIS EXECUTING TOOL:", action, payload);
        
        if (action === 'dispatch_truck') {
          dispatchTruck(payload.truckId, payload.jobId);
        } else if (action === 'add_job') {
          addJob(payload);
        } else if (action === 'navigate_system') {
          if (setTab) setTab(payload.station);
        }
      }
    } catch (error) {
      console.error(error);
      speak("Forgive me Sir, but I am experiencing a neurological disconnect.");
    }
    setProcessing(false);
  };

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return (
    <div 
      onClick={toggleListen}
      style={{
        position: 'fixed',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: listening ? '#ef4444' : processing ? '#f59e0b' : '#1a1a1a',
        border: `2px solid ${listening ? '#ef4444' : '#f59e0b'}`,
        boxShadow: listening ? '0 0 20px #ef4444' : processing ? '0 0 20px #f59e0b' : '0 0 10px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 9999,
        transition: 'all 0.3s ease',
        transform: (listening || processing) ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <div style={{ fontSize: 24 }}>
        {listening ? '🎙️' : processing ? '⚙️' : 'J'}
      </div>
    </div>
  );
}
