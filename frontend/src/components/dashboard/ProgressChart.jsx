import React from 'react';

export const ProgressChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-500">
        Complete your first interview to see score trends.
      </div>
    );
  }

  // Width and height of SVG viewport
  const width = 600;
  const height = 180;
  const padding = 30;

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

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 text-indigo-500 overflow-visible"
      >
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
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding - 8}
                y={y + 3}
                fill="#64748b"
                fontSize="9"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Line */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points & Labels */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#6366f1"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <text
              x={pt.x}
              y={pt.y - 10}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {pt.score}
            </text>
            <text
              x={pt.x}
              y={height - 8}
              fill="#94a3b8"
              fontSize="9"
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
