
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

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

const TradingGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<THREE.Mesh>();
  const [currentInsight, setCurrentInsight] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, timestamp: string }>>([]);

  const typeMessage = async (message: string) => {
    setIsTyping(true);
    setCurrentInsight("");
    for (let i = 0; i < message.length; i++) {
      setCurrentInsight(prev => prev + message[i]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setIsTyping(false);
    
    // Add message to chat history
    const timestamp = new Date().toLocaleTimeString();
    setChatHistory(prev => [...prev, { message, timestamp }]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const randomInsight = MarketInsights[Math.floor(Math.random() * MarketInsights.length)];
      typeMessage(randomInsight);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create globe with glowing effect
    const sphereGeometry = new THREE.SphereGeometry(5, 50, 50);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    });
    
    // Add glow effect with fixed uniform types
    const glowGeometry = new THREE.SphereGeometry(5.2, 50, 50);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.5 },
        p: { value: 3.0 },
        glowColor: { value: new THREE.Color(0x00ff00) },
        viewVector: { value: camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
          intensity = pow(dot(normalize(viewVector), actual_normal), 2.0);
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

    // Add more data points for a richer visualization
    const dataPointsGeometry = new THREE.BufferGeometry();
    const dataPoints = [];
    const colors = [];
    const color = new THREE.Color();
    
    for (let i = 0; i < 200; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const radius = 5.5;
      
      dataPoints.push(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
      );

      // Add varying colors for data points
      const hue = i / 200;
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

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00ff00, 2);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Add pulse effect to point light
    const pulseLight = () => {
      pointLight.intensity = 2 + Math.sin(Date.now() * 0.002) * 0.5;
    };

    // Camera position
    camera.position.z = 15;

    // Controls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.maxDistance = 30;
    controls.minDistance = 10;

    // Animation loop with enhanced effects
    const animate = () => {
      requestAnimationFrame(animate);
      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.001;
        dataPointsCloud.rotation.y += 0.001;
        
        // Add slight wobble effect
        sphereRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
        dataPointsCloud.position.y = sphereRef.current.position.y;
      }
      
      pulseLight();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
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
    <div className="relative">
      <div ref={containerRef} className="w-full h-[600px]" />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md"
      >
        <div className="glass-card p-4 border border-green-500/20 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-sm font-mono">MARKET INTELLIGENCE</span>
            </div>
            <MessageCircle className="text-green-400 w-5 h-5" />
          </div>
          
          <div className="space-y-4 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent mb-4">
            {chatHistory.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start space-x-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-green-300 font-mono text-sm">{item.message}</div>
                  <div className="text-green-500/50 text-xs mt-1">{item.timestamp}</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="border-t border-green-500/20 pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-green-300 font-mono text-sm flex-1">
                {currentInsight}
                {isTyping && <span className="animate-pulse">_</span>}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TradingGlobe;
