
import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#FEFFA7', // Pale
    lineColor: '#1a1a1a',
    secondaryColor: '#AFFC41', // Lime
    tertiaryColor: '#1a1a1a',
    fontSize: '16px',
    fontFamily: 'Inter, sans-serif',
  },
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis',
  },
});

interface MermaidChartProps {
  chart: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      
      // Sanitize the input
      let cleanChart = chart
        .replace(/```mermaid/g, '') // Remove markdown code blocks
        .replace(/```/g, '')
        .trim();
        
      // Fix common LLM syntax error: Missing delimiter between graph type and first node
      if (!cleanChart.includes(';')) {
         cleanChart = cleanChart.replace(/^((?:graph|flowchart)\s+(?:TD|TB|BT|RL|LR|[A-Z]+))\s+([a-zA-Z0-9])/i, '$1;\n$2');
      }

      // Ensure newlines are preserved
      cleanChart = cleanChart.replace(/\\n/g, '\n');

      mermaid.render(`mermaid-${Date.now()}`, cleanChart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
          // After rendering, ensure the SVG is responsive and larger
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', 'auto');
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto';
          }
        }
      }).catch(err => {
        console.error("Mermaid error:", err);
        if (ref.current) {
            ref.current.innerHTML = `
                <div class="text-xs text-red-500 p-2 border border-red-200 rounded bg-red-50 font-mono">
                    Failed to render diagram.
                    <br/>
                    <span class="opacity-50">${err.message?.substring(0, 50)}...</span>
                </div>
            `;
        }
      });
    }
  }, [chart]);

  return (
    <div 
      className="mermaid-container w-full flex justify-center py-2 overflow-x-auto min-h-[300px] flex-col items-center" 
      ref={ref} 
    />
  );
};

export default MermaidChart;
