import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import LiveChessboard from './LiveChessboard';

Chart.register(...registerables);

const algorithms = [
  { name: 'Q-Learning', endpoint: 'qlearning', color: '#FF6B6B' },
  { name: 'Genetic', endpoint: 'genetic', color: '#4ECDC4' },
  { name: 'Backtracking', endpoint: 'backtracking', color: '#FFD166' }
];

export const ComparisonPanel = ({ boardSize }) => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSteps, setCurrentSteps] = useState({});
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [allComplete, setAllComplete] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  const runComparison = async () => {
    setIsLoading(true);
    setError(null);
    setAllComplete(false);
    setExpandedView(true); // Automatically expand on compare
    try {
      const responses = await Promise.all(
        algorithms.map(algo =>
          fetch(`/api/solve/${algo.endpoint}?n=${boardSize}`)
            .then(async res => {
              const data = await res.json();
              if (!res.ok || !data) throw new Error(data.message || `${algo.name} failed`);
              return {
                ...algo,
                ...data,
                solutionHistory: data.solutionHistory || [data.solution || Array(boardSize).fill(-1)]
              };
            })
            .catch(err => ({
              ...algo,
              error: err.message,
              solution: Array(boardSize).fill(-1),
              solutionHistory: [Array(boardSize).fill(-1)],
              time: 0,
              memory: 0,
              steps: 0,
              conflicts: boardSize * boardSize
            }))
        )
      );
      setResults(responses);
    } catch (err) {
      setError(err.message || 'Failed to run comparison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (results) {
      const steps = {};
      results.forEach(algo => {
        steps[algo.name] = 0;
      });
      setCurrentSteps(steps);
      setAllComplete(false);
    }
  }, [results]);

  useEffect(() => {
    if (!results) return;

    const interval = setInterval(() => {
      setCurrentSteps(prev => {
        const updated = { ...prev };
        let complete = true;

        results.forEach(algo => {
          const len = algo.solutionHistory?.length || 1;
          if (updated[algo.name] < len - 1) {
            updated[algo.name] += 1;
            complete = false;
          }
        });

        if (complete) {
          setAllComplete(true);
          clearInterval(interval);
        }

        return updated;
      });
    }, 500 / animationSpeed);

    return () => clearInterval(interval);
  }, [results, animationSpeed]);

  const metricsData = {
    labels: algorithms.map(a => a.name),
    datasets: [
      {
        label: 'Time (ms)',
        data: results?.map(r => r.time) || [],
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
        borderWidth: 1
      },
      {
        label: 'Memory (KB)',
        data: results?.map(r => r.memory) || [],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1
      },
      {
        label: 'Steps',
        data: results?.map(r => r.steps) || [],
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-20 transition-all duration-300 overflow-hidden ${results ? (expandedView ? 'h-[70vh]' : 'h-[120px]') : 'h-[48px]'}`}>
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-bold">Algorithm Comparison</h2>
          <div className="flex items-center gap-2">
            {results && (
              <button
                onClick={() => setExpandedView(!expandedView)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={expandedView ? 'Collapse' : 'Expand'}
              >
                {expandedView ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={runComparison}
              disabled={isLoading}
              className={`px-2 py-1 rounded text-white text-xs transition-colors ${isLoading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'Running...' : 'Compare'}
            </button>
          </div>
        </div>

        {(expandedView || results) && (
          <div className="flex-1 overflow-y-auto p-2">
            {results && (
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span>Speed:</span>
                <button onClick={() => setAnimationSpeed(s => Math.max(s - 0.5, 0.5))} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  Slower
                </button>
                <button onClick={() => setAnimationSpeed(s => Math.min(s + 0.5, 3))} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  Faster
                </button>
              </div>
            )}

            {error && (
              <div className="p-1 mb-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded text-xs">
                Error: {error}
              </div>
            )}

            {results && (
              <div className="space-y-2">
                {allComplete && expandedView && (
                  <div className="mb-2">
                    <h3 className="text-md font-semibold mb-1">Performance</h3>
                    <div className="h-48">
                      <Bar
                        data={metricsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: { y: { beginAtZero: true } },
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { font: { size: 10 } }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className={`grid ${expandedView ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-3'} gap-2`}>
                  {results.map(algo => (
                    <div key={algo.name} className="border rounded p-2" style={{ borderLeft: `3px solid ${algo.color}` }}>
                      <h3 className="font-bold mb-1 flex items-center text-sm">
                        <span style={{ color: algo.color }}>{algo.name}</span>
                        {algo.error ? (
                          <span className="text-red-500 text-xs ml-1">(Failed)</span>
                        ) : algo.conflicts > 0 ? (
                          <span className="text-yellow-500 text-xs ml-1">(Incomplete)</span>
                        ) : (
                          <span className="text-green-500 text-xs ml-1">(Solved)</span>
                        )}
                      </h3>

                      <div className="grid grid-cols-2 gap-1 mb-1 text-xs">
                        <div className="text-gray-500">Time:</div><div>{algo.time} ms</div>
                        <div className="text-gray-500">Memory:</div><div>{algo.memory?.toFixed(2)} KB</div>
                        <div className="text-gray-500">Steps:</div><div>{algo.steps}</div>
                        <div className="text-gray-500">Conflicts:</div><div className={algo.conflicts === 0 ? 'text-green-600' : 'text-red-600'}>{algo.conflicts}</div>
                      </div>

                      <LiveChessboard
                        solutionHistory={algo.solutionHistory}
                        currentStep={currentSteps[algo.name] || 0}
                        boardSize={boardSize}
                        compact={!expandedView}
                      />

                      <div className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1 truncate">
                        [{algo.solution?.join(', ') ?? Array(boardSize).fill('-1').join(', ')}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
