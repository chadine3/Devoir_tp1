// components/nqueens/EducationPanel.jsx
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Info, BrainCircuit, Table } from 'lucide-react';

export const EducationPanel = () => {
  const [activeTab, setActiveTab] = useState('concepts');
  const [explorationRate, setExplorationRate] = useState(0.5);
  
  // Sample Q-table data
  const qTable = [
    { state: 'Start', action: 'Move Queen 1', value: 0.42 },
    { state: 'Mid-game', action: 'Move Queen 3', value: 0.78 },
    { state: 'End-game', action: 'Move Queen 8', value: 0.91 }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BrainCircuit className="text-purple-500" /> RL Education
      </h3>
      
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('concepts')}
          className={`px-4 py-2 ${activeTab === 'concepts' ? 'border-b-2 border-purple-500' : ''}`}
        >
          Concepts
        </button>
        <button
          onClick={() => setActiveTab('qtable')}
          className={`px-4 py-2 ${activeTab === 'qtable' ? 'border-b-2 border-purple-500' : ''}`}
        >
          Q-Table
        </button>
      </div>
      
      {activeTab === 'concepts' ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Info className="text-blue-500" /> Exploration vs Exploitation
            </h4>
            <div className="space-y-4">
              <Slider
                value={[explorationRate]}
                onValueChange={(val) => setExplorationRate(val[0])}
                min={0}
                max={1}
                step={0.01}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                  <p className="font-medium">Exploration</p>
                  <p className="text-sm">{(explorationRate * 100).toFixed(0)}%</p>
                  <p className="text-xs mt-1">Trying new moves</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
                  <p className="font-medium">Exploitation</p>
                  <p className="text-sm">{((1 - explorationRate) * 100).toFixed(0)}%</p>
                  <p className="text-xs mt-1">Using known moves</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <h4 className="font-medium mb-2">Reward System</h4>
            <p className="text-sm">
              The agent learns through rewards:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>+1 for each non-attacking queen pair</li>
                <li>-1 for each attacking queen pair</li>
                <li>+100 for solving the puzzle</li>
              </ul>
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2">State</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Q-Value</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {qTable.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{row.state}</td>
                  <td className="px-4 py-2">{row.action}</td>
                  <td className="px-4 py-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${row.value * 100}%` }}
                      />
                    </div>
                    <span className="text-xs">{row.value.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};