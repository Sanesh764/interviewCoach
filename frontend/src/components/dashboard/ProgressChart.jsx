import React from 'react';

export const ProgressChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#444444] rounded-2xl bg-[#1C1C1C]">
        <p className="text-xs text-[#A0A0A0] font-medium">No score history available yet.</p>
        <p className="text-[11px] text-[#707070] mt-1">Complete your first interview to visualize score trajectories.</p>
      </div>
    );
  }

  // Width and height of SVG viewport
  const width = 600;
  const height = 190;
  const padding = 34;

  const points = data.map((item, idx) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const score = item.overallScore || 0;
    const y = height - padding - (score / 100) * (height - 2 * padding);
    return { x, y, score, label: item.role || `Int ${idx + 1}` };
  });

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce(
          (acc, pt, i) =>
            i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
          ''
        );

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-48 overflow-visible"
      >
        <defs>
          <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8FF00" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#B8FF00" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[25, 50, 75, 100].map((val) => {
          const y = height - padding - (val / 100) * (height - 2 * padding);
          return (
            <g key={val}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#333333"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={y + 3.5}
                fill="#A0A0A0"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill in Lime */}
        {points.length > 1 && (
          <path d={areaD} fill="url(#scoreAreaGradient)" />
        )}

        {/* Connecting Stroke Line in Lime #B8FF00 */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#B8FF00"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points & Labels */}
        {points.map((pt, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#B8FF00"
              stroke="#222222"
              strokeWidth="2.5"
            />
            <text
              x={pt.x}
              y={pt.y - 10}
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              {pt.score}
            </text>
            <text
              x={pt.x}
              y={height - 10}
              fill="#A0A0A0"
              fontSize="10"
              textAnchor="middle"
            >
              #{idx + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
