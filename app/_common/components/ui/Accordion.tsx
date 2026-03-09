import { useState } from 'react';
import { ChevronDown } from 'lucide-react';


export default function Accordion({ items = [], allowMultiple = false, defaultOpen = [] }) {
  const [openItems, setOpenItems] = useState(defaultOpen);

  const toggleItem = (index) => {
    if (allowMultiple) {
      setOpenItems(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems(prev => prev.includes(index) ? [] : [index]);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openItems.includes(index);
        return (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
              
            >
              <span className="font-medium text-gray-900">{item.title}</span>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
