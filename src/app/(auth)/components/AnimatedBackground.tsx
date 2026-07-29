"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NodeData {
  size: number;
  xStart: string;
  yStart: string;
  xAnim: string;
  yAnim: string;
  opacity: number;
  duration: number;
}

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);

  useEffect(() => {
    setMounted(true);
    const generatedNodes = Array.from({ length: 20 }).map(() => ({
      size: Math.random() * 3 + 2,
      xStart: `${Math.random() * 100}vw`,
      yStart: `${Math.random() * 100}vh`,
      xAnim: `${Math.random() * 100}vw`,
      yAnim: `${Math.random() * 100}vh`,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 40 + 40,
    }));
    setNodes(generatedNodes);
  }, []);

  if (!mounted) return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#020617',
      zIndex: 0
    }} />
  );

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)'
    }}>
      {/* Background Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Floating Network Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          initial={{
            x: node.xStart,
            y: node.yStart,
            opacity: node.opacity,
          }}
          animate={{
            y: [null, node.yAnim],
            x: [null, node.xAnim],
          }}
          transition={{
            duration: node.duration,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: 'absolute',
            width: node.size,
            height: node.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
          }}
        />
      ))}

      {/* Subtle Grid Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
