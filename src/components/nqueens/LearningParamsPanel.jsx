import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const LearningParamsPanel = ({ params, setParams, disabled }) => {
  const handleParamChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Paramètres d'Apprentissage</h3>
      
      <div className="space-y-4">
        <div>
          <Label>Taux d'Apprentissage (α)</Label>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[params.learningRate]}
            onValueChange={(v) => handleParamChange('learningRate', v)}
            disabled={disabled}
          />
          <div className="text-sm text-gray-500">{params.learningRate.toFixed(2)}</div>
        </div>
        
        <div>
          <Label>Facteur d'Actualisation (γ)</Label>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[params.discountFactor]}
            onValueChange={(v) => handleParamChange('discountFactor', v)}
            disabled={disabled}
          />
          <div className="text-sm text-gray-500">{params.discountFactor.toFixed(2)}</div>
        </div>
        
        <div>
          <Label>Taux d'Exploration (ε)</Label>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[params.explorationRate]}
            onValueChange={(v) => handleParamChange('explorationRate', v)}
            disabled={disabled}
          />
          <div className="text-sm text-gray-500">{params.explorationRate.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default LearningParamsPanel;