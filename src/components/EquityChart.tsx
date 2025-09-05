import React, { FC } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { EquityPoint } from '../types';

interface EquityChartProps {
    data: EquityPoint[];
}

const CustomTooltip: FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-zinc-800 border border-zinc-700 p-2 text-xs text-white rounded-sm shadow-lg">
                <p className="font-bold">{`Trade #${data.tradeNumber}`}</p>
                <p className="text-cyan-400">{`Equity: ${data.equity.toFixed(2)}`}</p>
                <p className="text-zinc-400">{new Date(data.date).toLocaleDateString()}</p>
            </div>
        );
    }
    return null;
};

const EquityChart: FC<EquityChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-600">
                No equity data to display.
            </div>
        );
    }
    
    const initialEquity = data[0]?.equity || 100000;
    const finalEquity = data[data.length - 1]?.equity;
    const isProfitable = finalEquity >= initialEquity;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProfitable ? '#22c55e' : '#ef4444'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isProfitable ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                    dataKey="tradeNumber" 
                    tick={{ fontSize: 10, fill: '#a1a1aa' }} 
                    stroke="#3f3f46"
                    label={{ value: 'Trade Number', position: 'insideBottom', offset: -5, fill: '#71717a', fontSize: 11 }}
                />
                <YAxis 
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 10, fill: '#a1a1aa' }} 
                    stroke="#3f3f46"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke={isProfitable ? '#22c55e' : '#ef4444'}
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default EquityChart;
