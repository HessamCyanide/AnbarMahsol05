import React, { useState, useEffect } from 'react';
import { BackspaceIcon } from './icons';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: (result: number) => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose, onCalculate }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const clearState = () => {
    setDisplayValue('0');
    setExpression('');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  useEffect(() => {
    if (isOpen) {
      clearState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const performCalculation = () => {
    if (firstOperand === null || operator === null) return parseFloat(displayValue);
    
    const secondOperand = parseFloat(displayValue);
    let result = 0;
    
    switch (operator) {
      case '+': result = firstOperand + secondOperand; break;
      case '-': result = firstOperand - secondOperand; break;
      case '*': result = firstOperand * secondOperand; break;
      case '/': result = secondOperand === 0 ? NaN : firstOperand / secondOperand; break;
      default: result = secondOperand;
    }
    return result;
  };
  
  const handleOperatorClick = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand) {
      setOperator(nextOperator);
      setExpression(firstOperand + ` ${nextOperator} `);
      return;
    }

    if (firstOperand === null) {
      setFirstOperand(inputValue);
      setExpression(displayValue + ` ${nextOperator} `);
    } else if (operator) {
      const result = performCalculation();
      if (isNaN(result)) {
        setDisplayValue('Error');
        setExpression('Error');
        return;
      }
      const roundedResult = Math.round(result * 1e10) / 1e10; // Round to avoid floating point issues
      setDisplayValue(String(roundedResult));
      setFirstOperand(roundedResult);
      setExpression(roundedResult + ` ${nextOperator} `);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const handleEqualsClick = () => {
    if (operator === null || firstOperand === null) return;
    const result = performCalculation();
    if (isNaN(result)) {
      setDisplayValue('Error');
      setExpression('Error');
    } else {
      const roundedResult = Math.round(result * 1e10) / 1e10;
      setDisplayValue(String(roundedResult));
      setExpression(expression + displayValue + ' =');
    }
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(true);
  };
  
  const handleDecimalClick = () => {
      if(waitingForSecondOperand) {
        setDisplayValue('0.');
        setWaitingForSecondOperand(false);
        return;
      }
      if (!displayValue.includes('.')) {
          setDisplayValue(displayValue + '.');
      }
  };

  const handleBackspace = () => {
    if (waitingForSecondOperand) return;
    if (displayValue.length > 1) {
        setDisplayValue(displayValue.slice(0, -1));
    } else {
        setDisplayValue('0');
    }
  };

  const handlePercentClick = () => {
    try {
        const result = parseFloat(displayValue) / 100;
        setDisplayValue(String(result));
    } catch {
        setDisplayValue('Error');
    }
  };
  
  const handleApply = () => {
    const finalValue = parseFloat(displayValue);
    if (!isNaN(finalValue) && finalValue >= 0) {
        onCalculate(Math.round(finalValue));
        onClose();
    } else {
        alert("مقدار نامعتبر است. مقدار باید یک عدد مثبت باشد.");
    }
  };

  const Button: React.FC<{ onClick: () => void; className?: string; children: React.ReactNode }> = ({ onClick, className = '', children }) => (
    <button type="button" onClick={onClick} className={`p-4 rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${className}`}>
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4" onClick={onClose}>
      <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-xs m-4" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900 text-white rounded-t-lg mb-2 p-4 text-right font-mono" dir="ltr">
          <div className="text-gray-400 text-xl h-7 truncate">{expression || ' '}</div>
          <div className="text-4xl break-all h-12 flex items-end justify-end">
            {displayValue}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={clearState} className="bg-gray-700 hover:bg-gray-600 text-yellow-400 focus:ring-yellow-500">C</Button>
          <Button onClick={handleBackspace} className="bg-gray-700 hover:bg-gray-600 text-yellow-400 focus:ring-yellow-500 flex justify-center items-center"><BackspaceIcon className="w-6 h-6"/></Button>
          <Button onClick={handlePercentClick} className="bg-gray-700 hover:bg-gray-600 text-yellow-400 focus:ring-yellow-500">%</Button>
          <Button onClick={() => handleOperatorClick('/')} className="bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-500">÷</Button>
          
          <Button onClick={() => handleDigitClick('7')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">7</Button>
          <Button onClick={() => handleDigitClick('8')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">8</Button>
          <Button onClick={() => handleDigitClick('9')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">9</Button>
          <Button onClick={() => handleOperatorClick('*')} className="bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-500">×</Button>
          
          <Button onClick={() => handleDigitClick('4')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">4</Button>
          <Button onClick={() => handleDigitClick('5')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">5</Button>
          <Button onClick={() => handleDigitClick('6')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">6</Button>
          <Button onClick={() => handleOperatorClick('-')} className="bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-500">-</Button>
          
          <Button onClick={() => handleDigitClick('1')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">1</Button>
          <Button onClick={() => handleDigitClick('2')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">2</Button>
          <Button onClick={() => handleDigitClick('3')} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">3</Button>
          <Button onClick={() => handleOperatorClick('+')} className="bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-500">+</Button>
          
          <Button onClick={() => handleDigitClick('0')} className="col-span-2 bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">0</Button>
          <Button onClick={handleDecimalClick} className="bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500">.</Button>
          <Button onClick={handleEqualsClick} className="bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-500">=</Button>
        </div>
        <div className="mt-2">
            <Button onClick={handleApply} className="w-full bg-green-600 hover:bg-green-500 text-white focus:ring-green-500">تایید</Button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;