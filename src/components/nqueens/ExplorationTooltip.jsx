const ExplorationTooltip = ({ explorationRate, isExploring }) => (
  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-xs w-64">
    <div className="flex items-center mb-1">
      <span className="font-bold mr-2">Strategy:</span>
      <span className={isExploring ? "text-blue-500" : "text-green-500"}>
        {isExploring ? "Exploring" : "Exploiting"}
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full" 
        style={{ width: `${explorationRate * 100}%` }}
      ></div>
    </div>
    <div className="mt-1">
      {isExploring ? (
        <p>🔍 Randomly trying new positions (rate: {Math.round(explorationRate * 100)}%)</p>
      ) : (
        <p>💡 Using known good positions</p>
      )}
    </div>
  </div>
);