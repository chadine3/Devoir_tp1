import { motion } from 'framer-motion';

const MAX_BARS = 50;

const RewardChart = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="mt-4">
        <h4 className="chart-title">Historique des Conflits</h4>
        <div className="chart-container flex items-center justify-center text-xs text-[var(--nq-panel-text)]">
          Démarrez la simulation pour voir le graphique.
        </div>
      </div>
    );
  }

  const conflictValues = history.map(item => 
    typeof item === 'object' ? item.conflicts || 0 : item
  );

  const maxConflicts = Math.max(...conflictValues, 1);
  const visibleHistory = conflictValues.slice(-MAX_BARS);

  return (
    <div className="mt-4">
      <h4 className="chart-title">Historique des Conflits (Dernières {visibleHistory.length} étapes)</h4>
      <div className="chart-container">
        {visibleHistory.map((conflicts, index) => {
          const heightPercentage = Math.max(1, (conflicts / maxConflicts) * 100);
          const stepNumber = history.length - visibleHistory.length + index + 1;
          
          return (
            <motion.div
              key={`${stepNumber}-${conflicts}`}
              className="chart-bar"
              initial={{ height: '0%' }}
              animate={{ height: `${heightPercentage}%` }}
              title={`Étape ${stepNumber}: ${conflicts} conflit${conflicts !== 1 ? 's' : ''}`}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RewardChart;