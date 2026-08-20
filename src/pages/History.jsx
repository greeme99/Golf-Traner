import { useContext, useMemo, useState } from 'react';
import { AnalysisContext } from '../contexts/AnalysisContext';
import Card from '../components/common/Card';
import { Activity, Download, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './History.css';

const History = () => {
  const { history } = useContext(AnalysisContext);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Parse metrics helper
  const getParsedItem = (item) => {
    const m = item.result?.metrics || {};
    const tempoStr = m.tempo || "0:1";
    const tempoVal = parseFloat(tempoStr.split(':')[0]) || 0;
    const spineStr = m.spineAngle || "0°";
    const spineVal = parseInt(spineStr.replace('°', ''), 10) || 0;
    
    return {
      id: item.id,
      rawDate: item.date,
      dateFormatted: new Date(item.date).toLocaleString(),
      tempoStr: m.tempo || 'N/A',
      tempoVal: tempoVal,
      spineStr: m.spineAngle || 'N/A',
      spineVal: spineVal,
      headMovement: m.headMovement || 'N/A',
      clubSpeed: m.clubSpeed || 'N/A',
      lessonTitle: item.result?.lesson?.title || 'Swing Analysis'
    };
  };

  const parsedHistory = useMemo(() => {
    return history.map(getParsedItem);
  }, [history]);

  // Sort logic for Data Table
  const sortedHistory = useMemo(() => {
    const sorted = [...parsedHistory];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'date') {
        aVal = new Date(a.rawDate).getTime();
        bVal = new Date(b.rawDate).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [parsedHistory, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render sort indicator according to AGENTS.md Rule 4-9
  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon inactive" title="Sort Column">⇅</span>;
    }
    return (
      <span className="sort-icon active">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Prepare chart data (chronological order)
  const chartData = useMemo(() => {
    return [...parsedHistory].reverse().map((item, idx) => ({
      name: `T${idx + 1}`,
      date: new Date(item.rawDate).toLocaleDateString(),
      tempo: item.tempoVal,
      spineAngle: item.spineVal
    }));
  }, [parsedHistory]);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Date', 'Tempo', 'Spine Angle', 'Head Movement', 'Club Speed', 'Lesson Title'];
    const rows = parsedHistory.map(item => {
      const date = new Date(item.rawDate).toISOString().split('T')[0];
      return [date, item.tempoStr, item.spineStr, item.headMovement, item.clubSpeed, `"${item.lessonTitle}"`].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "smart_swing_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h2>Analysis History</h2>
          <p className="history-subtitle">Track your biomechanics progress & swing metrics over time</p>
        </div>
        <button className="export-btn" onClick={handleExportCSV} disabled={history.length === 0}>
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {history.length > 0 && (
        <Card className="chart-card">
          <h3>Trend: Tempo & Spine Angle</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-strong)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text-main)'
                  }} 
                />
                <Line yAxisId="left" type="monotone" dataKey="tempo" stroke="#0066FF" strokeWidth={2.5} dot={{r: 4, fill: '#0066FF'}} name="Tempo" />
                <Line yAxisId="right" type="monotone" dataKey="spineAngle" stroke="#FF6B4A" strokeWidth={2.5} dot={{r: 4, fill: '#FF6B4A'}} name="Spine Angle(°)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* AGENTS.md Compliant Data Table */}
      <Card className="history-table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <Activity size={18} />
            <span>Recorded Sessions ({history.length})</span>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="data-table-responsive">
            <table className="history-data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')} className="sortable-col">
                    <div className="col-header-content">
                      <span>Date</span>
                      {renderSortIndicator('date')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('tempoVal')} className="sortable-col">
                    <div className="col-header-content">
                      <span>Tempo Ratio</span>
                      {renderSortIndicator('tempoVal')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('spineVal')} className="sortable-col">
                    <div className="col-header-content">
                      <span>Spine Angle</span>
                      {renderSortIndicator('spineVal')}
                    </div>
                  </th>
                  <th>
                    <div className="col-header-content">
                      <span>Head Move</span>
                    </div>
                  </th>
                  <th>
                    <div className="col-header-content">
                      <span>Lesson / Diagnosis</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((item) => (
                  <tr key={item.id} className="table-row-item">
                    <td className="cell-date">
                      <div className="date-cell-content">
                        <Calendar size={14} className="cell-icon" />
                        <span>{item.dateFormatted}</span>
                      </div>
                    </td>
                    <td className="cell-metric">
                      <span className="metric-pill tempo-pill">{item.tempoStr}</span>
                    </td>
                    <td className="cell-metric">
                      <span className="metric-pill spine-pill">{item.spineStr}</span>
                    </td>
                    <td className="cell-metric">{item.headMovement}</td>
                    <td className="cell-lesson">
                      <div className="lesson-badge">
                        <span>{item.lessonTitle}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No analysis history records available yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default History;

