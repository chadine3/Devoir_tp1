import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Target, Award, AlertTriangle, Move, Clock } from 'lucide-react';

const Explanation = ({ boardSize }) => {
  return (
    <motion.div
      className="info-box bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <h4 className="flex items-center gap-2 text-lg font-semibold mb-3">
        <HelpCircle className="text-blue-500 dark:text-blue-400"/> 
        Comment fonctionne l'algorithme ?
      </h4>
      
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Target className="flex-shrink-0 mt-1 text-green-500" />
          <div>
            <span className="font-medium">Objectif :</span> Placer {boardSize} reines sur un échiquier sans qu'elles se menacent mutuellement.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Move className="flex-shrink-0 mt-1 text-purple-500" />
          <div>
            <span className="font-medium">Actions :</span> À chaque étape, l'algorithme déplace une reine vers une nouvelle colonne dans sa rangée.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <AlertTriangle className="flex-shrink-0 mt-1 text-yellow-500" />
          <div>
            <span className="font-medium">Pénalités :</span> Chaque conflit (attaques entre reines) donne une pénalité négative.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Award className="flex-shrink-0 mt-1 text-blue-500" />
          <div>
            <span className="font-medium">Récompenses :</span> Réduire les conflits donne une récompense positive.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Clock className="flex-shrink-0 mt-1 text-gray-500" />
          <div>
            <span className="font-medium">Apprentissage :</span> L'algorithme mémorise les bons mouvements pour chaque configuration.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Explanation;