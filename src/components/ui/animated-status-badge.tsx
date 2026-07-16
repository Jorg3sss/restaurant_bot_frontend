"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check } from "lucide-react"

interface AnimatedStatusBadgeProps {
  trigger: boolean
  onAnimationComplete?: () => void
  className?: string
  text?: string
}

export function AnimatedStatusBadge({ 
  trigger, 
  onAnimationComplete,
  className = "",
  text = "Procesando"
}: AnimatedStatusBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const startAnimation = () => {
    setIsAnimating(true)
    setIsCompleted(false)
    setTimeout(() => {
      setIsAnimating(false)
      setTimeout(() => {
        setIsCompleted(true)
        // Make completed badge disappear after 3 seconds
        setTimeout(() => {
          setIsCompleted(false)
          if (onAnimationComplete) {
            onAnimationComplete()
          }
        }, 3000)
      }, 300) // Delay the appearance of "Completed" badge
    }, 2000) // Animation duration (reduced from 3s to 2s for faster UX)
  }

  useEffect(() => {
    if (!isAnimating && !isCompleted) {
      setIsCompleted(false)
    }
  }, [isAnimating, isCompleted])

  useEffect(() => {
    if (trigger) {
      startAnimation()
    }
  }, [trigger])

  return (
    <>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute top-0 left-0 bg-yellow-100 text-yellow-600 text-xs font-medium px-2.5 py-0.5 rounded-br-lg rounded-tl-lg flex items-center space-x-1 shadow-md border border-yellow-300/50 z-20 ${className}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{
              y: [-5, -20], 
              opacity: [1, 0], 
              scale: [1, 0.9], 
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            <span>{text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className={`absolute top-0 left-0 bg-green-100 text-green-600 text-xs font-medium px-2.5 py-0.5 rounded-br-lg rounded-tl-lg flex items-center space-x-1 shadow-md border border-green-300/50 z-20 ${className}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{
              y: [-5, -20],
              opacity: [1, 0],
              scale: [1, 0.9],
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <Check className="h-3 w-3 mr-1" />
            <span>Completado</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
