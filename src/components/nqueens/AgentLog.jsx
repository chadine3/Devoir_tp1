import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AgentLog = ({ log }) => {
  const logEndRef = useRef(null);
  const containerRef = useRef(null);
  const [prevLogLength, setPrevLogLength] = useState(0);

  // Auto-scroll to bottom only when new entries are added
  useEffect(() => {
    if (log.length > prevLogLength && logEndRef.current) {
      const container = containerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

      if (isNearBottom) {
        logEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    setPrevLogLength(log.length);
  }, [log, prevLogLength]);

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
        Journal de l'Agent
      </h4>

      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
        style={{ maxHeight: '400px' }}
      >
        <AnimatePresence>
          {log.map((entry, index) => (
            <motion.div
              key={`log-${index}`} // Changed to use stable index-based key
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mb-2 last:mb-0"
            >
              <div className="text-sm text-black dark:text-gray-300">
                {entry}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default AgentLog;