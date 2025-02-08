import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const MarketInsights = [
  "Market volatility detected in tech sector",
  "AI-driven trading volume increasing",
  "New support level formed at key price point",
  "Institutional buying pressure detected",
  "Bullish divergence on momentum indicators",
  "Market sentiment shifting positive",
  "Unusual options activity detected",
  "High-frequency trading patterns identified",
  "Key resistance level approaching",
  "Volume profile showing accumulation"
];

const AIResponses = {
  volume: "Based on our analysis, trading volume has spiked 23% above the 20-day average, indicating strong institutional interest.",
  trend: "The current trend analysis shows an emerging bullish pattern with increasing momentum.",
  support: "Key support levels have been established at recent price points, providing a stable foundation for upward movement.",
  resistance: "Watch for potential breakout above the current resistance level at market open.",
  default: "I'm analyzing the market patterns. What specific aspect would you like to know about?"
};

const generateChartData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const baseValue = 1000 + Math.random() * 500;
    const sentiment = Math.random();
    data.push({
      time: `${i}:00`,
      value: baseValue,
      sentiment: sentiment * 100,
    });
  }
  return data;
};

const TradingGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<THREE.Mesh>();
  const [currentInsight, setCurrentInsight] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, timestamp: string, isUser?: boolean }>>([]);
  const [userInput, setUserInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState(generateChartData());

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const typeMessage = async (message: string) => {
    setIsTyping(true);
    setCurrentInsight("");
    for (let i = 0; i < message.length; i++) {
      setCurrentInsight(prev => prev + message[i]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setIsTyping(false);
    
    const timestamp = new Date().toLocaleTimeString();
    setChatHistory(prev => [...prev, { message, timestamp }]);
    scrollToBottom();
  };

  const handleUserMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    setChatHistory(prev => [...prev, { message: userInput, timestamp, isUser: true }]);
    
    // Generate AI response
    const keywords = ['volume', 'trend', 'support', 'resistance'];
    const matchedKeyword = keywords.find(keyword => userInput.toLowerCase().includes(keyword));
    const response = matchedKeyword ? AIResponses[matchedKeyword] : AIResponses.default;
    
    setUserInput("");
    setTimeout(() => {
      typeMessage(response);
    }, 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const randomInsight = MarketInsights[Math.floor(Math.random() * MarketInsights.length)];
      typeMessage(randomInsight);
      setChartData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString(),
          value: prev[prev.length - 1].value + (Math.random() - 0.5) * 200,
          sentiment: Math.random() * 100,
        }];
        return newData;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const sphereGeometry = new THREE.SphereGeometry(5, 50, 50);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
      emissive: 0x4444ff,
      emissiveIntensity: 0.2,
    });
    
    const glowGeometry = new THREE.SphereGeometry(5.2, 50, 50);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.5 },
        p: { value: 3.0 },
        glowColor: { value: new THREE.Color(0x00ff00) },
        viewVector: { value: camera.position },
        time: { value: 0 }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        uniform float time;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.6 - dot(vNormal, vNormel), 2.0);
          vec3 newPosition = position + normal * (sin(time + position.y * 2.0) * 0.02);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sphere);
    scene.add(glowMesh);
    sphereRef.current = sphere;

    const dataPointsGeometry = new THREE.BufferGeometry();
    const dataPoints = [];
    const colors = [];
    const color = new THREE.Color();
    
    for (let i = 0; i < 300; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const radius = 5.5 + Math.random() * 0.2;
      
      dataPoints.push(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
      );

      const hue = i / 300;
      color.setHSL(hue, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }
    
    dataPointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dataPoints, 3));
    dataPointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const dataPointsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const dataPointsCloud = new THREE.Points(dataPointsGeometry, dataPointsMaterial);
    scene.add(dataPointsCloud);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00ff00, 2);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const lights = [
      new THREE.PointLight(0xff0000, 1),
      new THREE.PointLight(0x00ff00, 1),
      new THREE.PointLight(0x0000ff, 1)
    ];

    lights.forEach((light, i) => {
      light.position.set(
        Math.cos(i * Math.PI * 2 / 3) * 10,
        Math.sin(i * Math.PI * 2 / 3) * 10,
        5
      );
      scene.add(light);
    });

    const animateLights = () => {
      const time = Date.now() * 0.001;
      lights.forEach((light, i) => {
        light.position.x = Math.cos(time + i * Math.PI * 2 / 3) * 10;
        light.position.y = Math.sin(time + i * Math.PI * 2 / 3) * 10;
        light.intensity = 1 + Math.sin(time * 2) * 0.5;
      });
    };

    camera.position.z = 15;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.maxDistance = 30;
    controls.minDistance = 10;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.001;
        dataPointsCloud.rotation.y += 0.001;
        
        sphereRef.current.position.y = Math.sin(time) * 0.1;
        dataPointsCloud.position.y = sphereRef.current.position.y;
        
        glowMaterial.uniforms.time.value = time;
        
        sphereMaterial.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;
        
        dataPointsCloud.scale.setScalar(1 + Math.sin(time) * 0.05);
      }
      
      animateLights();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="relative">
          <div ref={containerRef} className="w-full h-[400px] rounded-xl overflow-hidden" />
          <div className="absolute bottom-4 left-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-mono">ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-xl backdrop-blur-xl border border-purple-500/20">
            <h3 className="text-xl font-semibold mb-2 text-purple-300">Market Activity</h3>
            <div className="mt-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#9b87f5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      stroke="#8E9196"
                      tick={{ fill: '#8E9196', fontSize: 12 }}
                      tickLine={{ stroke: '#8E9196' }}
                      axisLine={{ stroke: '#8E9196', strokeWidth: 0.5 }}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#8E9196"
                      tick={{ fill: '#8E9196', fontSize: 12 }}
                      tickLine={{ stroke: '#8E9196' }}
                      axisLine={{ stroke: '#8E9196', strokeWidth: 0.5 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(155, 135, 245, 0.2)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: '12px'
                      }}
                      labelStyle={{ color: '#8E9196', marginBottom: '4px', fontSize: '12px' }}
                      itemStyle={{ color: '#9b87f5', fontSize: '14px', padding: '4px 0' }}
                      cursor={{ stroke: '#9b87f5', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#9b87f5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-green-500/20 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-sm font-mono">AI ANALYST</span>
              </div>
              <MessageCircle className="text-green-400 w-5 h-5" />
            </div>
            
            <div 
              ref={chatContainerRef}
              className="h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent space-y-4"
            >
              {chatHistory.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start space-x-3 ${item.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${item.isUser ? 'bg-blue-500/20' : 'bg-green-500/20'} flex items-center justify-center`}>
                    <MessageCircle className={`w-4 h-4 ${item.isUser ? 'text-blue-400' : 'text-green-400'}`} />
                  </div>
                  <div className={`flex-1 ${item.isUser ? 'text-right' : ''}`}>
                    <div className={`text-sm font-mono ${item.isUser ? 'text-blue-300' : 'text-green-300'}`}>
                      {item.message}
                    </div>
                    <div className={`text-xs mt-1 ${item.isUser ? 'text-blue-500/50' : 'text-green-500/50'}`}>
                      {item.timestamp}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="glass-card p-6 rounded-xl border border-purple-500/20 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-purple-300">Trading Console</h3>
          <form onSubmit={handleUserMessage} className="flex-1 max-w-md ml-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Ask about market conditions..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full bg-black/30 border-purple-500/20 text-purple-300 placeholder:text-purple-500/50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center hover:bg-purple-500/30 transition-colors"
              >
                <Send className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </form>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 rounded-lg border border-purple-500/10"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-300 font-mono">MARKET SIGNAL {index}</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-200 mb-1">
                {Math.floor(Math.random() * 1000)}
              </div>
              <div className="text-xs text-purple-400">
                Updated {new Date().toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradingGlobe;
